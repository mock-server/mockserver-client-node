/*
 * mockserver
 * http://mock-server.com
 *
 * Copyright (c) 2014 James Bloom
 * Licensed under the Apache License, Version 2.0
 */
var proxyClient;

(function () {
    "use strict";

    var makeRequest = (typeof require !== 'undefined' ? require('./sendRequest').sendRequest : function (host, port, path, jsonBody, resolveCallback) {
        var body = (typeof jsonBody === "string" ? jsonBody : JSON.stringify(jsonBody || ""));
        var url = 'http://' + host + ':' + port + path;

        return {
            then: function (sucess, error) {
                try {
                    var xmlhttp = new XMLHttpRequest();
                    xmlhttp.addEventListener("load", (function (sucess, error) {
                        return function () {
                            if (error && this.status >= 400 && this.status < 600) {
                                if (this.statusCode === 404) {
                                    error("404 Not Found");
                                } else {
                                    error(this.responseText);
                                }
                            } else {
                                sucess && sucess({
                                    statusCode: this.status,
                                    body: this.responseText
                                });
                            }
                        };
                    })(sucess, error));
                    xmlhttp.open('PUT', url);
                    xmlhttp.setRequestHeader("Content-Type", "application/json; charset=utf-8");
                    xmlhttp.send(body);
                } catch (e) {
                    error && error(e);
                }
            }
        };
    });

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

        var addDefaultRequestMatcherHeaders = function (pathOrRequestMatcher) {
            var responseMatcher;
            if (typeof pathOrRequestMatcher === "string") {
                responseMatcher = {
                    path: pathOrRequestMatcher
                };
            } else if (typeof pathOrRequestMatcher === "object") {
                responseMatcher = pathOrRequestMatcher;
            } else {
                responseMatcher = {
                    path: ".*"
                };
            }
            return responseMatcher;
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
            return {
                then: function (sucess, error) {
                    return makeRequest(host, port, "/verify", {
                        "httpRequest": request,
                        "times": {
                            "count": count,
                            "exact": exact
                        }
                    }).then(
                        function () {
                            sucess && sucess();
                        },
                        function (result) {
                            if (!result.statusCode || result.statusCode !== 202) {
                                error && error(result);
                            } else {
                                error && sucess(result);
                            }
                        }
                    );
                }
            };
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
            return {
                then: function (sucess, error) {
                    return makeRequest(host, port, "/verifySequence", {
                        "httpRequests": requestSequence
                    }).then(
                        function () {
                            sucess && sucess();
                        },
                        function (result) {
                            if (!result.statusCode || result.statusCode !== 202) {
                                error && error(result);
                            } else {
                                error && sucess(result);
                            }
                        }
                    );
                }
            };
        };
        /**
         * Reset the proxy by clearing all recorded requests
         */
        var reset = function () {
            return makeRequest(host, port, "/reset");
        };
        /**
         * Clear all recorded requests, recorded expectations and logs that match the specified path
         *
         * @param pathOrRequestMatcher  if a string is passed in the value will be treated as the path to
         *                              decide which recorded requests to cleared, however if an object is
         *                              passed in the value will be treated as a full request matcher object
         * @param type                  the type to clear 'EXPECTATIONS', 'LOG' or 'ALL', defaults to 'ALL' if not specified
         */
        var clear = function (pathOrRequestMatcher, type) {
            if (type) {
                var typeEnum = ['EXPECTATIONS', 'LOG', 'ALL'];
                if (typeEnum.indexOf(type) === -1) {
                    throw new Error("\"" + (type || "undefined") + "\" is not a supported value for \"type\" parameter only " + typeEnum + " are allowed values");
                }
            }
            return makeRequest(host, port, "/clear" + (type ? "?type=" + type : ""), addDefaultRequestMatcherHeaders(pathOrRequestMatcher));
        };

        /**
         * Retrieve the recorded requests that match the parameter, as follows:
         * - use a string value to match on path,
         * - use a request matcher object to match on a full request,
         * - or use null to retrieve all requests
         *
         * @param pathOrRequestMatcher  if a string is passed in the value will be treated as the path, however
         *                              if an object is passed in the value will be treated as a full request
         *                              matcher object, if null is passed in it will be treated as match all
         */
        var retrieveRecordedRequests = function (pathOrRequestMatcher) {
            return {
                then: function (sucess, error) {
                    makeRequest(host, port, "/retrieve?type=REQUESTS&format=JSON", addDefaultRequestMatcherHeaders(pathOrRequestMatcher))
                        .then(function (result) {
                            sucess(result.body && JSON.parse(result.body));
                        });
                }
            };
        };
        /**
         * Retrieve the request-response pairs as expectations that match the
         * parameter, expectations are retrieved by matching the parameter
         * on the expectations own request matcher, as follows:
         * - use a string value to match on path,
         * - use a request matcher object to match on a full request,
         * - or use null to retrieve all requests
         *
         * @param pathOrRequestMatcher  if a string is passed in the value will be treated as the path, however
         *                              if an object is passed in the value will be treated as a full request
         *                              matcher object, if null is passed in it will be treated as match all
         */
        var retrieveRecordedExpectations = function (pathOrRequestMatcher) {
            return {
                then: function (sucess, error) {
                    return makeRequest(host, port, "/retrieve?type=RECORDED_EXPECTATIONS&format=JSON", addDefaultRequestMatcherHeaders(pathOrRequestMatcher))
                        .then(function (result) {
                            sucess(result.body && JSON.parse(result.body));
                        });
                }
            };
        };
        /**
         * Retrieve logs messages for expectation matching, verification, clearing, etc,
         * log messages are filtered by request matcher as follows:
         * - use a string value to match on path,
         * - use a request matcher object to match on a full request,
         * - or use null to retrieve all requests
         *
         * @param pathOrRequestMatcher  if a string is passed in the value will be treated as the path, however
         *                              if an object is passed in the value will be treated as a full request
         *                              matcher object, if null is passed in it will be treated as match all
         */
        var retrieveLogMessages = function (pathOrRequestMatcher) {
            return {
                then: function (sucess, error) {
                    return makeRequest(host, port, "/retrieve?type=LOGS", addDefaultRequestMatcherHeaders(pathOrRequestMatcher))
                        .then(function (result) {
                            sucess(result.body && result.body.split("------------------------------------"));
                        });
                }
            };
        };

        var _this = {
            verify: verify,
            verifySequence: verifySequence,
            reset: reset,
            clear: clear,
            retrieveRecordedRequests: retrieveRecordedRequests,
            retrieveRecordedExpectations: retrieveRecordedExpectations,
            retrieveLogMessages: retrieveLogMessages
        };
        return _this;
    };

    if (typeof module !== 'undefined') {
        module.exports = {
            proxyClient: proxyClient
        };
    }
})();