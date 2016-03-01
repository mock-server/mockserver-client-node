(function () {

    'use strict';

    var mockServer = require('../../');
    var mockServerClient = mockServer.mockServerClient;
    var proxyClient = mockServer.proxyClient;
    var Q = require('q');
    var http = require('http');

    function sendRequest(method, host, port, path, jsonBody, headers) {
        var deferred = Q.defer();

        var body = (typeof jsonBody === "string" ? jsonBody : JSON.stringify(jsonBody || ""));
        var options = {
            method: method,
            host: host,
            path: path,
            port: port,
            headers: headers
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

        'should create full expectation with string body': function (test) {
            // given - a client and expectation
            mockServerClient("localhost", 1080).mockAnyResponse(
                {
                    'httpRequest': {
                        'method': 'POST',
                        'path': '/somePath',
                        'queryStringParameters': [
                            {
                                'name': 'test',
                                'values': ['true']
                            }
                        ],
                        'body': {
                            'type': "STRING",
                            'value': 'someBody'
                        }
                    },
                    'httpResponse': {
                        'statusCode': 200,
                        'body': JSON.stringify({name: 'value'}),
                        'delay': {
                            'timeUnit': 'MILLISECONDS',
                            'value': 250
                        }
                    },
                    'times': {
                        'remainingTimes': 1,
                        'unlimited': false
                    }
                }
            ).then(function () {

                    // then - non matching request
                    sendRequest("GET", "localhost", 1080, "/otherPath")
                        .then(function (response) {
                            test.ok(false, "should not match expectation");
                        }, function (error) {
                            test.equal(error, 404);
                        }).then(function () {

                            // then - matching request
                            sendRequest("POST", "localhost", 1080, "/somePath?test=true", "someBody")
                                .then(function (response) {
                                    test.equal(response.statusCode, 200);
                                    test.equal(response.body, '{"name":"value"}');
                                }, function (error) {
                                    test.ok(false, "should match expectation");
                                }).then(function () {

                                    // then - matching request, but no times remaining
                                    sendRequest("POST", "localhost", 1080, "/somePath?test=true", "someBody")
                                        .then(function (response) {
                                            test.ok(false, "should match expectation but no times remaining");
                                        }, function (error) {
                                            test.equal(error, 404);
                                        }).then(function () {
                                            test.done();
                                        });
                                });
                        });
                });
        },

        'should match on method only': function (test) {
            // given - a client
            var client = mockServerClient("localhost", 1080);
            // and - an expectation
            client.mockAnyResponse(
                {
                    'httpRequest': {
                        'method': 'GET'
                    },
                    'httpResponse': {
                        'statusCode': 200,
                        'body': JSON.stringify({name: 'first_body'}),
                        'delay': {
                            'timeUnit': 'MILLISECONDS',
                            'value': 250
                        }
                    },
                    'times': {
                        'remainingTimes': 1,
                        'unlimited': false
                    }
                }
            ).then(function () {
                    // and - another expectation
                    client.mockAnyResponse(
                        {
                            'httpRequest': {
                                'method': 'POST'
                            },
                            'httpResponse': {
                                'statusCode': 200,
                                'body': JSON.stringify({name: 'second_body'}),
                                'delay': {
                                    'timeUnit': 'MILLISECONDS',
                                    'value': 250
                                }
                            },
                            'times': {
                                'remainingTimes': 1,
                                'unlimited': false
                            }
                        }
                    ).then(function () {

                            // then - matching no expectation
                            sendRequest("PUT", "localhost", 1080, "/somePath")
                                .then(function (response) {
                                    test.ok(false, "should not match expectation");
                                }, function (error) {
                                    test.equal(error, 404);
                                }).then(function () {

                                    // then - matching first expectation
                                    sendRequest("GET", "localhost", 1080, "/somePath")
                                        .then(function (response) {
                                            test.equal(response.statusCode, 200);
                                            test.equal(response.body, '{"name":"first_body"}');
                                        }, function () {
                                            test.ok(false, "should match expectation");
                                        }).then(function () {

                                            // then - request that matches second expectation
                                            sendRequest("POST", "localhost", 1080, "/somePath")
                                                .then(function (response) {
                                                    test.equal(response.statusCode, 200);
                                                    test.equal(response.body, '{"name":"second_body"}');
                                                }, function (error) {
                                                    test.ok(false, "should match expectation");
                                                }).then(function () {
                                                    test.done();
                                                });
                                        });
                                });
                        });
                });
        },

        'should match on path only': function (test) {
            // given - a client
            var client = mockServerClient("localhost", 1080);
            // and - an expectation
            client.mockAnyResponse(
                {
                    'httpRequest': {
                        'path': '/firstPath'
                    },
                    'httpResponse': {
                        'statusCode': 200,
                        'body': JSON.stringify({name: 'first_body'}),
                        'delay': {
                            'timeUnit': 'MILLISECONDS',
                            'value': 250
                        }
                    },
                    'times': {
                        'remainingTimes': 1,
                        'unlimited': false
                    }
                }
            ).then(function () {
                    // and - another expectation
                    client.mockAnyResponse(
                        {
                            'httpRequest': {
                                'path': '/secondPath'
                            },
                            'httpResponse': {
                                'statusCode': 200,
                                'body': JSON.stringify({name: 'second_body'}),
                                'delay': {
                                    'timeUnit': 'MILLISECONDS',
                                    'value': 250
                                }
                            },
                            'times': {
                                'remainingTimes': 1,
                                'unlimited': false
                            }
                        }
                    ).then(function () {

                            // then - matching no expectation
                            sendRequest("GET", "localhost", 1080, "/otherPath")
                                .then(function (response) {
                                    test.ok(false, "should not match expectation");
                                }, function (error) {
                                    test.equal(error, 404);
                                }).then(function () {

                                    // then - matching first expectation
                                    sendRequest("GET", "localhost", 1080, "/firstPath")
                                        .then(function (response) {
                                            test.equal(response.statusCode, 200);
                                            test.equal(response.body, '{"name":"first_body"}');
                                        }, function () {
                                            test.ok(false, "should match expectation");
                                        }).then(function () {

                                            // then - request that matches second expectation
                                            sendRequest("GET", "localhost", 1080, "/secondPath")
                                                .then(function (response) {
                                                    test.equal(response.statusCode, 200);
                                                    test.equal(response.body, '{"name":"second_body"}');
                                                }, function (error) {
                                                    test.ok(false, "should match expectation");
                                                }).then(function () {
                                                    test.done();
                                                });
                                        });
                                });
                        });
                });
        },

        'should match on query string parameters only': function (test) {
            // given - a client
            var client = mockServerClient("localhost", 1080);
            // and - an expectation
            client.mockAnyResponse(
                {
                    'httpRequest': {
                        'queryStringParameters': [
                            {
                                'name': 'param',
                                'values': ['first']
                            }
                        ]
                    },
                    'httpResponse': {
                        'statusCode': 200,
                        'body': JSON.stringify({name: 'first_body'}),
                        'delay': {
                            'timeUnit': 'MILLISECONDS',
                            'value': 250
                        }
                    },
                    'times': {
                        'remainingTimes': 1,
                        'unlimited': false
                    }
                }
            ).then(function () {
                    // and - another expectation
                    client.mockAnyResponse(
                        {
                            'httpRequest': {
                                'queryStringParameters': [
                                    {
                                        'name': 'param',
                                        'values': ['second']
                                    }
                                ]
                            },
                            'httpResponse': {
                                'statusCode': 200,
                                'body': JSON.stringify({name: 'second_body'}),
                                'delay': {
                                    'timeUnit': 'MILLISECONDS',
                                    'value': 250
                                }
                            },
                            'times': {
                                'remainingTimes': 1,
                                'unlimited': false
                            }
                        }
                    ).then(function () {

                            // then - matching no expectation
                            sendRequest("GET", "localhost", 1080, "/somePath?param=other")
                                .then(function (response) {
                                    test.ok(false, "should not match expectation");
                                }, function (error) {
                                    test.equal(error, 404);
                                }).then(function () {

                                    // then - matching first expectation
                                    sendRequest("GET", "localhost", 1080, "/somePath?param=first")
                                        .then(function (response) {
                                            test.equal(response.statusCode, 200);
                                            test.equal(response.body, '{"name":"first_body"}');
                                        }, function () {
                                            test.ok(false, "should match expectation");
                                        }).then(function () {

                                            // then - request that matches second expectation
                                            sendRequest("GET", "localhost", 1080, "/somePath?param=second")
                                                .then(function (response) {
                                                    test.equal(response.statusCode, 200);
                                                    test.equal(response.body, '{"name":"second_body"}');
                                                }, function (error) {
                                                    test.ok(false, "should match expectation");
                                                }).then(function () {
                                                    test.done();
                                                });
                                        });
                                });
                        });
                });
        },

        'should match on body only': function (test) {
            // given - a client
            var client = mockServerClient("localhost", 1080);
            // and - an expectation
            client.mockAnyResponse(
                {
                    'httpRequest': {
                        'body': {
                            'type': "STRING",
                            'value': 'someBody'
                        }
                    },
                    'httpResponse': {
                        'statusCode': 200,
                        'body': JSON.stringify({name: 'first_body'}),
                        'delay': {
                            'timeUnit': 'MILLISECONDS',
                            'value': 250
                        }
                    },
                    'times': {
                        'remainingTimes': 1,
                        'unlimited': false
                    }
                }
            ).then(function () {
                    // and - another expectation
                    client.mockAnyResponse(
                        {
                            'httpRequest': {
                                'body': {
                                    'type': "REGEX",
                                    'value': 'someOtherBody'
                                }
                            },
                            'httpResponse': {
                                'statusCode': 200,
                                'body': JSON.stringify({name: 'second_body'}),
                                'delay': {
                                    'timeUnit': 'MILLISECONDS',
                                    'value': 250
                                }
                            },
                            'times': {
                                'remainingTimes': 1,
                                'unlimited': false
                            }
                        }
                    ).then(function () {

                            // then - matching no expectation
                            sendRequest("POST", "localhost", 1080, "/otherPath", "someIncorrectBody")
                                .then(function (response) {
                                    test.ok(false, "should not match expectation");
                                }, function (error) {
                                    test.equal(error, 404);
                                }).then(function () {

                                    // then - matching first expectation
                                    sendRequest("POST", "localhost", 1080, "/somePath", "someBody")
                                        .then(function (response) {
                                            test.equal(response.statusCode, 200);
                                            test.equal(response.body, '{"name":"first_body"}');
                                        }, function () {
                                            test.ok(false, "should match expectation");
                                        }).then(function () {

                                            // then - request that matches second expectation
                                            sendRequest("POST", "localhost", 1080, "/somePath", "someOtherBody")
                                                .then(function (response) {
                                                    test.equal(response.statusCode, 200);
                                                    test.equal(response.body, '{"name":"second_body"}');
                                                }, function (error) {
                                                    test.ok(false, "should match expectation");
                                                }).then(function () {
                                                    test.done();
                                                });
                                        });
                                });
                        });
                });
        },

        'should match on headers only': function (test) {
            // given - a client
            var client = mockServerClient("localhost", 1080);
            // and - an expectation
            client.mockAnyResponse(
                {
                    'httpRequest': {
                        'headers': [
                            {
                                'name': 'header',
                                'values': ['first']
                            }
                        ]
                    },
                    'httpResponse': {
                        'statusCode': 200,
                        'body': JSON.stringify({name: 'first_body'}),
                        'delay': {
                            'timeUnit': 'MILLISECONDS',
                            'value': 250
                        }
                    },
                    'times': {
                        'remainingTimes': 1,
                        'unlimited': false
                    }
                }
            ).then(function () {
                    // and - another expectation
                    client.mockAnyResponse(
                        {
                            'httpRequest': {
                                'headers': [
                                    {
                                        'name': 'header',
                                        'values': ['second']
                                    }
                                ]
                            },
                            'httpResponse': {
                                'statusCode': 200,
                                'body': JSON.stringify({name: 'second_body'}),
                                'delay': {
                                    'timeUnit': 'MILLISECONDS',
                                    'value': 250
                                }
                            },
                            'times': {
                                'remainingTimes': 1,
                                'unlimited': false
                            }
                        }
                    ).then(function () {

                            // then - matching no expectation
                            sendRequest("GET", "localhost", 1080, "/somePath", "", {'header': 'other'})
                                .then(function (response) {
                                    test.ok(false, "should not match expectation");
                                }, function (error) {
                                    test.equal(error, 404);
                                }).then(function () {

                                    // then - matching first expectation
                                    sendRequest("GET", "localhost", 1080, "/somePath", "", {'header': 'first'})
                                        .then(function (response) {
                                            test.equal(response.statusCode, 200);
                                            test.equal(response.body, '{"name":"first_body"}');
                                        }, function () {
                                            test.ok(false, "should match expectation");
                                        }).then(function () {

                                            // then - request that matches second expectation
                                            sendRequest("GET", "localhost", 1080, "/somePath", "", {'header': 'second'})
                                                .then(function (response) {
                                                    test.equal(response.statusCode, 200);
                                                    test.equal(response.body, '{"name":"second_body"}');
                                                }, function (error) {
                                                    test.ok(false, "should match expectation");
                                                }).then(function () {
                                                    test.done();
                                                });
                                        });
                                });
                        });
                });
        },

        'should match on cookies only': function (test) {
            // given - a client
            var client = mockServerClient("localhost", 1080);
            // and - an expectation
            client.mockAnyResponse(
                {
                    'httpRequest': {
                        'cookies': [
                            {
                                'name': 'cookie',
                                'value': 'first'
                            }
                        ]
                    },
                    'httpResponse': {
                        'statusCode': 200,
                        'body': JSON.stringify({name: 'first_body'}),
                        'delay': {
                            'timeUnit': 'MILLISECONDS',
                            'value': 250
                        }
                    },
                    'times': {
                        'remainingTimes': 1,
                        'unlimited': false
                    }
                }
            ).then(function () {
                    // and - another expectation
                    client.mockAnyResponse(
                        {
                            'httpRequest': {
                                'cookies': [
                                    {
                                        'name': 'cookie',
                                        'value': 'second'
                                    }
                                ]
                            },
                            'httpResponse': {
                                'statusCode': 200,
                                'body': JSON.stringify({name: 'second_body'}),
                                'delay': {
                                    'timeUnit': 'MILLISECONDS',
                                    'value': 250
                                }
                            },
                            'times': {
                                'remainingTimes': 1,
                                'unlimited': false
                            }
                        }
                    ).then(function () {

                            // then - matching no expectation
                            sendRequest("GET", "localhost", 1080, "/somePath", "", {'Cookie': 'cookie=other'})
                                .then(function (response) {
                                    test.ok(false, "should not match expectation");
                                }, function (error) {
                                    test.equal(error, 404);
                                }).then(function () {

                                    // then - matching first expectation
                                    sendRequest("GET", "localhost", 1080, "/somePath", "", {'Cookie': 'cookie=first'})
                                        .then(function (response) {
                                            test.equal(response.statusCode, 200);
                                            test.equal(response.body, '{"name":"first_body"}');
                                        }, function () {
                                            test.ok(false, "should match expectation");
                                        }).then(function () {

                                            // then - request that matches second expectation
                                            sendRequest("GET", "localhost", 1080, "/somePath", "", {'Cookie': 'cookie=second'})
                                                .then(function (response) {
                                                    test.equal(response.statusCode, 200);
                                                    test.equal(response.body, '{"name":"second_body"}');
                                                }, function (error) {
                                                    test.ok(false, "should match expectation");
                                                }).then(function () {
                                                    test.done();
                                                });
                                        });
                                });
                        });
                });
        },

        'should create simple response expectation': function (test) {
            // given - a client and expectation
            mockServerClient("localhost", 1080).mockSimpleResponse('/somePath', {name: 'value'}, 203).then(function () {

                // then - non matching request
                sendRequest("POST", "localhost", 1080, "/otherPath")
                    .then(function (response) {
                        test.ok(false, "should not match expectation");
                    }, function (error) {
                        test.equal(error, 404);
                    }).then(function () {

                        // then - matching request
                        sendRequest("POST", "localhost", 1080, "/somePath?test=true", "someBody")
                            .then(function (response) {
                                test.equal(response.statusCode, 203);
                                test.equal(response.body, '{"name":"value"}');
                            }, function () {
                                test.ok(false, "should match expectation");
                            }).then(function () {

                                // then - matching request, but no times remaining
                                sendRequest("POST", "localhost", 1080, "/somePath?test=true", "someBody")
                                    .then(function (response) {
                                        test.ok(false, "should match expectation but no times remaining");
                                    }, function (error) {
                                        test.equal(error, 404);
                                    }).then(function () {
                                        test.done();
                                    });
                            });
                    });
            });
        },

        'should update default headers for simple response expectation': function (test) {
            // given - a client
            var client = mockServerClient("localhost", 1080);
            // and - default headers
            client.setDefaultHeaders([
                {"name": "content-type", "values": ["application/json; charset=utf-8"]},
                {"name": "x-test", "values": ["test-value"]}
            ]);
            // and - an expectation
            client.mockSimpleResponse('/somePath', {name: 'value'}, 203).then(function () {

                // then - matching request
                sendRequest("POST", "localhost", 1080, "/somePath?test=true", "someBody")
                    .then(function (response) {
                        test.equal(response.statusCode, 203);
                        test.equal(response.body, '{"name":"value"}');
                        test.equal(response.headers["content-type"], "application/json; charset=utf-8");
                        test.equal(response.headers["x-test"], "test-value");
                        test.done();
                    }, function (error) {
                        test.ok(false, "should match expectation");
                        test.done();
                    });
            });
        },

        'should verify exact number of requests have been sent': function (test) {
            // given - a client
            var client = mockServerClient("localhost", 1080);
            // and - an expectation
            client.mockSimpleResponse('/somePath', {name: 'value'}, 203).then(function () {
                // and - a request
                sendRequest("POST", "localhost", 1080, "/somePath", "someBody")
                    .then(function (response) {
                        test.equal(response.statusCode, 203);
                    }, function (error) {
                        test.ok(false, error);
                    }).then(function () {

                        // when - verify at least one request
                        client.verify(
                            {
                                'method': 'POST',
                                'path': '/somePath',
                                'body': 'someBody'
                            }, 1, true).then(function () {
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
            var client = mockServerClient("localhost", 1080);
            // and - an expectation
            client.mockSimpleResponse('/somePath', {name: 'value'}, 203).then(function () {
                // and - another expectation
                client.mockSimpleResponse('/somePath', {name: 'value'}, 203).then(function () {
                    // and - a request
                    sendRequest("POST", "localhost", 1080, "/somePath", "someBody")
                        .then(function (response) {
                            test.equal(response.statusCode, 203);
                        }, function (error) {
                            test.ok(false, error);
                        }).then(function () {
                            // and - another request
                            sendRequest("POST", "localhost", 1080, "/somePath", "someBody")
                                .then(function (response) {
                                    test.equal(response.statusCode, 203);
                                }, function (error) {
                                    test.ok(false, error);
                                }).then(function () {

                                    // when - verify at least one request
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
                });
            });
        },

        'should fail when no requests have been sent': function (test) {
            // given - a client
            var client = mockServerClient("localhost", 1080);
            // and - an expectation
            client.mockSimpleResponse('/somePath', {name: 'value'}, 203).then(function () {
                // and - a request
                sendRequest("POST", "localhost", 1080, "/somePath", "someBody")
                    .then(function (response) {
                        test.equal(response.statusCode, 203);
                    }, function (error) {
                        test.ok(false, error);
                    }).then(function () {

                        // when - verify at least one request (should fail)
                        client.verify(
                            {
                                'path': '/someOtherPath'
                            }, 1)
                            .then(function () {
                                test.ok(false, "verification should have failed");
                                test.done();
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
                                "  \"keepAlive\" : false,\n" +
                                "  \"secure\" : false,\n" +
                                "  \"body\" : \"someBody\"\n" +
                                "}>");
                                test.done();
                            });
                    });
            });
        },

        'should fail when not enough exact requests have been sent': function (test) {
            // given - a client
            var client = mockServerClient("localhost", 1080);
            // and - an expectation
            client.mockSimpleResponse('/somePath', {name: 'value'}, 203).then(function () {
                // and - a request
                sendRequest("POST", "localhost", 1080, "/somePath", "someBody")
                    .then(function (response) {
                        test.equal(response.statusCode, 203);
                    }, function (error) {
                        test.ok(false, error);
                    }).then(function () {

                        // when - verify exact two requests (should fail)
                        client.verify(
                            {
                                'method': 'POST',
                                'path': '/somePath',
                                'body': 'someBody'
                            }, 2, true)
                            .then(function () {
                                test.ok(false, "verification should have failed");
                                test.done();
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
                                "  \"keepAlive\" : false,\n" +
                                "  \"secure\" : false,\n" +
                                "  \"body\" : \"someBody\"\n" +
                                "}>");
                                test.done();
                            });
                    });
            });
        },

        'should fail when not enough at least requests have been sent': function (test) {
            // given - a client
            var client = mockServerClient("localhost", 1080);
            // and - an expectation
            client.mockSimpleResponse('/somePath', {name: 'value'}, 203).then(function () {
                // and - a request
                sendRequest("POST", "localhost", 1080, "/somePath", "someBody")
                    .then(function (response) {
                        test.equal(response.statusCode, 203);
                    }, function (error) {
                        test.ok(false, error);
                    }).then(function () {

                        // when - verify at least two requests (should fail)
                        client.verify(
                            {
                                'method': 'POST',
                                'path': '/somePath',
                                'body': 'someBody'
                            }, 2)
                            .then(function () {
                                test.ok(false, "verification should have failed");
                                test.done();
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
                                "  \"keepAlive\" : false,\n" +
                                "  \"secure\" : false,\n" +
                                "  \"body\" : \"someBody\"\n" +
                                "}>");
                                test.done();
                            });
                    });
            });
        },

        'should pass when correct sequence of requests have been sent': function (test) {
            // given - a client
            var client = mockServerClient("localhost", 1080);
            // and - an expectation
            client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201).then(function () {
                // and - another expectation
                client.mockSimpleResponse('/somePathTwo', {name: 'two'}, 202).then(function () {
                    // and - a request
                    sendRequest("POST", "localhost", 1080, "/somePathOne", "someBody")
                        .then(function (response) {
                            test.equal(response.statusCode, 201);
                        }, function (error) {
                            test.ok(false, error);
                        }).then(function () {

                            sendRequest("GET", "localhost", 1080, "/notFound")
                                .then(function (response) {
                                    test.ok(false, "should not match expectation");
                                }, function (error) {
                                    test.equal(error, 404);
                                }).then(function () {

                                    sendRequest("GET", "localhost", 1080, "/somePathTwo")
                                        .then(function (response) {
                                            test.equal(response.statusCode, 202);
                                        }, function (error) {
                                            test.ok(false, error);
                                        }).then(function () {

                                            // when
                                            client.verifySequence(
                                                {
                                                    'method': 'POST',
                                                    'path': '/somePathOne',
                                                    'body': 'someBody'
                                                },
                                                {
                                                    'method': 'GET',
                                                    'path': '/notFound'
                                                },
                                                {
                                                    'method': 'GET',
                                                    'path': '/somePathTwo'
                                                }
                                            ).then(function () {
                                                    test.done();
                                                }, function () {
                                                    test.ok(false, "verification should pass");
                                                    test.done();
                                                });
                                        });
                                });
                        });
                });
            });
        },

        'should fail when incorrect sequence (wrong order) of requests have been sent': function (test) {
            // given - a client
            var client = mockServerClient("localhost", 1080);
            // and - an expectation
            client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201).then(function () {
                // and - another expectation
                client.mockSimpleResponse('/somePathTwo', {name: 'two'}, 202).then(function () {
                    // and - a request
                    sendRequest("POST", "localhost", 1080, "/somePathOne", "someBody")
                        .then(function (response) {
                            test.equal(response.statusCode, 201);
                        }, function (error) {
                            test.ok(false, error);
                        }).then(function () {

                            sendRequest("GET", "localhost", 1080, "/notFound")
                                .then(function (response) {
                                    test.ok(false, "should not match expectation");
                                }, function (error) {
                                    test.equal(error, 404);
                                }).then(function () {

                                    sendRequest("GET", "localhost", 1080, "/somePathTwo")
                                        .then(function (response) {
                                            test.equal(response.statusCode, 202);
                                        }, function (error) {
                                            test.ok(false, error);
                                        }).then(function () {

                                            // when - wrong order
                                            client.verifySequence(
                                                {
                                                    'method': 'POST',
                                                    'path': '/somePathOne',
                                                    'body': 'someBody'
                                                },
                                                {
                                                    'method': 'GET',
                                                    'path': '/somePathTwo'
                                                },
                                                {
                                                    'method': 'GET',
                                                    'path': '/notFound'
                                                }
                                            )
                                                .then(function () {
                                                    test.ok(false, "verification should have failed");
                                                    test.done();
                                                }, function (message) {
                                                    test.equals(message, "Request sequence not found, expected:<[ {\n" +
                                                    "  \"method\" : \"POST\",\n" +
                                                    "  \"path\" : \"/somePathOne\",\n" +
                                                    "  \"body\" : \"someBody\"\n" +
                                                    "}, {\n" +
                                                    "  \"method\" : \"GET\",\n" +
                                                    "  \"path\" : \"/somePathTwo\"\n" +
                                                    "}, {\n" +
                                                    "  \"method\" : \"GET\",\n" +
                                                    "  \"path\" : \"/notFound\"\n" +
                                                    "} ]> but was:<[ {\n" +
                                                    "  \"method\" : \"POST\",\n" +
                                                    "  \"path\" : \"/somePathOne\",\n" +
                                                    "  \"headers\" : [ {\n" +
                                                    "    \"name\" : \"Host\",\n" +
                                                    "    \"values\" : [ \"localhost:1080\" ]\n" +
                                                    "  }, {\n" +
                                                    "    \"name\" : \"Content-Length\",\n" +
                                                    "    \"values\" : [ \"8\" ]\n  } ],\n" +
                                                    "  \"keepAlive\" : false,\n" +
                                                    "  \"secure\" : false,\n" +
                                                    "  \"body\" : \"someBody\"\n" +
                                                    "}, {\n" +
                                                    "  \"method\" : \"GET\",\n" +
                                                    "  \"path\" : \"/notFound\",\n" +
                                                    "  \"headers\" : [ {\n" +
                                                    "    \"name\" : \"Host\",\n" +
                                                    "    \"values\" : [ \"localhost:1080\" ]\n" +
                                                    "  }, {\n" +
                                                    "    \"name\" : \"Content-Length\",\n" +
                                                    "    \"values\" : [ \"0\" ]\n" +
                                                    "  } ],\n" +
                                                    "  \"keepAlive\" : false,\n" +
                                                    "  \"secure\" : false\n" +
                                                    "}, {\n" +
                                                    "  \"method\" : \"GET\",\n" +
                                                    "  \"path\" : \"/somePathTwo\",\n" +
                                                    "  \"headers\" : [ {\n" +
                                                    "    \"name\" : \"Host\",\n" +
                                                    "    \"values\" : [ \"localhost:1080\" ]\n" +
                                                    "  }, {\n" +
                                                    "    \"name\" : \"Content-Length\",\n" +
                                                    "    \"values\" : [ \"0\" ]\n" +
                                                    "  } ],\n" +
                                                    "  \"keepAlive\" : false,\n" +
                                                    "  \"secure\" : false\n" +
                                                    "} ]>");
                                                    test.done();
                                                });

                                        });
                                });
                        });
                });
            });
        },

        'should fail when incorrect sequence (first request incorrect body) of requests have been sent': function (test) {
            // given - a client
            var client = mockServerClient("localhost", 1080);
            // and - an expectation
            client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201).then(function () {
                // and - another expectation
                client.mockSimpleResponse('/somePathTwo', {name: 'two'}, 202).then(function () {
                    // and - a request
                    sendRequest("POST", "localhost", 1080, "/somePathOne", "someBody")
                        .then(function (response) {
                            test.equal(response.statusCode, 201);
                        }, function (error) {
                            test.ok(false, error);
                        }).then(function () {

                            sendRequest("GET", "localhost", 1080, "/notFound")
                                .then(function (response) {
                                    test.ok(false, "should not match expectation");
                                }, function (error) {
                                    test.equal(error, 404);
                                }).then(function () {

                                    sendRequest("GET", "localhost", 1080, "/somePathTwo")
                                        .then(function (response) {
                                            test.equal(response.statusCode, 202);
                                        }, function (error) {
                                            test.ok(false, error);
                                        }).then(function () {

                                            // when - first request incorrect body
                                            client.verifySequence(
                                                {
                                                    'method': 'POST',
                                                    'path': '/somePathOne',
                                                    'body': 'some_incorrect_body'
                                                },
                                                {
                                                    'method': 'GET',
                                                    'path': '/notFound'
                                                },
                                                {
                                                    'method': 'GET',
                                                    'path': '/somePathTwo'
                                                }
                                            )
                                                .then(function () {
                                                    test.ok(false, "verification should have failed");
                                                    test.done();
                                                }, function (message) {
                                                    test.equals(message, "Request sequence not found, expected:<[ {\n" +
                                                    "  \"method\" : \"POST\",\n" +
                                                    "  \"path\" : \"/somePathOne\",\n" +
                                                    "  \"body\" : \"some_incorrect_body\"\n" +
                                                    "}, {\n" +
                                                    "  \"method\" : \"GET\",\n" +
                                                    "  \"path\" : \"/notFound\"\n" +
                                                    "}, {\n" +
                                                    "  \"method\" : \"GET\",\n" +
                                                    "  \"path\" : \"/somePathTwo\"\n" +
                                                    "} ]> but was:<[ {\n" +
                                                    "  \"method\" : \"POST\",\n" +
                                                    "  \"path\" : \"/somePathOne\",\n" +
                                                    "  \"headers\" : [ {\n" +
                                                    "    \"name\" : \"Host\",\n" +
                                                    "    \"values\" : [ \"localhost:1080\" ]\n" +
                                                    "  }, {\n" +
                                                    "    \"name\" : \"Content-Length\",\n" +
                                                    "    \"values\" : [ \"8\" ]\n" +
                                                    "  } ],\n" +
                                                    "  \"keepAlive\" : false,\n" +
                                                    "  \"secure\" : false,\n" +
                                                    "  \"body\" : \"someBody\"\n" +
                                                    "}, {\n" +
                                                    "  \"method\" : \"GET\",\n" +
                                                    "  \"path\" : \"/notFound\",\n" +
                                                    "  \"headers\" : [ {\n" +
                                                    "    \"name\" : \"Host\",\n" +
                                                    "    \"values\" : [ \"localhost:1080\" ]\n" +
                                                    "  }, {\n    \"name\" : \"Content-Length\",\n" +
                                                    "    \"values\" : [ \"0\" ]\n" +
                                                    "  } ],\n" +
                                                    "  \"keepAlive\" : false,\n" +
                                                    "  \"secure\" : false\n" +
                                                    "}, {\n  \"method\" : \"GET\",\n" +
                                                    "  \"path\" : \"/somePathTwo\",\n" +
                                                    "  \"headers\" : [ {\n" +
                                                    "    \"name\" : \"Host\",\n" +
                                                    "    \"values\" : [ \"localhost:1080\" ]\n" +
                                                    "  }, {\n    \"name\" : \"Content-Length\",\n" +
                                                    "    \"values\" : [ \"0\" ]\n" +
                                                    "  } ],\n" +
                                                    "  \"keepAlive\" : false,\n" +
                                                    "  \"secure\" : false\n" +
                                                    "} ]>");
                                                    test.done();
                                                });
                                        });
                                });
                        });
                });
            });
        },

        'should clear expectations by path': function (test) {
            // given - a client
            var client = mockServerClient("localhost", 1080);
            // and - an expectation
            client.mockSimpleResponse('/somePathOne', {name: 'value'}, 200).then(function () {
                // and - another expectation
                client.mockSimpleResponse('/somePathOne', {name: 'value'}, 200).then(function () {
                    // and - another expectation
                    client.mockSimpleResponse('/somePathTwo', {name: 'value'}, 200).then(function () {
                        // and - a matching request (that returns 200)
                        sendRequest("GET", "localhost", 1080, "/somePathOne")
                            .then(function (response) {
                                test.equal(response.statusCode, 200);
                                test.equal(response.body, '{"name":"value"}');
                            }, function (error) {
                                test.ok(false, error);
                            }).then(function () {

                                // when - some expectations cleared
                                client.clear('/somePathOne').then(function () {

                                    // then - request matching cleared expectation should return 404
                                    sendRequest("GET", "localhost", 1080, "/somePathOne")
                                        .then(function (response) {
                                            test.ok(false, "should clear matching expectations");
                                        }, function (error) {
                                            test.equals(404, error);
                                        }).then(function () {

                                            // and - request matching non-cleared expectation should return 200
                                            sendRequest("GET", "localhost", 1080, "/somePathTwo")
                                                .then(function (response) {
                                                    test.equal(response.statusCode, 200);
                                                    test.equal(response.body, '{"name":"value"}');
                                                    test.done();
                                                }, function (error) {
                                                    test.ok(false, "should not clear non-matching expectations");
                                                    test.done();
                                                });
                                        });
                                });
                            });
                    });
                });
            });
        },

        'should clear expectations by request matcher': function (test) {
            // given - a client
            var client = mockServerClient("localhost", 1080);
            // and - an expectation
            client.mockSimpleResponse('/somePathOne', {name: 'value'}, 200).then(function () {
                // and - another expectation
                client.mockSimpleResponse('/somePathOne', {name: 'value'}, 200).then(function () {
                    // and - another expectation
                    client.mockSimpleResponse('/somePathTwo', {name: 'value'}, 200).then(function () {
                        // and - a matching request (that returns 200)
                        sendRequest("GET", "localhost", 1080, "/somePathOne")
                            .then(function (response) {
                                test.equal(response.statusCode, 200);
                                test.equal(response.body, '{"name":"value"}');
                            }, function (error) {
                                test.ok(false, error);
                            }).then(function () {

                                // when - some expectations cleared
                                client.clear({
                                    "path": "/somePathOne"
                                }).then(function () {

                                    // then - request matching cleared expectation should return 404
                                    sendRequest("GET", "localhost", 1080, "/somePathOne")
                                        .then(function (response) {
                                            test.ok(false, "should clear matching expectations");
                                        }, function (error) {
                                            test.equals(404, error);
                                        }).then(function () {

                                            // and - request matching non-cleared expectation should return 200
                                            sendRequest("GET", "localhost", 1080, "/somePathTwo")
                                                .then(function (response) {
                                                    test.equal(response.statusCode, 200);
                                                    test.equal(response.body, '{"name":"value"}');
                                                    test.done();
                                                }, function (error) {
                                                    test.ok(false, "should not clear non-matching expectations");
                                                    test.done();
                                                });
                                        });
                                });
                            });
                    });
                });
            });
        },

        'should clear expectations by expectation matcher': function (test) {
            // given - a client
            var client = mockServerClient("localhost", 1080);
            // and - an expectation
            client.mockSimpleResponse('/somePathOne', {name: 'value'}, 200).then(function () {
                // and - another expectation
                client.mockSimpleResponse('/somePathOne', {name: 'value'}, 200).then(function () {
                    // and - another expectation
                    client.mockSimpleResponse('/somePathTwo', {name: 'value'}, 200).then(function () {
                        // and - a matching request (that returns 200)
                        sendRequest("GET", "localhost", 1080, "/somePathOne")
                            .then(function (response) {
                                test.equal(response.statusCode, 200);
                                test.equal(response.body, '{"name":"value"}');
                            }, function (error) {
                                test.ok(false, error);
                            }).then(function () {

                                // when - some expectations cleared
                                client.clear({
                                    "httpRequest": {
                                        "path": "/somePathOne"
                                    }
                                }).then(function () {

                                    // then - request matching cleared expectation should return 404
                                    sendRequest("GET", "localhost", 1080, "/somePathOne")
                                        .then(function (response) {
                                            test.ok(false, "should clear matching expectations");
                                        }, function (error) {
                                            test.equals(404, error);
                                        }).then(function () {

                                            // and - request matching non-cleared expectation should return 200
                                            sendRequest("GET", "localhost", 1080, "/somePathTwo")
                                                .then(function (response) {
                                                    test.equal(response.statusCode, 200);
                                                    test.equal(response.body, '{"name":"value"}');
                                                    test.done();
                                                }, function (error) {
                                                    test.ok(false, "should not clear non-matching expectations");
                                                    test.done();
                                                });
                                        });
                                });
                            });
                    });
                });
            });
        },

        'should reset expectations': function (test) {
            // given - a client
            var client = mockServerClient("localhost", 1080);
            // and - an expectation
            client.mockSimpleResponse('/somePathOne', {name: 'value'}, 200).then(function () {
                // and - another expectation
                client.mockSimpleResponse('/somePathOne', {name: 'value'}, 200).then(function () {
                    // and - another expectation
                    client.mockSimpleResponse('/somePathTwo', {name: 'value'}, 200).then(function () {
                        // and - a matching request (that returns 200)
                        sendRequest("GET", "localhost", 1080, "/somePathOne")
                            .then(function (response) {
                                test.equal(response.statusCode, 200);
                                test.equal(response.body, '{"name":"value"}');
                            }, function (error) {
                                test.ok(false, "should match expectation");
                            }).then(function () {

                                // when - all expectations reset
                                client.reset().then(function () {

                                    // then - request matching one reset expectation should return 404
                                    sendRequest("GET", "localhost", 1080, "/somePathOne")
                                        .then(function () {
                                            test.ok(false, "should clear all expectations");
                                        }, function (error) {
                                            test.equals(404, error);
                                        }).then(function () {

                                            // then - request matching other reset expectation should return 404
                                            sendRequest("GET", "localhost", 1080, "/somePathTwo")
                                                .then(function () {
                                                    test.ok(false, "should clear all expectations");
                                                    test.done();
                                                }, function (error) {
                                                    test.equals(404, error);
                                                    test.done();
                                                });

                                        });
                                });
                            });
                    });
                });
            });
        },

        'should retrieve some expectations using object matcher': function (test) {
            // given - a client
            var client = mockServerClient("localhost", 1080);
            // and - first expectation
            client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201).then(function () {
                // and - second expectation
                client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201).then(function () {
                    // and - third expectation
                    client.mockSimpleResponse('/somePathTwo', {name: 'two'}, 202).then(function () {

                        // when
                        client.retrieveExpectations({
                            "httpRequest": {
                                "path": "/somePathOne"
                            }
                        }).then(function (expectations) {
                            // then
                            test.equals(expectations.length, 2);
                            // first expectation
                            test.equals(expectations[0].httpRequest.path, '/somePathOne');
                            test.equals(expectations[0].httpResponse.body, '{"name":"one"}');
                            test.equals(expectations[0].httpResponse.statusCode, 201);
                            // second expectation
                            test.equals(expectations[1].httpRequest.path, '/somePathOne');
                            test.equals(expectations[1].httpResponse.body, '{"name":"one"}');
                            test.equals(expectations[1].httpResponse.statusCode, 201);
                            test.done();
                        }, function () {
                            test.ok(false, "should return expectation");
                            test.done();
                        });

                    });

                });
            });
        },

        'should retrieve some expectations using path': function (test) {
            // given - a client
            var client = mockServerClient("localhost", 1080);
            // and - first expectation
            client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201).then(function () {
                // and - second expectation
                client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201).then(function () {
                    // and - third expectation
                    client.mockSimpleResponse('/somePathTwo', {name: 'two'}, 202).then(function () {

                        // when
                        client.retrieveExpectations("/somePathOne").then(function (expectations) {
                            // then
                            test.equals(expectations.length, 2);
                            // first expectation
                            test.equals(expectations[0].httpRequest.path, '/somePathOne');
                            test.equals(expectations[0].httpResponse.body, '{"name":"one"}');
                            test.equals(expectations[0].httpResponse.statusCode, 201);
                            // second expectation
                            test.equals(expectations[1].httpRequest.path, '/somePathOne');
                            test.equals(expectations[1].httpResponse.body, '{"name":"one"}');
                            test.equals(expectations[1].httpResponse.statusCode, 201);
                            test.done();
                        }, function () {
                            test.ok(false, "should return expectation");
                            test.done();
                        });

                    });

                });
            });
        },

        'should retrieve all expectations using object matcher': function (test) {
            // given - a client
            var client = mockServerClient("localhost", 1080);
            // and - first expectation
            client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201).then(function () {
                // and - second expectation
                client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201).then(function () {
                    // and - third expectation
                    client.mockSimpleResponse('/somePathTwo', {name: 'two'}, 202).then(function () {

                        // when
                        client.retrieveExpectations({
                            "httpRequest": {
                                "path": "/somePath.*"
                            }
                        }).then(function (expectations) {
                            // then
                            test.equals(expectations.length, 3);
                            // first expectation
                            test.equals(expectations[0].httpRequest.path, '/somePathOne');
                            test.equals(expectations[0].httpResponse.body, '{"name":"one"}');
                            test.equals(expectations[0].httpResponse.statusCode, 201);
                            // second expectation
                            test.equals(expectations[1].httpRequest.path, '/somePathOne');
                            test.equals(expectations[1].httpResponse.body, '{"name":"one"}');
                            test.equals(expectations[1].httpResponse.statusCode, 201);
                            // third expectation
                            test.equals(expectations[2].httpRequest.path, '/somePathTwo');
                            test.equals(expectations[2].httpResponse.body, '{"name":"two"}');
                            test.equals(expectations[2].httpResponse.statusCode, 202);
                            test.done();
                        }, function () {
                            test.ok(false, "should return expectation");
                            test.done();
                        });

                    });

                });
            });
        },

        'should retrieve all expectations using null matcher': function (test) {
            // given - a client
            var client = mockServerClient("localhost", 1080);
            // and - first expectation
            client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201).then(function () {
                // and - second expectation
                client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201).then(function () {
                    // and - third expectation
                    client.mockSimpleResponse('/somePathTwo', {name: 'two'}, 202).then(function () {

                        // when
                        client.retrieveExpectations().then(function (expectations) {
                            // then
                            test.equals(expectations.length, 3);
                            // first expectation
                            test.equals(expectations[0].httpRequest.path, '/somePathOne');
                            test.equals(expectations[0].httpResponse.body, '{"name":"one"}');
                            test.equals(expectations[0].httpResponse.statusCode, 201);
                            // second expectation
                            test.equals(expectations[1].httpRequest.path, '/somePathOne');
                            test.equals(expectations[1].httpResponse.body, '{"name":"one"}');
                            test.equals(expectations[1].httpResponse.statusCode, 201);
                            // third expectation
                            test.equals(expectations[2].httpRequest.path, '/somePathTwo');
                            test.equals(expectations[2].httpResponse.body, '{"name":"two"}');
                            test.equals(expectations[2].httpResponse.statusCode, 202);
                            test.done();
                        }, function () {
                            test.ok(false, "should return expectation");
                            test.done();
                        });

                    });

                });
            });
        },

        'should retrieve some requests using object matcher': function (test) {
            // given - a client
            var client = mockServerClient("localhost", 1080);
            // and - first expectation
            client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201).then(function () {
                // and - second expectation
                client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201).then(function () {
                    // and - third expectation
                    client.mockSimpleResponse('/somePathTwo', {name: 'two'}, 202).then(function () {

                        sendRequest("POST", "localhost", 1080, "/somePathOne", "someBody")
                            .then(function (response) {
                                test.equal(response.statusCode, 201);
                            }, function (error) {
                                test.ok(false, error);
                            }).then(function () {

                                sendRequest("GET", "localhost", 1080, "/somePathOne")
                                    .then(function (response) {
                                        test.equal(response.statusCode, 201);
                                    }, function (error) {
                                        test.ok(false, error);
                                    }).then(function () {

                                        sendRequest("GET", "localhost", 1080, "/notFound")
                                            .then(function (response) {
                                                test.ok(false, "should not match expectation");
                                            }, function (error) {
                                                test.equal(error, 404);
                                            }).then(function () {

                                                sendRequest("GET", "localhost", 1080, "/somePathTwo")
                                                    .then(function (response) {
                                                        test.equal(response.statusCode, 202);
                                                    }, function (error) {
                                                        test.ok(false, error);
                                                    }).then(function () {

                                                        // when
                                                        client.retrieveRequests({
                                                            "httpRequest": {
                                                                "path": "/somePathOne"
                                                            }
                                                        }).then(function (requests) {
                                                            // then
                                                            test.equals(requests.length, 2);
                                                            // first request
                                                            test.equals(requests[0].path, '/somePathOne');
                                                            test.equals(requests[0].method, 'POST');
                                                            test.equals(requests[0].body, 'someBody');
                                                            // second request
                                                            test.equals(requests[1].path, '/somePathOne');
                                                            test.equals(requests[1].method, 'GET');
                                                            test.done();
                                                        }, function () {
                                                            test.ok(false, "should return correct expectations");
                                                            test.done();
                                                        });
                                                    });
                                            });
                                    });
                            });
                    });
                });
            });
        },

        'should retrieve some requests using path': function (test) {
            // given - a client
            var client = mockServerClient("localhost", 1080);
            // and - first expectation
            client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201).then(function () {
                // and - second expectation
                client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201).then(function () {
                    // and - third expectation
                    client.mockSimpleResponse('/somePathTwo', {name: 'two'}, 202).then(function () {

                        sendRequest("POST", "localhost", 1080, "/somePathOne", "someBody")
                            .then(function (response) {
                                test.equal(response.statusCode, 201);
                            }, function (error) {
                                test.ok(false, error);
                            }).then(function () {

                                sendRequest("GET", "localhost", 1080, "/somePathOne")
                                    .then(function (response) {
                                        test.equal(response.statusCode, 201);
                                    }, function (error) {
                                        test.ok(false, error);
                                    }).then(function () {

                                        sendRequest("GET", "localhost", 1080, "/notFound")
                                            .then(function (response) {
                                                test.ok(false, "should not match expectation");
                                            }, function (error) {
                                                test.equal(error, 404);
                                            }).then(function () {

                                                sendRequest("GET", "localhost", 1080, "/somePathTwo")
                                                    .then(function (response) {
                                                        test.equal(response.statusCode, 202);
                                                    }, function (error) {
                                                        test.ok(false, error);
                                                    }).then(function () {

                                                        // when
                                                        client.retrieveRequests("/somePathOne").then(function (requests) {
                                                            // then
                                                            test.equals(requests.length, 2);
                                                            // first request
                                                            test.equals(requests[0].path, '/somePathOne');
                                                            test.equals(requests[0].method, 'POST');
                                                            test.equals(requests[0].body, 'someBody');
                                                            // second request
                                                            test.equals(requests[1].path, '/somePathOne');
                                                            test.equals(requests[1].method, 'GET');
                                                            test.done();
                                                        }, function () {
                                                            test.ok(false, "should return correct expectations");
                                                            test.done();
                                                        });
                                                    });
                                            });
                                    });
                            });
                    });
                });
            });
        },

        'should retrieve all requests using object matcher': function (test) {
            // given - a client
            var client = mockServerClient("localhost", 1080);
            // and - first expectation
            client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201).then(function () {
                // and - second expectation
                client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201).then(function () {
                    // and - third expectation
                    client.mockSimpleResponse('/somePathTwo', {name: 'two'}, 202).then(function () {

                        sendRequest("POST", "localhost", 1080, "/somePathOne", "someBody")
                            .then(function (response) {
                                test.equal(response.statusCode, 201);
                            }, function (error) {
                                test.ok(false, error);
                            }).then(function () {

                                sendRequest("GET", "localhost", 1080, "/somePathOne")
                                    .then(function (response) {
                                        test.equal(response.statusCode, 201);
                                    }, function (error) {
                                        test.ok(false, error);
                                    }).then(function () {

                                        sendRequest("GET", "localhost", 1080, "/notFound")
                                            .then(function (response) {
                                                test.ok(false, "should not match expectation");
                                            }, function (error) {
                                                test.equal(error, 404);
                                            }).then(function () {

                                                sendRequest("GET", "localhost", 1080, "/somePathTwo")
                                                    .then(function (response) {
                                                        test.equal(response.statusCode, 202);
                                                    }, function (error) {
                                                        test.ok(false, error);
                                                    }).then(function () {

                                                        // when
                                                        client.retrieveRequests({
                                                            "httpRequest": {
                                                                "path": "/.*"
                                                            }
                                                        }).then(function (requests) {
                                                            // then
                                                            test.equals(requests.length, 4);
                                                            // first request
                                                            test.equals(requests[0].path, '/somePathOne');
                                                            test.equals(requests[0].method, 'POST');
                                                            test.equals(requests[0].body, 'someBody');
                                                            // second request
                                                            test.equals(requests[1].path, '/somePathOne');
                                                            test.equals(requests[1].method, 'GET');
                                                            // third request
                                                            test.equals(requests[2].path, '/notFound');
                                                            test.equals(requests[2].method, 'GET');
                                                            // fourth request
                                                            test.equals(requests[3].path, '/somePathTwo');
                                                            test.equals(requests[3].method, 'GET');
                                                            test.done();
                                                        }, function () {
                                                            test.ok(false, "should return correct requests");
                                                            test.done();
                                                        });
                                                    });
                                            });
                                    });
                            });
                    });
                });
            });
        },

        'should retrieve all requests using path': function (test) {
            // given - a client
            var client = mockServerClient("localhost", 1080);
            // and - first expectation
            client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201).then(function () {
                // and - second expectation
                client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201).then(function () {
                    // and - third expectation
                    client.mockSimpleResponse('/somePathTwo', {name: 'two'}, 202).then(function () {

                        sendRequest("POST", "localhost", 1080, "/somePathOne", "someBody")
                            .then(function (response) {
                                test.equal(response.statusCode, 201);
                            }, function (error) {
                                test.ok(false, error);
                            }).then(function () {

                                sendRequest("GET", "localhost", 1080, "/somePathOne")
                                    .then(function (response) {
                                        test.equal(response.statusCode, 201);
                                    }, function (error) {
                                        test.ok(false, error);
                                    }).then(function () {

                                        sendRequest("GET", "localhost", 1080, "/notFound")
                                            .then(function (response) {
                                                test.ok(false, "should not match expectation");
                                            }, function (error) {
                                                test.equal(error, 404);
                                            }).then(function () {

                                                sendRequest("GET", "localhost", 1080, "/somePathTwo")
                                                    .then(function (response) {
                                                        test.equal(response.statusCode, 202);
                                                    }, function (error) {
                                                        test.ok(false, error);
                                                    }).then(function () {

                                                        // when
                                                        client.retrieveRequests("/.*").then(function (requests) {
                                                            // then
                                                            test.equals(requests.length, 4);
                                                            // first request
                                                            test.equals(requests[0].path, '/somePathOne');
                                                            test.equals(requests[0].method, 'POST');
                                                            test.equals(requests[0].body, 'someBody');
                                                            // second request
                                                            test.equals(requests[1].path, '/somePathOne');
                                                            test.equals(requests[1].method, 'GET');
                                                            // third request
                                                            test.equals(requests[2].path, '/notFound');
                                                            test.equals(requests[2].method, 'GET');
                                                            // fourth request
                                                            test.equals(requests[3].path, '/somePathTwo');
                                                            test.equals(requests[3].method, 'GET');
                                                            test.done();
                                                        }, function () {
                                                            test.ok(false, "should return correct requests");
                                                            test.done();
                                                        });
                                                    });
                                            });
                                    });
                            });
                    });
                });
            });
        }
    };

})();