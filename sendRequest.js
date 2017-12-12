/*
 * mockserver
 * http://mock-server.com
 *
 * Copyright (c) 2014 James Bloom
 * Licensed under the Apache License, Version 2.0
 */
(function () {
    "use strict";

    if (module && require) {
        var Q = require('q');
        var http = require('http');

        var defer = function () {
            var promise = (global.protractor ? protractor.promise : Q);
            var deferred = promise.defer();

            if (deferred.fulfill && !deferred.resolve) {
                deferred.resolve = deferred.fulfill;
            }
            return deferred;
        };

        var sendRequest = function (host, port, path, jsonBody, resolveCallback) {

            var deferred = defer();

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

                response.on('data', function (chunk) {
                    data += chunk;
                });

                response.on('end', function () {
                    if (resolveCallback) {
                        deferred.resolve(resolveCallback(data));
                    } else {
                        if (response.statusCode >= 400 && response.statusCode < 600) {
                            if (response.statusCode === 404) {
                                deferred.reject("404 Not Found");
                            } else {
                                deferred.reject(data);
                            }
                        } else {
                            deferred.resolve({
                                statusCode: response.statusCode,
                                body: data
                            });
                        }
                    }
                });
            });

            req.once('error', function (error) {
                if (error.code && error.code === "ECONNREFUSED") {
                    deferred.reject("Can't connect to MockServer running on host: \"" + host + "\" and port: \"" + port + "\"");
                } else {
                    deferred.reject(JSON.stringify(error));
                }
            });

            req.write(body);
            req.end();

            return deferred.promise;
        };

        module.exports = {
            sendRequest: sendRequest
        };
    }
})();