(function () {

    'use strict';

    var mockServer = require('../../');
    var mockServerClient = mockServer.mockServerClient;
    var proxyClient = mockServer.proxyClient;
    var Q = require('q');
    var http = require('http');

    function sendRequestViaProxy(destinationUrl, jsonBody) {
        var deferred = Q.defer();

        var body = (typeof jsonBody === "string" ? jsonBody : JSON.stringify(jsonBody || ""));
        var options = {
            method: "POST",
            host: "localhost",
            port: 1090,
            headers: {
                Host: "localhost:1080"
            },
            path: destinationUrl
        };

        var callback = function (response) {
            var body = '';

            if (response.statusCode === 400 || response.statusCode === 404) {
                deferred.reject(response.statusCode);
            }

            response.on('data', function (chunk) {
                body += chunk;
            });

            response.on('end', function () {
                deferred.resolve({
                    statusCode: response.statusCode,
                    headers: response.headers,
                    body: body
                });
            });
        };

        var req = http.request(options, callback);
        req.write(body);
        req.end();

        return deferred.promise;
    }

    exports.mock_server_started = {
        setUp: function (callback) {
            mockServerClient("localhost", 1080).reset().then(function () {
                proxyClient("localhost", 1090).reset().then(function () {
                    callback();
                }, function (error) {
                    throw 'Failed with error ' + JSON.stringify(error);
                });
            }, function (error) {
                throw 'Failed with error ' + JSON.stringify(error);
            });
        },

        'should verify exact number of requests have been sent': function (test) {
            // given - a client
            var client = proxyClient("localhost", 1090);
            // and - a request
            sendRequestViaProxy("http://localhost:1080/somePath", "someBody")
                .then(function (response) {
                    test.ok(false, "expecting 404 response");
                }, function (error) {
                    test.equal(error, 404);
                }).then(function () {
                    // and - another request
                    sendRequestViaProxy("http://localhost:1080/somePath", "someBody")
                        .then(function (response) {
                            test.ok(false, "expecting 404 response");
                        }, function (error) {
                            test.equal(error, 404);
                        }).then(function () {


                            // and - a verification that passes
                            client.verify(
                                {
                                    'method': 'POST',
                                    'path': '/somePath',
                                    'body': 'someBody'
                                }, 2, true).then(function () {
                                    test.done();
                                }, function () {
                                    test.ok(false, "verification should pass");
                                    test.done();
                                });
                        });
                });
        },

        'should verify at least a number of requests have been sent': function (test) {
            // given - a client
            var client = proxyClient("localhost", 1090);
            // and - a request
            sendRequestViaProxy("http://localhost:1080/somePath", "someBody")
                .then(function (response) {
                    test.ok(false, "expecting 404 response");
                }, function (error) {
                    test.equal(error, 404);
                }).then(function () {
                    // and - another request
                    sendRequestViaProxy("http://localhost:1080/someOtherPath", "someBody")
                        .then(function (response) {
                            test.ok(false, "expecting 404 response");
                        }, function (error) {
                            test.equal(error, 404);
                        }).then(function () {


                            // and - a verification that passes
                            client.verify(
                                {
                                    'method': 'POST',
                                    'path': '/somePath',
                                    'body': 'someBody'
                                }, 1).then(function () {
                                    test.done();
                                }, function () {
                                    test.ok(false, "verification should pass");
                                    test.done();
                                });
                        });
                });
        },

        'should fail when no requests have been sent': function (test) {
            // given - a client
            var client = proxyClient("localhost", 1090);
            // and - a request
            sendRequestViaProxy("http://localhost:1080/somePath", "someBody")
                .then(function (response) {
                    test.ok(false, "expecting 404 response");
                }, function (error) {
                    test.equal(error, 404);
                }).then(function () {

                    // when - a verification that should fail
                    client.verify(
                        {
                            'path': '/someOtherPath'
                        }, 1).then(function () {
                            test.ok(false, "verification should have failed");
                        }, function (message) {
                            test.equals(message, "Request not found at least once, expected:<{\n" +
                                "  \"path\" : \"/someOtherPath\"\n" +
                                "}> but was:<{\n" +
                                "  \"method\" : \"POST\",\n" +
                                "  \"path\" : \"/somePath\",\n" +
                                "  \"headers\" : [ {\n" +
                                "    \"name\" : \"Host\",\n" +
                                "    \"values\" : [ \"localhost:1080\" ]\n" +
                                "  }, {\n" +
                                "    \"name\" : \"Content-Length\",\n" +
                                "    \"values\" : [ \"8\" ]\n" +
                                "  } ],\n" +
                                "  \"body\" : \"someBody\"\n" +
                                "}>");
                        }).then(function () {
                            test.done();
                        });
                });
        },

        'should fail when not enough exact requests have been sent': function (test) {
            // given - a client
            var client = proxyClient("localhost", 1090);
            // and - a request
            sendRequestViaProxy("http://localhost:1080/somePath", "someBody")
                .then(function (response) {
                    test.ok(false, "expecting 404 response");
                }, function (error) {
                    test.equal(error, 404);
                }).then(function () {

                    // when - a verification that should fail
                    client.verify(
                        {
                            'method': 'POST',
                            'path': '/somePath',
                            'body': 'someBody'
                        }, 2, true).then(function () {
                            test.ok(false, "verification should have failed");
                        }, function (message) {
                            test.equals(message, "Request not found exactly 2 times, expected:<{\n" +
                                "  \"method\" : \"POST\",\n" +
                                "  \"path\" : \"/somePath\",\n" +
                                "  \"body\" : \"someBody\"\n" +
                                "}> but was:<{\n" +
                                "  \"method\" : \"POST\",\n" +
                                "  \"path\" : \"/somePath\",\n" +
                                "  \"headers\" : [ {\n" +
                                "    \"name\" : \"Host\",\n" +
                                "    \"values\" : [ \"localhost:1080\" ]\n" +
                                "  }, {\n" +
                                "    \"name\" : \"Content-Length\",\n" +
                                "    \"values\" : [ \"8\" ]\n" +
                                "  } ],\n" +
                                "  \"body\" : \"someBody\"\n" +
                                "}>");
                        }).then(function () {
                            test.done();
                        });
                });
        },

        'should fail when not enough at least requests have been sent': function (test) {
            // given - a client
            var client = proxyClient("localhost", 1090);
            // and - a request
            sendRequestViaProxy("http://localhost:1080/somePath", "someBody")
                .then(function (response) {
                    test.ok(false, "expecting 404 response");
                }, function (error) {
                    test.equal(error, 404);
                }).then(function () {

                    // when - a verification that should fail
                    client.verify(
                        {
                            'method': 'POST',
                            'path': '/somePath',
                            'body': 'someBody'
                        }, 2).then(function () {
                            test.ok(false, "verification should have failed");
                        }, function (message) {
                            test.equals(message, "Request not found at least 2 times, expected:<{\n" +
                                "  \"method\" : \"POST\",\n" +
                                "  \"path\" : \"/somePath\",\n" +
                                "  \"body\" : \"someBody\"\n" +
                                "}> but was:<{\n" +
                                "  \"method\" : \"POST\",\n" +
                                "  \"path\" : \"/somePath\",\n" +
                                "  \"headers\" : [ {\n" +
                                "    \"name\" : \"Host\",\n" +
                                "    \"values\" : [ \"localhost:1080\" ]\n" +
                                "  }, {\n" +
                                "    \"name\" : \"Content-Length\",\n" +
                                "    \"values\" : [ \"8\" ]\n" +
                                "  } ],\n" +
                                "  \"body\" : \"someBody\"\n" +
                                "}>");
                        }).then(function () {
                            test.done();
                        });
                });
        },

        'should clear proxy by path': function (test) {
            // given - a client
            var client = proxyClient("localhost", 1090);
            // and - a request
            sendRequestViaProxy("http://localhost:1080/somePath", "someBody")
                .then(function (response) {
                    test.ok(false, "expecting 404 response");
                }, function (error) {
                    test.equal(error, 404);
                }).then(function () {
                    // and - another request
                    sendRequestViaProxy("http://localhost:1080/someOtherPath", "someBody")
                        .then(function (response) {
                            test.ok(false, "expecting 404 response");
                        }, function (error) {
                            test.equal(error, 404);
                        }).then(function () {


                            // and - a verification that passes
                            client.verify(
                                {
                                    'method': 'POST',
                                    'path': '/somePath',
                                    'body': 'someBody'
                                }, 1).then(function () {
                                    // when - matching requests cleared
                                    client.clear('/somePath').then(function () {

                                        // then - the verification should fail requests that were cleared
                                        client.verify(
                                            {
                                                'method': 'POST',
                                                'path': '/somePath',
                                                'body': 'someBody'
                                            }, 1).then(function () {
                                                test.ok(false, "verification should have failed");
                                            }, function (message) {
                                                test.equals(message, "Request not found at least once, expected:<{\n" +
                                                    "  \"method\" : \"POST\",\n" +
                                                    "  \"path\" : \"/somePath\",\n" +
                                                    "  \"body\" : \"someBody\"\n" +
                                                    "}> but was:<{\n" +
                                                    "  \"method\" : \"POST\",\n" +
                                                    "  \"path\" : \"/someOtherPath\",\n" +
                                                    "  \"headers\" : [ {\n" +
                                                    "    \"name\" : \"Host\",\n" +
                                                    "    \"values\" : [ \"localhost:1080\" ]\n" +
                                                    "  }, {\n" +
                                                    "    \"name\" : \"Content-Length\",\n" +
                                                    "    \"values\" : [ \"8\" ]\n" +
                                                    "  } ],\n" +
                                                    "  \"body\" : \"someBody\"\n" +
                                                    "}>");
                                            }).then(function () {

                                                // then - the verification should pass for other requests
                                                client.verify(
                                                    {
                                                        'method': 'POST',
                                                        'path': '/someOtherPath',
                                                        'body': 'someBody'
                                                    }, 1).then(function () {
                                                        test.done();
                                                    }, function () {
                                                        test.ok(false, "verification should have passed");
                                                        test.done();
                                                    });
                                            });
                                    }, function () {
                                        test.ok(false, "client should not fail when resetting");
                                    });
                                }, function () {
                                    test.ok(false, "verification should pass");
                                });
                        });
                });
        },

        'should clear proxy by request matcher': function (test) {
            // given - a client
            var client = proxyClient("localhost", 1090);
            // and - a request
            sendRequestViaProxy("http://localhost:1080/somePath", "someBody")
                .then(function (response) {
                    test.ok(false, "expecting 404 response");
                }, function (error) {
                    test.equal(error, 404);
                }).then(function () {
                    // and - another request
                    sendRequestViaProxy("http://localhost:1080/someOtherPath", "someBody")
                        .then(function (response) {
                            test.ok(false, "expecting 404 response");
                        }, function (error) {
                            test.equal(error, 404);
                        }).then(function () {


                            // and - a verification that passes
                            client.verify(
                                {
                                    'method': 'POST',
                                    'path': '/somePath',
                                    'body': 'someBody'
                                }, 1).then(function () {
                                    // when - matching requests cleared
                                    client.clear({
                                        "path": "/somePath"
                                    }).then(function () {

                                        // then - the verification should fail requests that were cleared
                                        client.verify(
                                            {
                                                'method': 'POST',
                                                'path': '/somePath',
                                                'body': 'someBody'
                                            }, 1).then(function () {
                                                test.ok(false, "verification should have failed");
                                            }, function (message) {
                                                test.equals(message, "Request not found at least once, expected:<{\n" +
                                                    "  \"method\" : \"POST\",\n" +
                                                    "  \"path\" : \"/somePath\",\n" +
                                                    "  \"body\" : \"someBody\"\n" +
                                                    "}> but was:<{\n" +
                                                    "  \"method\" : \"POST\",\n" +
                                                    "  \"path\" : \"/someOtherPath\",\n" +
                                                    "  \"headers\" : [ {\n" +
                                                    "    \"name\" : \"Host\",\n" +
                                                    "    \"values\" : [ \"localhost:1080\" ]\n" +
                                                    "  }, {\n" +
                                                    "    \"name\" : \"Content-Length\",\n" +
                                                    "    \"values\" : [ \"8\" ]\n" +
                                                    "  } ],\n" +
                                                    "  \"body\" : \"someBody\"\n" +
                                                    "}>");
                                            }).then(function () {

                                                // then - the verification should pass for other requests
                                                client.verify(
                                                    {
                                                        'method': 'POST',
                                                        'path': '/someOtherPath',
                                                        'body': 'someBody'
                                                    }, 1).then(function () {
                                                        test.done();
                                                    }, function () {
                                                        test.ok(false, "verification should have passed");
                                                        test.done();
                                                    });
                                            });
                                    }, function () {
                                        test.ok(false, "client should not fail when resetting");
                                    });
                                }, function () {
                                    test.ok(false, "verification should pass");
                                });
                        });
                });
        },

        'should clear proxy by expectation matcher': function (test) {
            // given - a client
            var client = proxyClient("localhost", 1090);
            // and - a request
            sendRequestViaProxy("http://localhost:1080/somePath", "someBody")
                .then(function (response) {
                    test.ok(false, "expecting 404 response");
                }, function (error) {
                    test.equal(error, 404);
                }).then(function () {
                    // and - another request
                    sendRequestViaProxy("http://localhost:1080/someOtherPath", "someBody")
                        .then(function (response) {
                            test.ok(false, "expecting 404 response");
                        }, function (error) {
                            test.equal(error, 404);
                        }).then(function () {


                            // and - a verification that passes
                            client.verify(
                                {
                                    'method': 'POST',
                                    'path': '/somePath',
                                    'body': 'someBody'
                                }, 1).then(function () {
                                    // when - matching requests cleared
                                    client.clear({
                                        "httpRequest": {
                                            "path": "/somePath"
                                        }
                                    }).then(function () {

                                        // then - the verification should fail requests that were cleared
                                        client.verify(
                                            {
                                                'method': 'POST',
                                                'path': '/somePath',
                                                'body': 'someBody'
                                            }, 1).then(function () {
                                                test.ok(false, "verification should have failed");
                                            }, function (message) {
                                                test.equals(message, "Request not found at least once, expected:<{\n" +
                                                    "  \"method\" : \"POST\",\n" +
                                                    "  \"path\" : \"/somePath\",\n" +
                                                    "  \"body\" : \"someBody\"\n" +
                                                    "}> but was:<{\n" +
                                                    "  \"method\" : \"POST\",\n" +
                                                    "  \"path\" : \"/someOtherPath\",\n" +
                                                    "  \"headers\" : [ {\n" +
                                                    "    \"name\" : \"Host\",\n" +
                                                    "    \"values\" : [ \"localhost:1080\" ]\n" +
                                                    "  }, {\n" +
                                                    "    \"name\" : \"Content-Length\",\n" +
                                                    "    \"values\" : [ \"8\" ]\n" +
                                                    "  } ],\n" +
                                                    "  \"body\" : \"someBody\"\n" +
                                                    "}>");
                                            }).then(function () {

                                                // then - the verification should pass for other requests
                                                client.verify(
                                                    {
                                                        'method': 'POST',
                                                        'path': '/someOtherPath',
                                                        'body': 'someBody'
                                                    }, 1).then(function () {
                                                        test.done();
                                                    }, function () {
                                                        test.ok(false, "verification should have passed");
                                                        test.done();
                                                    });
                                            });
                                    }, function () {
                                        test.ok(false, "client should not fail when resetting");
                                    });
                                }, function () {
                                    test.ok(false, "verification should pass");
                                });
                        });
                });
        },

        'should reset proxy': function (test) {
            // given - a client
            var client = proxyClient("localhost", 1090);
            // and - a request
            sendRequestViaProxy("http://localhost:1080/somePath", "someBody")
                .then(function (response) {
                    test.ok(false, "expecting 404 response");
                }, function (error) {
                    test.equal(error, 404);
                }).then(function () {
                    // and - another request
                    sendRequestViaProxy("http://localhost:1080/somePath", "someBody")
                        .then(function (response) {
                            test.ok(false, "expecting 404 response");
                        }, function (error) {
                            test.equal(error, 404);
                        }).then(function () {

                            // and - a verification that passes
                            client.verify(
                                {
                                    'method': 'POST',
                                    'path': '/somePath',
                                    'body': 'someBody'
                                }, 1).then(function () {
                                    // when - all recorded requests reset
                                    client.reset().then(function () {

                                        // then - the verification should fail
                                        client.verify(
                                            {
                                                'method': 'POST',
                                                'path': '/somePath',
                                                'body': 'someBody'
                                            }, 1).then(function () {
                                                test.ok(false, "verification should have failed");
                                            }, function (message) {
                                                test.equals(message, "Request not found at least once, expected:<{\n" +
                                                    "  \"method\" : \"POST\",\n" +
                                                    "  \"path\" : \"/somePath\",\n" +
                                                    "  \"body\" : \"someBody\"\n" +
                                                    "}> but was:<>");
                                            }).then(function () {
                                                test.done();
                                            });
                                    }, function () {
                                        test.ok(false, "client should not fail when resetting");
                                    });
                                }, function () {
                                    test.ok(false, "verification should pass");
                                });
                        });
                });
        }
    };

})();