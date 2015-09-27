/*
 * mockserver
 * http://mock-server.com
 *
 * Copyright (c) 2014 James Bloom
 * Licensed under the Apache License, Version 2.0
 */

(function () {
    "use strict";

    var Q = require('q');
    var http = require('http');

    function sendRequest(host, port, path, jsonBody) {
        var promise = (global.protractor ? protractor.promise : Q);
        var deferred = promise.defer();

        if (global.protractor)
        {
            deferred.resolve = deferred.fulfill;
        }

        var body = (typeof jsonBody === "string" ? jsonBody : JSON.stringify(jsonBody || ""));
        var options = {
            method: 'PUT',
            host: host,
            path: path,
            port: port,
            headers: {
                'Content-Type': "application/json; charset=utf-8"
            }
        };

        var req = http.request(options);

        req.once('response', function (response) {
            var data = '';

            if (response.statusCode === 400 || response.statusCode === 404) {
                deferred.reject(response.statusCode);
            }

            response.on('data', function (chunk) {
                data += chunk;
            });

            response.on('end', function () {
                deferred.resolve({
                    statusCode: response.statusCode,
                    body: data
                });
            });
        });

        req.once('error', function (error) {
            deferred.reject(error);
        });

        req.write(body);
        req.end();

        return deferred.promise;
    }

    /**
     * Start the client communicating to a MockServer at the specified host and port
     * for example:
     *
     *   var client = mockServerClient("localhost", 1080);
     *
     * @param host the host for the MockServer to communicate with
     * @param port the port for the MockServer to communicate with
     */
    var mockServerClient = function (host, port) {

            /**
             * The default headers added to to the mocked response when using mockSimpleResponse(...)
             */
            var defaultResponseHeaders = [
                {"name": "Content-Type", "values": ["application/json; charset=utf-8"]},
                {"name": "Cache-Control", "values": ["no-cache, no-store"]}
            ];
            var createResponseMatcher = function (path) {
                return {
                    method: "",
                    path: path,
                    body: "",
                    headers: [],
                    cookies: [],
                    queryStringParameters: []
                };
            };
            var createExpectation = function (path, responseBody, statusCode) {
                return {
                    httpRequest: createResponseMatcher(path),
                    httpResponse: {
                        statusCode: statusCode || 200,
                        body: JSON.stringify(responseBody),
                        cookies: [],
                        headers: defaultResponseHeaders,
                        delay: {
                            timeUnit: "MICROSECONDS",
                            value: 0
                        }
                    },
                    times: {
                        remainingTimes: 1,
                        unlimited: false
                    }
                };
            };
            /**
             * Setup an expectation in the MockServer by specifying an expectation object
             * for example:
             *
             *   mockServerClient("localhost", 1080).mockAnyResponse(
             *       {
             *           'httpRequest': {
             *               'path': '/somePath',
             *               'body': {
             *                   'type': "STRING",
             *                   'value': 'someBody'
             *               }
             *           },
             *           'httpResponse': {
             *               'statusCode': 200,
             *               'body': Base64.encode(JSON.stringify({ name: 'first_body' })),
             *               'delay': {
             *                   'timeUnit': 'MILLISECONDS',
             *                   'value': 250
             *               }
             *           },
             *           'times': {
             *               'remainingTimes': 1,
             *               'unlimited': false
             *           }
             *       }
             *   );
             *
             * @param expectation the expectation to setup on the MockServer
             */
            var mockAnyResponse = function (expectation) {
                return sendRequest(host, port, "/expectation", expectation);
            };
            /**
             * Setup an expectation in the MockServer without having to specify the full expectation object
             * for example:
             *
             *   mockServerClient("localhost", 1080).mockSimpleResponse('/somePath', { name: 'value' }, 203);
             *
             * @param path the path to match requests against
             * @param responseBody the response body to return if a request matches
             * @param statusCode the response code to return if a request matches
             */
            var mockSimpleResponse = function (path, responseBody, statusCode) {
                return mockAnyResponse(createExpectation(path, responseBody, statusCode));
            };
            /**
             * Override the default headers that are used to specify the response headers in mockSimpleResponse(...)
             * (note: if you use mockAnyResponse(...) the default headers are not used)
             * for example:
             *
             *   mockServerClient("localhost", 1080).setDefaultHeaders([
             *       {"name": "Content-Type", "values": ["application/json; charset=utf-8"]},
             *       {"name": "Cache-Control", "values": ["no-cache, no-store"]}
             *   ])
             *
             * @param headers the path to match requests against
             */
            var setDefaultHeaders = function (headers) {
                defaultResponseHeaders = headers;
            };
            /**
             * Verify a request has been sent for example:
             *
             *   expect(client.verify({
             *       'httpRequest': {
             *           'method': 'POST',
             *           'path': '/somePath'
             *       }
             *   })).toBeTruthy();
             *
             * @param request the http request that must be matched for this verification to pass
             * @param count   the number of times this request must be matched
             * @param exact   true if the count is matched as "equal to" or false if the count is matched as "greater than or equal to"
             */
            var verify = function (request, count, exact) {
                if (count === undefined) {
                    count = 1;
                }
                return sendRequest(host, port, "/verify", {
                    "httpRequest": request,
                    "times": {
                        "count": count,
                        "exact": exact
                    }
                }).then(function (result) {
                    if (result.statusCode !== 202) {
                        console && console.error && console.error(result.body);
                        throw result.body;
                    }
                    return _this;
                });
            };
            /**
             * Verify a sequence of requests has been sent for example:
             *
             *   client.verifySequence(
             *       {
             *          'method': 'POST',
             *          'path': '/first_request'
             *       },
             *       {
             *          'method': 'POST',
             *          'path': '/second_request'
             *       },
             *       {
             *          'method': 'POST',
             *          'path': '/third_request'
             *       }
             *   );
             *
             * @param arguments the list of http requests that must be matched for this verification to pass
             */
            var verifySequence = function () {
                var requestSequence = [];
                for (var i = 0; i < arguments.length; i++) {
                    requestSequence.push(arguments[i]);
                }
                return sendRequest(host, port, "/verifySequence", {
                    "httpRequests": requestSequence
                }).then(function (result) {
                    if (result.statusCode !== 202) {
                        console && console.error && console.error(result.body);
                        throw result.body;
                    }
                    return _this;
                });
            };
            /**
             * Reset MockServer by clearing all expectations
             */
            var reset = function () {
                return sendRequest(host, port, "/reset");
            };
            /**
             * Clear all expectations that match the specified path
             *
             * @param pathOrRequestMatcher  if a string is passed in the value will be treated as the path to
             *                              decide which expectations to cleared, however if an object is passed
             *                              in the value will be treated as a full request matcher object
             */
            var clear = function (pathOrRequestMatcher) {
                if (typeof pathOrRequestMatcher === "string") {
                    return sendRequest(host, port, "/clear", createResponseMatcher(pathOrRequestMatcher));
                } else if (pathOrRequestMatcher) {
                    return sendRequest(host, port, "/clear", pathOrRequestMatcher);
                } else {
                    return sendRequest(host, port, "/clear", createResponseMatcher(".*"));
                }
            };
            /**
             * Pretty-print the json for all expectations for the specified path.
             * This is particularly helpful when debugging expectations. The expectation
             * are printed into a dedicated log called mockserver_request.log
             *
             * @param pathOrRequestMatcher  if a string is passed in the value will be treated as the path to
             *                              decide which expectations to cleared, however if an object is passed
             *                              in the value will be treated as a full request matcher object
             */
            var dumpToLogs = function (pathOrRequestMatcher) {
                if (typeof pathOrRequestMatcher === "string") {
                    return sendRequest(host, port, "/dumpToLog", createResponseMatcher(pathOrRequestMatcher));
                } else if (pathOrRequestMatcher) {
                    return sendRequest(host, port, "/dumpToLog", pathOrRequestMatcher);
                } else {
                    return sendRequest(host, port, "/dumpToLog", createResponseMatcher(".*"));
                }
            };

            var _this = {
                mockAnyResponse: mockAnyResponse,
                mockSimpleResponse: mockSimpleResponse,
                setDefaultHeaders: setDefaultHeaders,
                verify: verify,
                verifySequence: verifySequence,
                reset: reset,
                clear: clear,
                dumpToLogs: dumpToLogs
            };
            return  _this;
        },
        /**
         * Start the client communicating to a MockServer proxy at the specified host and port
         * for example:
         *
         *   var client = proxyClient("localhost", 1080);
         *
         * @param host the host for the proxy to communicate with
         * @param port the port for the proxy to communicate with
         */
        proxyClient = function (host, port) {

            var createResponseMatcher = function (path) {
                return {
                    method: "",
                    path: path,
                    body: "",
                    headers: [],
                    cookies: [],
                    queryStringParameters: []
                };
            };
            /**
             * Verify a request has been sent for example:
             *
             *   expect(client.verify({
             *       'httpRequest': {
             *           'method': 'POST',
             *           'path': '/somePath'
             *       }
             *   })).toBeTruthy();
             *
             * @param request the http request that must be matched for this verification to pass
             * @param count   the number of times this request must be matched
             * @param exact   true if the count is matched as "equal to" or false if the count is matched as "greater than or equal to"
             */
            var verify = function (request, count, exact) {
                if (count === undefined) {
                    count = 1;
                }
                return sendRequest(host, port, "/verify", JSON.stringify({
                    "httpRequest": request,
                    "times": {
                        "count": count,
                        "exact": exact
                    }
                })).then(function (result) {
                    if (result.statusCode !== 202) {
                        console && console.error && console.error(result.body);
                        throw result.body;
                    }
                    return _this;
                });
            };
            /**
             * Verify a sequence of requests has been sent for example:
             *
             *   client.verifySequence(
             *       {
             *          'method': 'POST',
             *          'path': '/first_request'
             *       },
             *       {
             *          'method': 'POST',
             *          'path': '/second_request'
             *       },
             *       {
             *          'method': 'POST',
             *          'path': '/third_request'
             *       }
             *   );
             *
             * @param arguments the list of http requests that must be matched for this verification to pass
             */
            var verifySequence = function () {
                var requestSequence = [];
                for (var i = 0; i < arguments.length; i++) {
                    requestSequence.push(arguments[i]);
                }
                return sendRequest(host, port, "/verifySequence", JSON.stringify({
                    "httpRequests": requestSequence
                })).then(function (result) {
                    if (result.statusCode !== 202) {
                        console && console.error && console.error(result.body);
                        throw result.body;
                    }
                    return _this;
                });
            };
            /**
             * Reset the proxy by clearing all recorded requests
             */
            var reset = function () {
                return sendRequest(host, port, "/reset");
            };
            /**
             * Clear all recorded requests that match the specified path
             *
             * @param pathOrRequestMatcher  if a string is passed in the value will be treated as the path to
             *                              decide which recorded requests to cleared, however if an object is
             *                              passed in the value will be treated as a full request matcher object
             */
            var clear = function (pathOrRequestMatcher) {
                if (typeof pathOrRequestMatcher === "string") {
                    return sendRequest(host, port, "/clear", createResponseMatcher(pathOrRequestMatcher));
                } else if (pathOrRequestMatcher) {
                    return sendRequest(host, port, "/clear", pathOrRequestMatcher);
                } else {
                    return sendRequest(host, port, "/clear", createResponseMatcher(".*"));
                }
            };
            /**
             * Pretty-print the json for all requests / responses that match the specified path
             * as Expectations to the log. They are printed into a dedicated log called mockserver_request.log
             *
             * @param pathOrRequestMatcher  if a string is passed in the value will be treated as the path to
             *                              decide which recorded requests to cleared, however if an object is
             *                              passed in the value will be treated as a full request matcher object
             */
            var dumpToLogs = function (pathOrRequestMatcher) {
                if (typeof pathOrRequestMatcher === "string") {
                    return sendRequest(host, port, "/dumpToLog", createResponseMatcher(pathOrRequestMatcher));
                } else if (pathOrRequestMatcher) {
                    return sendRequest(host, port, "/dumpToLog", pathOrRequestMatcher);
                } else {
                    return sendRequest(host, port, "/dumpToLog", createResponseMatcher(".*"));
                }
            };

            var _this = {
                verify: verify,
                verifySequence: verifySequence,
                reset: reset,
                clear: clear,
                dumpToLogs: dumpToLogs
            };
            return  _this;
        };

    module.exports = {
        mockServerClient: mockServerClient,
        proxyClient: proxyClient
    };
})();