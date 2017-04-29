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
                            sucess && sucess({
                                statusCode: this.status,
                                description: this.status + " " + this.statusText,
                                body: this.responseText
                            });
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
            return {
                then: function (sucess, error) {
                    return makeRequest(host, port, "/verify", {
                        "httpRequest": request,
                        "times": {
                            "count": count,
                            "exact": exact
                        }
                    }).then(function (result) {
                        if (result.statusCode !== 202) {
                            error && error(result.body);
                        } else {
                            sucess && sucess();
                        }
                    });
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
                    }).then(function (result) {
                        if (result.statusCode !== 202) {
                            error && error(result.body);
                        } else {
                            sucess && sucess();
                        }
                    });
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
         * Clear all recorded requests that match the specified path
         *
         * @param pathOrRequestMatcher  if a string is passed in the value will be treated as the path to
         *                              decide which recorded requests to cleared, however if an object is
         *                              passed in the value will be treated as a full request matcher object
         */
        var clear = function (pathOrRequestMatcher) {
            if (typeof pathOrRequestMatcher === "string") {
                return makeRequest(host, port, "/clear", createResponseMatcher(pathOrRequestMatcher));
            } else if (pathOrRequestMatcher) {
                return makeRequest(host, port, "/clear", pathOrRequestMatcher);
            } else {
                return makeRequest(host, port, "/clear", createResponseMatcher(".*"));
            }
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
        var retrieveRequests = function (pathOrRequestMatcher) {
            return {
                then: function (sucess, error) {
                    if (typeof pathOrRequestMatcher === "string") {
                        makeRequest(host, port, "/retrieve", createResponseMatcher(pathOrRequestMatcher))
                            .then(function (result) {
                                sucess(result.body && JSON.parse(result.body));
                            });
                    } else if (pathOrRequestMatcher) {
                        makeRequest(host, port, "/retrieve", pathOrRequestMatcher)
                            .then(function (result) {
                                sucess(result.body && JSON.parse(result.body));
                            });
                    } else {
                        makeRequest(host, port, "/retrieve", createResponseMatcher(".*"))
                            .then(function (result) {
                                sucess(result.body && JSON.parse(result.body));
                            });
                    }
                }
            };
        };
        /**
         * Retrieve the setup expectations that match the parameter,
         * the expectation is retrieved by matching the parameter
         * on the expectations own request matcher, as follows:
         * - use a string value to match on path,
         * - use a request matcher object to match on a full request,
         * - or use null to retrieve all requests
         *
         * @param pathOrRequestMatcher  if a string is passed in the value will be treated as the path to
         *                              decide which recorded requests to cleared, however if an object is
         *                              passed in the value will be treated as a full request matcher object
         */
        var dumpToLogs = function (pathOrRequestMatcher) {
            if (typeof pathOrRequestMatcher === "string") {
                return makeRequest(host, port, "/dumpToLog", createResponseMatcher(pathOrRequestMatcher));
            } else if (pathOrRequestMatcher) {
                return makeRequest(host, port, "/dumpToLog", pathOrRequestMatcher);
            } else {
                return makeRequest(host, port, "/dumpToLog", createResponseMatcher(".*"));
            }
        };

        return {
            verify: verify,
            verifySequence: verifySequence,
            reset: reset,
            clear: clear,
            retrieveRequests: retrieveRequests,
            dumpToLogs: dumpToLogs
        };
    };

    if (typeof module !== 'undefined') {
        module.exports = {
            proxyClient: proxyClient
        };
    }
})();