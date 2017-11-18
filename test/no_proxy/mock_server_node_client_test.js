(function () {

    'use strict';


    function guid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }

        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }

    var fail = function (test) {
        return function (error) {
            test.ok(false, "failed with the following error \n" + error);
            test.done();
        };
    };

    var mockServer = require('../../');
    var mockServerClient = mockServer.mockServerClient;
    var proxyClient = mockServer.proxyClient;
    var Q = require('q');
    var http = require('http');
    var mockServerPort = 1080;
    var proxyPort = 1090;
    var uuid = guid();

    function sendRequest(method, host, port, path, jsonBody, headers) {
        var deferred = Q.defer();

        var body = (typeof jsonBody === "string" ? jsonBody : JSON.stringify(jsonBody || ""));
        var options = {
            method: method,
            host: host,
            path: path,
            port: port,
            headers: headers || {}
        };
        options.headers.Connection = "keep-alive";

        var callback = function (response) {
            var body = '';

            response.on('data', function (chunk) {
                body += chunk;
            });

            response.on('end', function () {
                if (response.statusCode >= 400 && response.statusCode < 600) {
                    deferred.reject({
                        statusCode: response.statusCode,
                        headers: response.headers,
                        body: body
                    });
                } else {
                    deferred.resolve({
                        statusCode: response.statusCode,
                        headers: response.headers,
                        body: body
                    });
                }
            });
        };

        var req = http.request(options, callback);
        if (options.method === "POST") {
            req.write(body);
        }
        req.end();

        return deferred.promise;
    }

    var client = mockServerClient("localhost", mockServerPort);

    exports.mock_server_node_client_test = {
        setUp: function (callback) {
            mockServerClient("localhost", mockServerPort).reset().then(function () {
                proxyClient("localhost", proxyPort).reset().then(function () {
                    callback();
                }, function (error) {
                    throw 'Failed with error ' + JSON.stringify(error);
                });
            }, function (error) {
                throw 'Failed with error ' + JSON.stringify(error);
            });
        },

        'should create full expectation with string body': function (test) {
            // when
            client.mockAnyResponse(
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
                            'string': 'someBody'
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
                sendRequest("GET", "localhost", mockServerPort, "/otherPath")
                    .then(function (response) {
                        test.ok(false, "should not match expectation");
                        test.done();
                    }, function (error) {
                        test.equal(error.statusCode, 404);
                    })
                    .then(function () {

                        // then - matching request
                        sendRequest("POST", "localhost", mockServerPort, "/somePath?test=true", "someBody")
                            .then(function (response) {
                                test.equal(response.statusCode, 200);
                                test.equal(response.body, '{"name":"value"}');
                            }, function (error) {
                                test.ok(false, "should match expectation");
                                test.done();
                            })
                            .then(function () {

                                // then - matching request, but no times remaining
                                sendRequest("POST", "localhost", mockServerPort, "/somePath?test=true", "someBody")
                                    .then(function (response) {
                                        test.ok(false, "should match expectation but no times remaining");
                                        test.done();
                                    }, function (error) {
                                        test.equal(error.statusCode, 404);
                                    })
                                    .then(function () {
                                        test.done();
                                    });
                            });
                    });
            }, function (error) {
                test.ok(false, "failed while mocking request \n" + error);
                test.done();
            });
        },

        'should expose server validation failure': function (test) {
            // when
            client.mockAnyResponse(
                {
                    'httpRequest': {
                        'paths': '/somePath',
                        'body': {
                            'type': "STRING",
                            'vaue': 'someBody'
                        }
                    },
                    'httpResponse': { }
                }
            ).then(function () {
                test.ok(false, "client should have failed promise for server validation error");
                test.done();
            }, function (error) {
                test.equal(error.statusCode, 400);
                test.equal(error.body, "2 errors:\n" +
                    " - object instance has properties which are not allowed by the schema: [\"paths\"] for field \"/httpRequest\"\n" +
                    " - for field \"/httpRequest/body\" a plain string or one of the following example bodies must be specified \n" +
                    "   {\n" +
                    "     \"not\": false,\n" +
                    "     \"type\": \"BINARY\",\n" +
                    "     \"base64Bytes\": \"\",\n" +
                    "     \"contentType\": \"\"\n" +
                    "   }, \n" +
                    "   {\n" +
                    "     \"not\": false,\n" +
                    "     \"type\": \"JSON\",\n" +
                    "     \"json\": \"\",\n" +
                    "     \"contentType\": \"\",\n" +
                    "     \"matchType\": \"ONLY_MATCHING_FIELDS\"\n" +
                    "   },\n" +
                    "   {\n" +
                    "     \"not\": false,\n" +
                    "     \"type\": \"JSON_SCHEMA\",\n" +
                    "     \"jsonSchema\": \"\"\n" +
                    "   },\n" +
                    "   {\n" +
                    "     \"not\": false,\n" +
                    "     \"type\": \"PARAMETERS\",\n" +
                    "     \"parameters\": \"TO DO\"\n" +
                    "   },\n" +
                    "   {\n" +
                    "     \"not\": false,\n" +
                    "     \"type\": \"REGEX\",\n" +
                    "     \"regex\": \"\"\n" +
                    "   },\n" +
                    "   {\n" +
                    "     \"not\": false,\n" +
                    "     \"type\": \"STRING\",\n" +
                    "     \"string\": \"\"\n" +
                    "   },\n" +
                    "   {\n" +
                    "     \"not\": false,\n" +
                    "     \"type\": \"XML\",\n" +
                    "     \"xml\": \"\",\n" +
                    "     \"contentType\": \"\"\n" +
                    "   },\n" +
                    "   {\n" +
                    "     \"not\": false,\n" +
                    "     \"type\": \"XML_SCHEMA\",\n" +
                    "     \"xmlSchema\": \"\"\n" +
                    "   },\n" +
                    "   {\n" +
                    "     \"not\": false,\n" +
                    "     \"type\": \"XPATH\",\n" +
                    "     \"xpath\": \"\"\n" +
                    "   }");
                test.done();
            });
        },

        'should match on method only': function (test) {
            // when
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
                    sendRequest("PUT", "localhost", mockServerPort, "/somePath")
                        .then(function (response) {
                            test.ok(false, "should not match expectation");
                            test.done();
                        }, function (error) {
                            test.equal(error.statusCode, 404);
                        })
                        .then(function () {

                            // then - matching first expectation
                            sendRequest("GET", "localhost", mockServerPort, "/somePath")
                                .then(function (response) {
                                    test.equal(response.statusCode, 200);
                                    test.equal(response.body, '{"name":"first_body"}');
                                }, function () {
                                    test.ok(false, "should match expectation");
                                    test.done();
                                })
                                .then(function () {

                                    // then - request that matches second expectation
                                    sendRequest("POST", "localhost", mockServerPort, "/somePath")
                                        .then(function (response) {
                                            test.equal(response.statusCode, 200);
                                            test.equal(response.body, '{"name":"second_body"}');
                                        }, function (error) {
                                            test.ok(false, "should match expectation");
                                            test.done();
                                        })
                                        .then(function () {
                                            test.done();
                                        });
                                });
                        });
                }, function (error) {
                    test.ok(false, "failed while mocking request \n" + error);
                    test.done();
                });
            }, function (error) {
                test.ok(false, "failed while mocking request \n" + error);
                test.done();
            });
        },

        'should match on path only': function (test) {
            // when
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
                    sendRequest("GET", "localhost", mockServerPort, "/otherPath")
                        .then(function (response) {
                            test.ok(false, "should not match expectation");
                            test.done();
                        }, function (error) {
                            test.equal(error.statusCode, 404);
                        })
                        .then(function () {

                            // then - matching first expectation
                            sendRequest("GET", "localhost", mockServerPort, "/firstPath")
                                .then(function (response) {
                                    test.equal(response.statusCode, 200);
                                    test.equal(response.body, '{"name":"first_body"}');
                                }, function () {
                                    test.ok(false, "should match expectation");
                                    test.done();
                                })
                                .then(function () {

                                    // then - request that matches second expectation
                                    sendRequest("GET", "localhost", mockServerPort, "/secondPath")
                                        .then(function (response) {
                                            test.equal(response.statusCode, 200);
                                            test.equal(response.body, '{"name":"second_body"}');
                                        }, function (error) {
                                            test.ok(false, "should match expectation");
                                            test.done();
                                        })
                                        .then(function () {
                                            test.done();
                                        });
                                });
                        });
                }, function (error) {
                    test.ok(false, "failed while mocking request \n" + error);
                    test.done();
                });
            }, function (error) {
                test.ok(false, "failed while mocking request \n" + error);
                test.done();
            });
        },

        'should match on query string parameters only': function (test) {
            // when
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
                    sendRequest("GET", "localhost", mockServerPort, "/somePath?param=other")
                        .then(function (response) {
                            test.ok(false, "should not match expectation");
                            test.done();
                        }, function (error) {
                            test.equal(error.statusCode, 404);
                        })
                        .then(function () {

                            // then - matching first expectation
                            sendRequest("GET", "localhost", mockServerPort, "/somePath?param=first")
                                .then(function (response) {
                                    test.equal(response.statusCode, 200);
                                    test.equal(response.body, '{"name":"first_body"}');
                                }, function () {
                                    test.ok(false, "should match expectation");
                                    test.done();
                                })
                                .then(function () {

                                    // then - request that matches second expectation
                                    sendRequest("GET", "localhost", mockServerPort, "/somePath?param=second")
                                        .then(function (response) {
                                            test.equal(response.statusCode, 200);
                                            test.equal(response.body, '{"name":"second_body"}');
                                        }, function (error) {
                                            test.ok(false, "should match expectation");
                                            test.done();
                                        })
                                        .then(function () {
                                            test.done();
                                        });
                                });
                        });
                }, function (error) {
                    test.ok(false, "failed while mocking request \n" + error);
                    test.done();
                });
            }, function (error) {
                test.ok(false, "failed while mocking request \n" + error);
                test.done();
            });
        },

        'should match on body only': function (test) {
            // when
            client.mockAnyResponse(
                {
                    'httpRequest': {
                        'body': {
                            'type': "STRING",
                            'string': 'someBody'
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
                                'regex': 'someOtherBody'
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
                    sendRequest("POST", "localhost", mockServerPort, "/otherPath", "someIncorrectBody")
                        .then(function (response) {
                            test.ok(false, "should not match expectation");
                            test.done();
                        }, function (error) {
                            test.equal(error.statusCode, 404);
                        })
                        .then(function () {

                            // then - matching first expectation
                            sendRequest("POST", "localhost", mockServerPort, "/somePath", "someBody")
                                .then(function (response) {
                                    test.equal(response.statusCode, 200);
                                    test.equal(response.body, '{"name":"first_body"}');
                                }, function () {
                                    test.ok(false, "should match expectation");
                                    test.done();
                                })
                                .then(function () {

                                    // then - request that matches second expectation
                                    sendRequest("POST", "localhost", mockServerPort, "/somePath", "someOtherBody")
                                        .then(function (response) {
                                            test.equal(response.statusCode, 200);
                                            test.equal(response.body, '{"name":"second_body"}');
                                        }, function (error) {
                                            test.ok(false, "should match expectation");
                                            test.done();
                                        })
                                        .then(function () {
                                            test.done();
                                        });
                                });
                        });
                }, function (error) {
                    test.ok(false, "failed while mocking request \n" + error);
                    test.done();
                });
            }, function (error) {
                test.ok(false, "failed while mocking request \n" + error);
                test.done();
            });
        },

        'should match on headers only': function (test) {
            // when
            client.mockAnyResponse(
                {
                    'httpRequest': {
                        'headers': [
                            {
                                'name': 'Allow',
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
                                    'name': 'Allow',
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
                    sendRequest("GET", "localhost", mockServerPort, "/somePath", "", {'Allow': 'other'})
                        .then(function (response) {
                            test.ok(false, "should not match expectation");
                            test.done();
                        }, function (error) {
                            test.equal(error.statusCode, 404);
                        })
                        .then(function () {

                            // then - matching first expectation
                            sendRequest("GET", "localhost", mockServerPort, "/somePath", "", {'Allow': 'first'})
                                .then(function (response) {
                                    test.equal(response.statusCode, 200);
                                    test.equal(response.body, '{"name":"first_body"}');
                                }, function () {
                                    test.ok(false, "should match expectation");
                                    test.done();
                                })
                                .then(function () {

                                    // then - request that matches second expectation
                                    sendRequest("GET", "localhost", mockServerPort, "/somePath", "", {'Allow': 'second'})
                                        .then(function (response) {
                                            test.equal(response.statusCode, 200);
                                            test.equal(response.body, '{"name":"second_body"}');
                                        }, function (error) {
                                            test.ok(false, "should match expectation");
                                            test.done();
                                        })
                                        .then(function () {
                                            test.done();
                                        });
                                });
                        });
                }, function (error) {
                    test.ok(false, "failed while mocking request \n" + error);
                    test.done();
                });
            }, function (error) {
                test.ok(false, "failed while mocking request \n" + error);
                test.done();
            });
        },

        'should match on cookies only': function (test) {
            // when
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
                    sendRequest("GET", "localhost", mockServerPort, "/somePath", "", {'Cookie': 'cookie=other'})
                        .then(function (response) {
                            test.ok(false, "should not match expectation");
                            test.done();
                        }, function (error) {
                            test.equal(error.statusCode, 404);
                        })
                        .then(function () {

                            // then - matching first expectation
                            sendRequest("GET", "localhost", mockServerPort, "/somePath", "", {'Cookie': 'cookie=first'})
                                .then(function (response) {
                                    test.equal(response.statusCode, 200);
                                    test.equal(response.body, '{"name":"first_body"}');
                                }, function () {
                                    test.ok(false, "should match expectation");
                                    test.done();
                                })
                                .then(function () {

                                    // then - request that matches second expectation
                                    sendRequest("GET", "localhost", mockServerPort, "/somePath", "", {'Cookie': 'cookie=second'})
                                        .then(function (response) {
                                            test.equal(response.statusCode, 200);
                                            test.equal(response.body, '{"name":"second_body"}');
                                        }, function (error) {
                                            test.ok(false, "should match expectation");
                                            test.done();
                                        })
                                        .then(function () {
                                            test.done();
                                        });
                                });
                        });
                }, function (error) {
                    test.ok(false, "failed while mocking request \n" + error);
                    test.done();
                });
            }, function (error) {
                test.ok(false, "failed while mocking request \n" + error);
                test.done();
            });
        },

        'should create simple response expectation': function (test) {
            // when
            client.mockSimpleResponse('/somePath', {name: 'value'}, 203)
                .then(function () {
                    // then - non matching request
                    sendRequest("POST", "localhost", mockServerPort, "/otherPath")
                        .then(function (response) {
                            test.ok(false, "should not match expectation");
                            test.done();
                        }, function (error) {
                            test.equal(error.statusCode, 404);
                        })
                        .then(function () {

                            // then - matching request
                            sendRequest("POST", "localhost", mockServerPort, "/somePath?test=true", "someBody")
                                .then(function (response) {
                                    test.equal(response.statusCode, 203);
                                    test.equal(response.body, '{"name":"value"}');
                                }, function () {
                                    test.ok(false, "should match expectation");
                                    test.done();
                                })
                                .then(function () {

                                    // then - matching request, but no times remaining
                                    sendRequest("POST", "localhost", mockServerPort, "/somePath?test=true", "someBody")
                                        .then(function (response) {
                                            test.ok(false, "should match expectation but no times remaining");
                                            test.done();
                                        }, function (error) {
                                            test.equal(error.statusCode, 404);
                                        })
                                        .then(function () {
                                            test.done();
                                        });
                                });
                        });
                });
        },

        'should create expectation with method callback': function (test) {

            // when
            client.mockWithCallback({
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
                    'string': 'someBody'
                }
            }, function (request) {
                if (request.method === 'POST' && request.path === '/somePath') {
                    return {
                        'statusCode': 200,
                        'body': JSON.stringify({name: 'value'})
                    };
                } else {
                    return {
                        'statusCode': 406
                    };
                }
            })
                .then(function () {

                    // then - non matching request
                    sendRequest("POST", "localhost", mockServerPort, "/somePath?test=true", "", {'Vary': uuid})
                        .then(function (response) {
                            test.ok(false, "should not match expectation");
                            test.done();
                        }, function (error) {
                            test.equal(error.statusCode, 404);
                        })
                        .then(function () {

                            // then - matching request
                            sendRequest("POST", "localhost", mockServerPort, "/somePath?test=true", "someBody", {'Vary': uuid})
                                .then(function (response) {

                                    test.equal(response.statusCode, 200);
                                    test.equal(response.body, '{"name":"value"}');

                                    // then - matching request, but no times remaining
                                    sendRequest("POST", "localhost", mockServerPort, "/somePath?test=true", "someBody", {'Vary': uuid})
                                        .then(function (response) {
                                            test.ok(false, "should not match expectation");
                                            test.done();
                                        }, function (error) {
                                            test.equal(error.statusCode, 404);
                                            test.done();
                                        });
                                }, function (error) {
                                    test.ok(false, "failed while sending request \n" + error);
                                    test.done();
                                });
                        });
                }, function (error) {
                    test.ok(false, "failed while mocking request \n" + error);
                    test.done();
                });
        },

        'should create multiple parallel expectation with method callback': function (test) {
            // when
            client.mockWithCallback({
                'method': 'GET',
                'path': '/one'
            }, function (request) {
                if (request.method === 'GET' && request.path === '/one') {
                    return {
                        'statusCode': 201,
                        'body': 'one'
                    };
                } else {
                    return {
                        'statusCode': 406
                    };
                }
            }, {
                remainingTimes: 2,
                unlimited: false
            })
                .then(function () {

                    client.mockWithCallback({
                        'method': 'GET',
                        'path': '/two'
                    }, function (request) {
                        if (request.method === 'GET' && request.path === '/two') {
                            return {
                                'statusCode': 202,
                                'body': 'two'
                            };
                        } else {
                            return {
                                'statusCode': 406
                            };
                        }
                    })
                        .then(function () {

                            // then - first matching request
                            sendRequest("GET", "localhost", mockServerPort, "/one", "", {'Vary': uuid})
                                .then(function (response) {

                                    test.equal(response.statusCode, 201);
                                    test.equal(response.body, 'one');

                                    // then - second matching request
                                    sendRequest("GET", "localhost", mockServerPort, "/two", "someBody", {'Vary': uuid})
                                        .then(function (response) {

                                            test.equal(response.statusCode, 202);
                                            test.equal(response.body, 'two');

                                            // then - first matching request again
                                            sendRequest("GET", "localhost", mockServerPort, "/one", "", {'Vary': uuid})
                                                .then(function (response) {

                                                    test.equal(response.statusCode, 201);
                                                    test.equal(response.body, 'one');

                                                    test.done();
                                                }, function (error) {
                                                    test.ok(false, "failed while sending request \n" + error);
                                                    test.done();
                                                });
                                        }, function (error) {
                                            test.ok(false, "failed while sending request \n" + error);
                                            test.done();
                                        });
                                }, function (error) {
                                    test.ok(false, "failed while sending request \n" + error);
                                    test.done();
                                });
                        }, function (error) {
                            test.ok(false, "failed while mocking request \n" + error);
                            test.done();
                        });
                }, function (error) {
                    test.ok(false, "failed while mocking request \n" + error);
                    test.done();
                });
        },

        'should create expectation with method callback with numeric times': function (test) {
            // when
            client.mockWithCallback({
                'method': 'GET',
                'path': '/one'
            }, function (request) {
                if (request.method === 'GET' && request.path === '/one') {
                    return {
                        'statusCode': 201,
                        'body': 'one'
                    };
                } else {
                    return {
                        'statusCode': 406
                    };
                }
            }, 2).then(function () {

                // then - first matching request
                sendRequest("GET", "localhost", mockServerPort, "/one", "", {'Vary': uuid})
                    .then(function (response) {
                        test.equal(response.statusCode, 201);
                        test.equal(response.body, 'one');

                        // then - first matching request again
                        sendRequest("GET", "localhost", mockServerPort, "/one", "", {'Vary': uuid})
                            .then(function (response) {
                                test.equal(response.statusCode, 201);
                                test.equal(response.body, 'one');

                                // then - should no match request again
                                sendRequest("GET", "localhost", mockServerPort, "/one", "", {'Vary': uuid})
                                    .then(function (response) {
                                        test.ok(false, "should not match expectation");
                                        test.done();
                                    }, function (error) {
                                        test.equal(error.statusCode, 404);
                                        test.done();
                                    });
                            }, function (error) {
                                test.ok(false, "failed while sending request \n" + error);
                                test.done();
                            });
                    }, function (error) {
                        test.ok(false, "failed while sending request \n" + error);
                        test.done();
                    });
            }, function (error) {
                test.ok(false, "failed while mocking request \n" + error);
                test.done();
            });
        },

        'should update default headers for simple response expectation': function (test) {
            // when
            client.setDefaultHeaders([
                {"name": "content-type", "values": ["application/json; charset=utf-8"]},
                {"name": "x-test", "values": ["test-value"]}
            ]);
            // and - an expectation
            client.mockSimpleResponse('/somePath', {name: 'value'}, 203).then(function () {
                // then - matching request
                sendRequest("POST", "localhost", mockServerPort, "/somePath?test=true", "someBody")
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
            }, function (error) {
                test.ok(false, "failed while mocking request \n" + error);
                test.done();
            });
        },

        'should verify exact number of requests have been sent': function (test) {
            // given
            client.mockSimpleResponse('/somePath', {name: 'value'}, 203).then(function () {
                // and - a request
                sendRequest("POST", "localhost", mockServerPort, "/somePath", "someBody")
                    .then(function (response) {
                        test.equal(response.statusCode, 203);
                    }, function (error) {
                        test.ok(false, error);
                    })
                    .then(function () {

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
            }, function (error) {
                test.ok(false, "failed while mocking request \n" + error);
                test.done();
            });
        },

        'should verify at least a number of requests have been sent': function (test) {
            // given
            client.mockSimpleResponse('/somePath', {name: 'value'}, 203).then(function () {
                // and - another expectation
                client.mockSimpleResponse('/somePath', {name: 'value'}, 203).then(function () {
                    // and - a request
                    sendRequest("POST", "localhost", mockServerPort, "/somePath", "someBody")
                        .then(function (response) {
                            test.equal(response.statusCode, 203);
                        }, function (error) {
                            test.ok(false, error);
                        })
                        .then(function () {
                            // and - another request
                            sendRequest("POST", "localhost", mockServerPort, "/somePath", "someBody")
                                .then(function (response) {
                                    test.equal(response.statusCode, 203);
                                }, function (error) {
                                    test.ok(false, error);
                                })
                                .then(function () {

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
                }, function (error) {
                    test.ok(false, "failed while mocking request \n" + error);
                    test.done();
                });
            }, function (error) {
                test.ok(false, "failed while mocking request \n" + error);
                test.done();
            });
        },

        'should fail when no requests have been sent': function (test) {
            // given
            client.mockSimpleResponse('/somePath', {name: 'value'}, 203).then(function () {
                // and - a request
                sendRequest("POST", "localhost", mockServerPort, "/somePath", "someBody")
                    .then(function (response) {
                        test.equal(response.statusCode, 203);
                    }, function (error) {
                        test.ok(false, error);
                    })
                    .then(function () {

                        // when - verify at least one request (should fail)
                        client.verify(
                            {
                                'path': '/someOtherPath'
                            }, 1)
                            .then(function () {
                                test.ok(false, "verification should have failed");
                                test.done();
                            }, function (message) {
                                test.strictEqual(message, "Request not found at least once, expected:<{\n" +
                                    "  \"path\" : \"/someOtherPath\"\n" +
                                    "}> but was:<{\n" +
                                    "  \"method\" : \"POST\",\n" +
                                    "  \"path\" : \"/somePath\",\n" +
                                    "  \"headers\" : [ {\n" +
                                    "    \"name\" : \"Host\",\n" +
                                    "    \"values\" : [ \"localhost:" + mockServerPort + "\" ]\n" +
                                    "  }, {\n" +
                                    "    \"name\" : \"content-length\",\n" +
                                    "    \"values\" : [ \"8\" ]\n" +
                                    "  } ],\n" +
                                    "  \"keepAlive\" : true,\n" +
                                    "  \"secure\" : false,\n" +
                                    "  \"body\" : \"someBody\"\n" +
                                    "}>");
                                test.done();
                            });
                    });
            }, function (error) {
                test.ok(false, "failed while mocking request \n" + error);
                test.done();
            });
        },

        'should fail when not enough exact requests have been sent': function (test) {
            // given
            client.mockSimpleResponse('/somePath', {name: 'value'}, 203).then(function () {
                // and - a request
                sendRequest("POST", "localhost", mockServerPort, "/somePath", "someBody")
                    .then(function (response) {
                        test.equal(response.statusCode, 203);
                    }, function (error) {
                        test.ok(false, error);
                    })
                    .then(function () {

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
                                test.strictEqual(message, "Request not found exactly 2 times, expected:<{\n" +
                                    "  \"method\" : \"POST\",\n" +
                                    "  \"path\" : \"/somePath\",\n" +
                                    "  \"body\" : \"someBody\"\n" +
                                    "}> but was:<{\n" +
                                    "  \"method\" : \"POST\",\n" +
                                    "  \"path\" : \"/somePath\",\n" +
                                    "  \"headers\" : [ {\n" +
                                    "    \"name\" : \"Host\",\n" +
                                    "    \"values\" : [ \"localhost:" + mockServerPort + "\" ]\n" +
                                    "  }, {\n" +
                                    "    \"name\" : \"content-length\",\n" +
                                    "    \"values\" : [ \"8\" ]\n" +
                                    "  } ],\n" +
                                    "  \"keepAlive\" : true,\n" +
                                    "  \"secure\" : false,\n" +
                                    "  \"body\" : \"someBody\"\n" +
                                    "}>");
                                test.done();
                            });
                    });
            }, function (error) {
                test.ok(false, "failed while mocking request \n" + error);
                test.done();
            });
        },

        'should fail when not enough at least requests have been sent': function (test) {
            // given - a client
            var client = mockServerClient("localhost", mockServerPort);
            // and - an expectation
            client.mockSimpleResponse('/somePath', {name: 'value'}, 203).then(function () {
                // and - a request
                sendRequest("POST", "localhost", mockServerPort, "/somePath", "someBody")
                    .then(function (response) {
                        test.equal(response.statusCode, 203);
                    }, function (error) {
                        test.ok(false, error);
                    })
                    .then(function () {

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
                                test.strictEqual(message, "Request not found at least 2 times, expected:<{\n" +
                                    "  \"method\" : \"POST\",\n" +
                                    "  \"path\" : \"/somePath\",\n" +
                                    "  \"body\" : \"someBody\"\n" +
                                    "}> but was:<{\n" +
                                    "  \"method\" : \"POST\",\n" +
                                    "  \"path\" : \"/somePath\",\n" +
                                    "  \"headers\" : [ {\n" +
                                    "    \"name\" : \"Host\",\n" +
                                    "    \"values\" : [ \"localhost:" + mockServerPort + "\" ]\n" +
                                    "  }, {\n" +
                                    "    \"name\" : \"content-length\",\n" +
                                    "    \"values\" : [ \"8\" ]\n" +
                                    "  } ],\n" +
                                    "  \"keepAlive\" : true,\n" +
                                    "  \"secure\" : false,\n" +
                                    "  \"body\" : \"someBody\"\n" +
                                    "}>");
                                test.done();
                            });
                    });
            }, function (error) {
                test.ok(false, "failed while mocking request \n" + error);
                test.done();
            });
        },

        'should pass when correct sequence of requests have been sent': function (test) {
            // given
            client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201).then(function () {
                // and - another expectation
                client.mockSimpleResponse('/somePathTwo', {name: 'two'}, 202).then(function () {
                    // and - a request
                    sendRequest("POST", "localhost", mockServerPort, "/somePathOne", "someBody")
                        .then(function (response) {
                            test.equal(response.statusCode, 201);
                        }, function (error) {
                            test.ok(false, error);
                        })
                        .then(function () {

                            sendRequest("GET", "localhost", mockServerPort, "/notFound")
                                .then(function (response) {
                                    test.ok(false, "should not match expectation");
                                    test.done();
                                }, function (error) {
                                    test.equal(error.statusCode, 404);
                                })
                                .then(function () {

                                    sendRequest("GET", "localhost", mockServerPort, "/somePathTwo")
                                        .then(function (response) {
                                            test.equal(response.statusCode, 202);
                                        }, function (error) {
                                            test.ok(false, error);
                                        })
                                        .then(function () {

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
                }, function (error) {
                    test.ok(false, "failed while mocking request \n" + error);
                    test.done();
                });
            }, function (error) {
                test.ok(false, "failed while mocking request \n" + error);
                test.done();
            });
        },

        'should fail when incorrect sequence (wrong order) of requests have been sent': function (test) {
            // given
            client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201).then(function () {
                // and - another expectation
                client.mockSimpleResponse('/somePathTwo', {name: 'two'}, 202).then(function () {
                    // and - a request
                    sendRequest("POST", "localhost", mockServerPort, "/somePathOne", "someBody")
                        .then(function (response) {
                            test.equal(response.statusCode, 201);
                        }, function (error) {
                            test.ok(false, error);
                        })
                        .then(function () {

                            sendRequest("GET", "localhost", mockServerPort, "/notFound")
                                .then(function (response) {
                                    test.ok(false, "should not match expectation");
                                    test.done();
                                }, function (error) {
                                    test.equal(error.statusCode, 404);
                                })
                                .then(function () {

                                    sendRequest("GET", "localhost", mockServerPort, "/somePathTwo")
                                        .then(function (response) {
                                            test.equal(response.statusCode, 202);
                                        }, function (error) {
                                            test.ok(false, error);
                                        })
                                        .then(function () {

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
                                                    test.strictEqual(message, "Request sequence not found, expected:<[ {\n" +
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
                                                        "    \"values\" : [ \"localhost:" + mockServerPort + "\" ]\n" +
                                                        "  }, {\n" +
                                                        "    \"name\" : \"content-length\",\n" +
                                                        "    \"values\" : [ \"8\" ]\n  } ],\n" +
                                                        "  \"keepAlive\" : true,\n" +
                                                        "  \"secure\" : false,\n" +
                                                        "  \"body\" : \"someBody\"\n" +
                                                        "}, {\n" +
                                                        "  \"method\" : \"GET\",\n" +
                                                        "  \"path\" : \"/notFound\",\n" +
                                                        "  \"headers\" : [ {\n" +
                                                        "    \"name\" : \"Host\",\n" +
                                                        "    \"values\" : [ \"localhost:" + mockServerPort + "\" ]\n" +
                                                        "  }, {\n" +
                                                        "    \"name\" : \"content-length\",\n" +
                                                        "    \"values\" : [ \"0\" ]\n" +
                                                        "  } ],\n" +
                                                        "  \"keepAlive\" : true,\n" +
                                                        "  \"secure\" : false\n" +
                                                        "}, {\n" +
                                                        "  \"method\" : \"GET\",\n" +
                                                        "  \"path\" : \"/somePathTwo\",\n" +
                                                        "  \"headers\" : [ {\n" +
                                                        "    \"name\" : \"Host\",\n" +
                                                        "    \"values\" : [ \"localhost:" + mockServerPort + "\" ]\n" +
                                                        "  }, {\n" +
                                                        "    \"name\" : \"content-length\",\n" +
                                                        "    \"values\" : [ \"0\" ]\n" +
                                                        "  } ],\n" +
                                                        "  \"keepAlive\" : true,\n" +
                                                        "  \"secure\" : false\n" +
                                                        "} ]>");
                                                    test.done();
                                                });

                                        });
                                });
                        });
                }, function (error) {
                    test.ok(false, "failed while mocking request \n" + error);
                    test.done();
                });
            }, function (error) {
                test.ok(false, "failed while mocking request \n" + error);
                test.done();
            });
        },

        'should fail when incorrect sequence (first request incorrect body) of requests have been sent': function (test) {
            // given
            client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201).then(function () {
                // and - another expectation
                client.mockSimpleResponse('/somePathTwo', {name: 'two'}, 202).then(function () {
                    // and - a request
                    sendRequest("POST", "localhost", mockServerPort, "/somePathOne", "someBody")
                        .then(function (response) {
                            test.equal(response.statusCode, 201);
                        }, function (error) {
                            test.ok(false, error);
                        })
                        .then(function () {

                            sendRequest("GET", "localhost", mockServerPort, "/notFound")
                                .then(function (response) {
                                    test.ok(false, "should not match expectation");
                                    test.done();
                                }, function (error) {
                                    test.equal(error.statusCode, 404);
                                })
                                .then(function () {

                                    sendRequest("GET", "localhost", mockServerPort, "/somePathTwo")
                                        .then(function (response) {
                                            test.equal(response.statusCode, 202);
                                        }, function (error) {
                                            test.ok(false, error);
                                        })
                                        .then(function () {

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
                                            ).then(function () {
                                                test.ok(false, "verification should have failed");
                                                test.done();
                                            }, function (message) {
                                                test.strictEqual(message, "Request sequence not found, expected:<[ {\n" +
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
                                                    "    \"values\" : [ \"localhost:" + mockServerPort + "\" ]\n" +
                                                    "  }, {\n" +
                                                    "    \"name\" : \"content-length\",\n" +
                                                    "    \"values\" : [ \"8\" ]\n" +
                                                    "  } ],\n" +
                                                    "  \"keepAlive\" : true,\n" +
                                                    "  \"secure\" : false,\n" +
                                                    "  \"body\" : \"someBody\"\n" +
                                                    "}, {\n" +
                                                    "  \"method\" : \"GET\",\n" +
                                                    "  \"path\" : \"/notFound\",\n" +
                                                    "  \"headers\" : [ {\n" +
                                                    "    \"name\" : \"Host\",\n" +
                                                    "    \"values\" : [ \"localhost:" + mockServerPort + "\" ]\n" +
                                                    "  }, {\n" +
                                                    "    \"name\" : \"content-length\",\n" +
                                                    "    \"values\" : [ \"0\" ]\n" +
                                                    "  } ],\n" +
                                                    "  \"keepAlive\" : true,\n" +
                                                    "  \"secure\" : false\n" +
                                                    "}, {\n  \"method\" : \"GET\",\n" +
                                                    "  \"path\" : \"/somePathTwo\",\n" +
                                                    "  \"headers\" : [ {\n" +
                                                    "    \"name\" : \"Host\",\n" +
                                                    "    \"values\" : [ \"localhost:" + mockServerPort + "\" ]\n" +
                                                    "  }, {\n" +
                                                    "    \"name\" : \"content-length\",\n" +
                                                    "    \"values\" : [ \"0\" ]\n" +
                                                    "  } ],\n" +
                                                    "  \"keepAlive\" : true,\n" +
                                                    "  \"secure\" : false\n" +
                                                    "} ]>");
                                                test.done();
                                            });
                                        });
                                });
                        });
                }, function (error) {
                    test.ok(false, "failed while mocking request \n" + error);
                    test.done();
                });
            }, function (error) {
                test.ok(false, "failed while mocking request \n" + error);
                test.done();
            });
        },

        'should clear expectations and logs by path': function (test) {
            // when
            client.mockSimpleResponse('/somePathOne', {name: 'value'}, 200).then(function () {
                // and - another expectation
                client.mockSimpleResponse('/somePathOne', {name: 'value'}, 200).then(function () {
                    // and - another expectation
                    client.mockSimpleResponse('/somePathTwo', {name: 'value'}, 200).then(function () {
                        // and - a matching request (that returns 200)
                        sendRequest("GET", "localhost", mockServerPort, "/somePathOne")
                            .then(function (response) {
                                test.equal(response.statusCode, 200);
                                test.equal(response.body, '{"name":"value"}');
                            }, function (error) {
                                test.ok(false, error);
                            })
                            .then(function () {

                                // when - some expectations cleared
                                client.clear('/somePathOne').then(function () {

                                    // then - request matching cleared expectation should return 404
                                    sendRequest("GET", "localhost", mockServerPort, "/somePathOne")
                                        .then(function (response) {
                                            test.ok(false, "should clear matching expectations");
                                            test.done();
                                        }, function (error) {
                                            test.strictEqual(error.statusCode, 404);
                                        })
                                        .then(function () {

                                            // and - request matching non-cleared expectation should return 200
                                            sendRequest("GET", "localhost", mockServerPort, "/somePathTwo")
                                                .then(function (response) {
                                                    test.equal(response.statusCode, 200);
                                                    test.equal(response.body, '{"name":"value"}');
                                                    // then - return no logs for clear requests
                                                    client.clear('/somePathOne').then(function () {
                                                        client.retrieveRequests({
                                                            "path": "/somePathOne"
                                                        })
                                                            .then(function (requests) {
                                                                test.equal(requests.length, 0);
                                                                // then - return logs for not cleared requests
                                                                client.retrieveRequests({
                                                                    "httpRequest": {
                                                                        "path": "/somePathTwo"
                                                                    }
                                                                })
                                                                    .then(function (requests) {
                                                                        test.equal(requests.length, 1);
                                                                        test.equal(requests[0].path, '/somePathTwo');

                                                                        test.done();
                                                                    }, function () {
                                                                        test.ok(false, "failed retrieving request");
                                                                        test.done();
                                                                    });
                                                            }, function () {
                                                                test.ok(false, "failed retrieving request");
                                                                test.done();
                                                            });
                                                    }, function () {
                                                        test.ok(false, "failed while clearing mockserver");
                                                        test.done();
                                                    });
                                                }, function (error) {
                                                    test.ok(false, "should not clear non-matching expectations");
                                                    test.done();
                                                });
                                        });
                                }, function () {
                                    test.ok(false, "failed while clearing mockserver");
                                    test.done();
                                });
                            });
                    }, function (error) {
                        test.ok(false, "failed while mocking request \n" + error);
                        test.done();
                    });
                }, function (error) {
                    test.ok(false, "failed while mocking request \n" + error);
                    test.done();
                });
            }, function (error) {
                test.ok(false, "failed while mocking request \n" + error);
                test.done();
            });
        },

        'should clear expectations by request matcher': function (test) {
            // when
            client.mockSimpleResponse('/somePathOne', {name: 'value'}, 200).then(function () {
                // and - another expectation
                client.mockSimpleResponse('/somePathOne', {name: 'value'}, 200).then(function () {
                    // and - another expectation
                    client.mockSimpleResponse('/somePathTwo', {name: 'value'}, 200).then(function () {
                        // and - a matching request (that returns 200)
                        sendRequest("GET", "localhost", mockServerPort, "/somePathOne")
                            .then(function (response) {
                                test.equal(response.statusCode, 200);
                                test.equal(response.body, '{"name":"value"}');
                            }, function (error) {
                                test.ok(false, error);
                            })
                            .then(function () {

                                // when - some expectations cleared
                                client.clear({
                                    "path": "/somePathOne"
                                })
                                    .then(function () {

                                        // then - request matching cleared expectation should return 404
                                        sendRequest("GET", "localhost", mockServerPort, "/somePathOne")
                                            .then(function (response) {
                                                test.ok(false, "should clear matching expectations");
                                                test.done();
                                            }, function (error) {
                                                test.strictEqual(error.statusCode, 404);
                                            })
                                            .then(function () {

                                                // and - request matching non-cleared expectation should return 200
                                                sendRequest("GET", "localhost", mockServerPort, "/somePathTwo")
                                                    .then(function (response) {
                                                        test.equal(response.statusCode, 200);
                                                        test.equal(response.body, '{"name":"value"}');
                                                        test.done();
                                                    }, function (error) {
                                                        test.ok(false, "should not clear non-matching expectations");
                                                        test.done();
                                                    });
                                            });
                                    }, function () {
                                        test.ok(false, "failed while clearing mockserver");
                                        test.done();
                                    });
                            });
                    }, function (error) {
                        test.ok(false, "failed while mocking request \n" + error);
                        test.done();
                    });
                }, function (error) {
                    test.ok(false, "failed while mocking request \n" + error);
                    test.done();
                });
            }, function (error) {
                test.ok(false, "failed while mocking request \n" + error);
                test.done();
            });
        },

        'should clear expectations by expectation matcher': function (test) {
            // when
            client.mockSimpleResponse('/somePathOne', {name: 'value'}, 200).then(function () {
                // and - another expectation
                client.mockSimpleResponse('/somePathOne', {name: 'value'}, 200).then(function () {
                    // and - another expectation
                    client.mockSimpleResponse('/somePathTwo', {name: 'value'}, 200).then(function () {
                        // and - a matching request (that returns 200)
                        sendRequest("GET", "localhost", mockServerPort, "/somePathOne")
                            .then(function (response) {
                                test.equal(response.statusCode, 200);
                                test.equal(response.body, '{"name":"value"}');
                            }, function (error) {
                                test.ok(false, error);
                            })
                            .then(function () {

                                // when - some expectations cleared
                                client.clear({
                                    "httpRequest": {
                                        "path": "/somePathOne"
                                    }
                                })
                                    .then(function () {

                                        // then - request matching cleared expectation should return 404
                                        sendRequest("GET", "localhost", mockServerPort, "/somePathOne")
                                            .then(function (response) {
                                                test.ok(false, "should clear matching expectations");
                                                test.done();
                                            }, function (error) {
                                                test.strictEqual(error.statusCode, 404);
                                            })
                                            .then(function () {

                                                // and - request matching non-cleared expectation should return 200
                                                sendRequest("GET", "localhost", mockServerPort, "/somePathTwo")
                                                    .then(function (response) {
                                                        test.equal(response.statusCode, 200);
                                                        test.equal(response.body, '{"name":"value"}');
                                                        test.done();
                                                    }, function (error) {
                                                        test.ok(false, "should not clear non-matching expectations");
                                                        test.done();
                                                    });
                                            });
                                    }, function () {
                                        test.ok(false, "failed while clearing mockserver");
                                        test.done();
                                    });
                            });
                    }, function (error) {
                        test.ok(false, "failed while mocking request \n" + error);
                        test.done();
                    });
                }, function (error) {
                    test.ok(false, "failed while mocking request \n" + error);
                    test.done();
                });
            }, function (error) {
                test.ok(false, "failed while mocking request \n" + error);
                test.done();
            });
        },

        'should clear only logs by path': function (test) {
            // when
            client.mockSimpleResponse('/somePathOne', {name: 'value'}, 200).then(function () {
                // and - another expectation
                client.mockSimpleResponse('/somePathOne', {name: 'value'}, 200).then(function () {
                    // and - another expectation
                    client.mockSimpleResponse('/somePathTwo', {name: 'value'}, 200).then(function () {
                        // and - a matching request (that returns 200)
                        sendRequest("GET", "localhost", mockServerPort, "/somePathOne")
                            .then(function (response) {
                                test.equal(response.statusCode, 200);
                                test.equal(response.body, '{"name":"value"}');
                            }, function (error) {
                                test.ok(false, error);
                            })
                            .then(function () {

                                // when - some expectations cleared
                                client.clear('/somePathOne', 'expectation').then(function () {

                                    // then - request matching cleared expectation should return 404
                                    sendRequest("GET", "localhost", mockServerPort, "/somePathOne")
                                        .then(function (response) {
                                            test.ok(false, "should clear matching expectations");
                                            test.done();
                                        }, function (error) {
                                            test.strictEqual(error.statusCode, 404);
                                        })
                                        .then(function () {

                                            // and - request matching non-cleared expectation should return 200
                                            sendRequest("GET", "localhost", mockServerPort, "/somePathTwo")
                                                .then(function (response) {
                                                    test.equal(response.statusCode, 200);
                                                    test.equal(response.body, '{"name":"value"}');

                                                    // then - return no logs for clear requests
                                                    client.clear('/somePathOne', 'log').then(function () {
                                                        client.retrieveRequests({
                                                            "path": "/somePathOne"
                                                        })
                                                            .then(function (requests) {
                                                                test.strictEqual(requests.length, 0);
                                                                test.done();
                                                            }, function () {
                                                                test.ok(false, "failed retrieving request");
                                                                test.done();
                                                            });
                                                    }, function () {
                                                        test.ok(false, "failed while clearing mockserver");
                                                        test.done();
                                                    });
                                                }, function (error) {
                                                    test.ok(false, "should not clear non-matching expectations");
                                                    test.done();
                                                });
                                        });
                                }, function () {
                                    test.ok(false, "failed while clearing mockserver");
                                    test.done();
                                });
                            });
                    }, function (error) {
                        test.ok(false, "failed while mocking request \n" + error);
                        test.done();
                    });
                }, function (error) {
                    test.ok(false, "failed while mocking request \n" + error);
                    test.done();
                });
            }, function (error) {
                test.ok(false, "failed while mocking request \n" + error);
                test.done();
            });
        },

        'should clear only expectation by path': function (test) {
            // when
            client.mockSimpleResponse('/somePathOne', {name: 'value'}, 200).then(function () {
                // and - another expectation
                client.mockSimpleResponse('/somePathOne', {name: 'value'}, 200).then(function () {
                    // and - another expectation
                    client.mockSimpleResponse('/somePathTwo', {name: 'value'}, 200).then(function () {
                        // and - a matching request (that returns 200)
                        sendRequest("GET", "localhost", mockServerPort, "/somePathOne")
                            .then(function (response) {
                                test.strictEqual(response.statusCode, 200);
                                test.strictEqual(response.body, '{"name":"value"}');
                            }, function (error) {
                                test.ok(false, error);
                            })
                            .then(function () {

                                // when - some expectations cleared
                                client.clear('/somePathOne', 'expectation').then(function () {

                                    // then - request matching cleared expectation should return 404
                                    sendRequest("GET", "localhost", mockServerPort, "/somePathOne")
                                        .then(function (response) {
                                            test.ok(false, "should clear matching expectations");
                                            test.done();
                                        }, function (error) {
                                            test.strictEqual(error.statusCode, 404);
                                        })
                                        .then(function () {

                                            // and - request matching non-cleared expectation should return 200
                                            sendRequest("GET", "localhost", mockServerPort, "/somePathTwo")
                                                .then(function (response) {
                                                    test.strictEqual(response.statusCode, 200);
                                                    test.strictEqual(response.body, '{"name":"value"}');
                                                    // then - return no logs for clear requests
                                                    client.clear('/somePathOne', 'log').then(function () {
                                                        client.retrieveRequests({
                                                            "path": "/somePathOne"
                                                        })
                                                            .then(function (requests) {
                                                                test.strictEqual(requests.length, 0);
                                                                // then - return logs for not cleared requests
                                                                client.retrieveRequests({
                                                                    "httpRequest": {
                                                                        "path": "/somePathTwo"
                                                                    }
                                                                })
                                                                    .then(function (requests) {
                                                                        test.strictEqual(requests.length, 1);
                                                                        test.strictEqual(requests[0].path, '/somePathTwo');

                                                                        test.done();
                                                                    }, function () {
                                                                        test.ok(false, "failed retrieving request");
                                                                        test.done();
                                                                    });
                                                            }, function () {
                                                                test.ok(false, "failed retrieving request");
                                                                test.done();
                                                            });
                                                    }, function () {
                                                        test.ok(false, "failed while clearing mockserver");
                                                        test.done();
                                                    });
                                                }, function (error) {
                                                    test.ok(false, "should not clear non-matching expectations");
                                                    test.done();
                                                });
                                        });
                                }, function () {
                                    test.ok(false, "failed while clearing mockserver");
                                    test.done();
                                });
                            });
                    }, function (error) {
                        test.ok(false, "failed while mocking request \n" + error);
                        test.done();
                    });
                }, function (error) {
                    test.ok(false, "failed while mocking request \n" + error);
                    test.done();
                });
            }, function (error) {
                test.ok(false, "failed while mocking request \n" + error);
                test.done();
            });
        },

        'should reset expectations': function (test) {
            // given - a client
            var client = mockServerClient("localhost", mockServerPort);
            // and - an expectation
            client.mockSimpleResponse('/somePathOne', {name: 'value'}, 200).then(function () {
                // and - another expectation
                client.mockSimpleResponse('/somePathOne', {name: 'value'}, 200).then(function () {
                    // and - another expectation
                    client.mockSimpleResponse('/somePathTwo', {name: 'value'}, 200).then(function () {
                        // and - a matching request (that returns 200)
                        sendRequest("GET", "localhost", mockServerPort, "/somePathOne")
                            .then(function (response) {
                                test.strictEqual(response.statusCode, 200);
                                test.strictEqual(response.body, '{"name":"value"}');
                            }, function (error) {
                                test.ok(false, "should match expectation");
                                test.done();
                            })
                            .then(function () {

                                // when - all expectations reset
                                client.reset().then(function () {

                                    // then - request matching one reset expectation should return 404
                                    sendRequest("GET", "localhost", mockServerPort, "/somePathOne")
                                        .then(function () {
                                            test.ok(false, "should clear all expectations");
                                            test.done();
                                        }, function (error) {
                                            test.strictEqual(error.statusCode, 404);
                                        })
                                        .then(function () {

                                            // then - request matching other reset expectation should return 404
                                            sendRequest("GET", "localhost", mockServerPort, "/somePathTwo")
                                                .then(function () {
                                                    test.ok(false, "should clear all expectations");
                                                    test.done();
                                                }, function (error) {
                                                    test.strictEqual(error.statusCode, 404);
                                                    test.done();
                                                });

                                        });
                                }, function () {
                                    test.ok(false, "failed while resetting mockserver");
                                    test.done();
                                });
                            });
                    }, function (error) {
                        test.ok(false, "failed while mocking request \n" + error);
                        test.done();
                    });
                }, function (error) {
                    test.ok(false, "failed while mocking request \n" + error);
                    test.done();
                });
            }, function (error) {
                test.ok(false, "failed while mocking request \n" + error);
                test.done();
            });
        },

        'should retrieve some expectations using object matcher': function (test) {
            // when
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
                        })
                            .then(function (expectations) {
                                // then
                                test.strictEqual(expectations.length, 2);
                                // first expectation
                                test.strictEqual(expectations[0].httpRequest.path, '/somePathOne');
                                test.strictEqual(expectations[0].httpResponse.body, '{"name":"one"}');
                                test.strictEqual(expectations[0].httpResponse.statusCode, 201);
                                // second expectation
                                test.strictEqual(expectations[1].httpRequest.path, '/somePathOne');
                                test.strictEqual(expectations[1].httpResponse.body, '{"name":"one"}');
                                test.strictEqual(expectations[1].httpResponse.statusCode, 201);
                                test.done();
                            }, function () {
                                test.ok(false, "should return expectation");
                                test.done();
                            });

                    }, function (error) {
                        test.ok(false, "failed while mocking request \n" + error);
                        test.done();
                    });

                }, function (error) {
                    test.ok(false, "failed while mocking request \n" + error);
                    test.done();
                });
            }, function (error) {
                test.ok(false, "failed while mocking request \n" + error);
                test.done();
            });
        },

        'should retrieve some expectations using path': function (test) {
            // when
            client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201).then(function () {
                // and - second expectation
                client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201).then(function () {
                    // and - third expectation
                    client.mockSimpleResponse('/somePathTwo', {name: 'two'}, 202).then(function () {

                        // when
                        client.retrieveExpectations("/somePathOne").then(function (expectations) {
                            // then
                            test.strictEqual(expectations.length, 2);
                            // first expectation
                            test.strictEqual(expectations[0].httpRequest.path, '/somePathOne');
                            test.strictEqual(expectations[0].httpResponse.body, '{"name":"one"}');
                            test.strictEqual(expectations[0].httpResponse.statusCode, 201);
                            // second expectation
                            test.strictEqual(expectations[1].httpRequest.path, '/somePathOne');
                            test.strictEqual(expectations[1].httpResponse.body, '{"name":"one"}');
                            test.strictEqual(expectations[1].httpResponse.statusCode, 201);
                            test.done();
                        }, function () {
                            test.ok(false, "should return expectation");
                            test.done();
                        });

                    }, function (error) {
                        test.ok(false, "failed while mocking request \n" + error);
                        test.done();
                    });
                }, function (error) {
                    test.ok(false, "failed while mocking request \n" + error);
                    test.done();
                });
            }, function (error) {
                test.ok(false, "failed while mocking request \n" + error);
                test.done();
            });
        },

        'should retrieve all expectations using object matcher': function (test) {
            // when
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
                        })
                            .then(function (expectations) {
                                // then
                                test.strictEqual(expectations.length, 3);
                                // first expectation
                                test.strictEqual(expectations[0].httpRequest.path, '/somePathOne');
                                test.strictEqual(expectations[0].httpResponse.body, '{"name":"one"}');
                                test.strictEqual(expectations[0].httpResponse.statusCode, 201);
                                // second expectation
                                test.strictEqual(expectations[1].httpRequest.path, '/somePathOne');
                                test.strictEqual(expectations[1].httpResponse.body, '{"name":"one"}');
                                test.strictEqual(expectations[1].httpResponse.statusCode, 201);
                                // third expectation
                                test.strictEqual(expectations[2].httpRequest.path, '/somePathTwo');
                                test.strictEqual(expectations[2].httpResponse.body, '{"name":"two"}');
                                test.strictEqual(expectations[2].httpResponse.statusCode, 202);
                                test.done();
                            }, function () {
                                test.ok(false, "should return expectation");
                                test.done();
                            });

                    }, function (error) {
                        test.ok(false, "failed while mocking request \n" + error);
                        test.done();
                    });

                }, function (error) {
                    test.ok(false, "failed while mocking request \n" + error);
                    test.done();
                });
            }, function (error) {
                test.ok(false, "failed while mocking request \n" + error);
                test.done();
            });
        },

        'should retrieve all expectations using null matcher': function (test) {
            // when
            client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201).then(function () {
                // and - second expectation
                client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201).then(function () {
                    // and - third expectation
                    client.mockSimpleResponse('/somePathTwo', {name: 'two'}, 202).then(function () {

                        // when
                        client.retrieveExpectations().then(function (expectations) {
                            // then
                            test.strictEqual(expectations.length, 3);
                            // first expectation
                            test.strictEqual(expectations[0].httpRequest.path, '/somePathOne');
                            test.strictEqual(expectations[0].httpResponse.body, '{"name":"one"}');
                            test.strictEqual(expectations[0].httpResponse.statusCode, 201);
                            // second expectation
                            test.strictEqual(expectations[1].httpRequest.path, '/somePathOne');
                            test.strictEqual(expectations[1].httpResponse.body, '{"name":"one"}');
                            test.strictEqual(expectations[1].httpResponse.statusCode, 201);
                            // third expectation
                            test.strictEqual(expectations[2].httpRequest.path, '/somePathTwo');
                            test.strictEqual(expectations[2].httpResponse.body, '{"name":"two"}');
                            test.strictEqual(expectations[2].httpResponse.statusCode, 202);
                            test.done();
                        }, function () {
                            test.ok(false, "should return expectation");
                            test.done();
                        });

                    }, function (error) {
                        test.ok(false, "failed while mocking request \n" + error);
                        test.done();
                    });

                }, function (error) {
                    test.ok(false, "failed while mocking request \n" + error);
                    test.done();
                });
            }, function (error) {
                test.ok(false, "failed while mocking request \n" + error);
                test.done();
            });
        },

        'should retrieve some requests using object matcher': function (test) {
            // given
            client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201).then(function () {
                // and - second expectation
                client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201).then(function () {
                    // and - third expectation
                    client.mockSimpleResponse('/somePathTwo', {name: 'two'}, 202).then(function () {

                        sendRequest("POST", "localhost", mockServerPort, "/somePathOne", "someBody")
                            .then(function (response) {
                                test.strictEqual(response.statusCode, 201);
                            }, function (error) {
                                test.ok(false, error);
                            })
                            .then(function () {

                                sendRequest("GET", "localhost", mockServerPort, "/somePathOne")
                                    .then(function (response) {
                                        test.strictEqual(response.statusCode, 201);
                                    }, function (error) {
                                        test.ok(false, error);
                                    })
                                    .then(function () {

                                        sendRequest("GET", "localhost", mockServerPort, "/notFound")
                                            .then(function (response) {
                                                test.ok(false, "should not match expectation");
                                                test.done();
                                            }, function (error) {
                                                test.strictEqual(error.statusCode, 404);
                                            })
                                            .then(function () {

                                                sendRequest("GET", "localhost", mockServerPort, "/somePathTwo")
                                                    .then(function (response) {
                                                        test.strictEqual(response.statusCode, 202);
                                                    }, function (error) {
                                                        test.ok(false, error);
                                                    })
                                                    .then(function () {

                                                        // when
                                                        client.retrieveRequests({
                                                            "httpRequest": {
                                                                "path": "/somePathOne"
                                                            }
                                                        })
                                                            .then(function (requests) {
                                                                // then
                                                                test.strictEqual(requests.length, 2);
                                                                // first request
                                                                test.strictEqual(requests[0].path, '/somePathOne');
                                                                test.strictEqual(requests[0].method, 'POST');
                                                                test.strictEqual(requests[0].body, 'someBody');
                                                                // second request
                                                                test.strictEqual(requests[1].path, '/somePathOne');
                                                                test.strictEqual(requests[1].method, 'GET');
                                                                test.done();
                                                            }, function () {
                                                                test.ok(false, "should return correct expectations");
                                                                test.done();
                                                            });
                                                    });
                                            });
                                    });
                            });
                    }, function (error) {
                        test.ok(false, "failed while mocking request \n" + error);
                        test.done();
                    });
                }, function (error) {
                    test.ok(false, "failed while mocking request \n" + error);
                    test.done();
                });
            }, function (error) {
                test.ok(false, "failed while mocking request \n" + error);
                test.done();
            });
        },

        'should retrieve some requests using path': function (test) {
            // given
            client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201).then(function () {
                // and - second expectation
                client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201).then(function () {
                    // and - third expectation
                    client.mockSimpleResponse('/somePathTwo', {name: 'two'}, 202).then(function () {

                        sendRequest("POST", "localhost", mockServerPort, "/somePathOne", "someBody")
                            .then(function (response) {
                                test.strictEqual(response.statusCode, 201);
                            }, function (error) {
                                test.ok(false, error);
                            })
                            .then(function () {

                                sendRequest("GET", "localhost", mockServerPort, "/somePathOne")
                                    .then(function (response) {
                                        test.strictEqual(response.statusCode, 201);
                                    }, function (error) {
                                        test.ok(false, error);
                                    })
                                    .then(function () {

                                        sendRequest("GET", "localhost", mockServerPort, "/notFound")
                                            .then(function (response) {
                                                test.ok(false, "should not match expectation");
                                                test.done();
                                            }, function (error) {
                                                test.strictEqual(error.statusCode, 404);
                                            })
                                            .then(function () {

                                                sendRequest("GET", "localhost", mockServerPort, "/somePathTwo")
                                                    .then(function (response) {
                                                        test.strictEqual(response.statusCode, 202);
                                                    }, function (error) {
                                                        test.ok(false, error);
                                                    })
                                                    .then(function () {

                                                        // when
                                                        client.retrieveRequests("/somePathOne").then(function (requests) {
                                                            // then
                                                            test.strictEqual(requests.length, 2);
                                                            // first request
                                                            test.strictEqual(requests[0].path, '/somePathOne');
                                                            test.strictEqual(requests[0].method, 'POST');
                                                            test.strictEqual(requests[0].body, 'someBody');
                                                            // second request
                                                            test.strictEqual(requests[1].path, '/somePathOne');
                                                            test.strictEqual(requests[1].method, 'GET');
                                                            test.done();
                                                        }, function () {
                                                            test.ok(false, "should return correct expectations");
                                                            test.done();
                                                        });
                                                    });
                                            });
                                    });
                            });
                    }, function (error) {
                        test.ok(false, "failed while mocking request \n" + error);
                        test.done();
                    });
                }, function (error) {
                    test.ok(false, "failed while mocking request \n" + error);
                    test.done();
                });
            }, function (error) {
                test.ok(false, "failed while mocking request \n" + error);
                test.done();
            });
        },

        'should retrieve all requests using object matcher': function (test) {
            // given
            client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201).then(function () {
                // and - second expectation
                client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201).then(function () {
                    // and - third expectation
                    client.mockSimpleResponse('/somePathTwo', {name: 'two'}, 202).then(function () {

                        sendRequest("POST", "localhost", mockServerPort, "/somePathOne", "someBody")
                            .then(function (response) {
                                test.strictEqual(response.statusCode, 201);
                            }, function (error) {
                                test.ok(false, error);
                            })
                            .then(function () {

                                sendRequest("GET", "localhost", mockServerPort, "/somePathOne")
                                    .then(function (response) {
                                        test.strictEqual(response.statusCode, 201);
                                    }, function (error) {
                                        test.ok(false, error);
                                    })
                                    .then(function () {

                                        sendRequest("GET", "localhost", mockServerPort, "/notFound")
                                            .then(function (response) {
                                                test.ok(false, "should not match expectation");
                                                test.done();
                                            }, function (error) {
                                                test.strictEqual(error.statusCode, 404);
                                            })
                                            .then(function () {

                                                sendRequest("GET", "localhost", mockServerPort, "/somePathTwo")
                                                    .then(function (response) {
                                                        test.strictEqual(response.statusCode, 202);
                                                    }, function (error) {
                                                        test.ok(false, error);
                                                    })
                                                    .then(function () {

                                                        // when
                                                        client.retrieveRequests({
                                                            "httpRequest": {
                                                                "path": "/.*"
                                                            }
                                                        })
                                                            .then(function (requests) {
                                                                // then
                                                                test.strictEqual(requests.length, 4);
                                                                // first request
                                                                test.strictEqual(requests[0].path, '/somePathOne');
                                                                test.strictEqual(requests[0].method, 'POST');
                                                                test.strictEqual(requests[0].body, 'someBody');
                                                                // second request
                                                                test.strictEqual(requests[1].path, '/somePathOne');
                                                                test.strictEqual(requests[1].method, 'GET');
                                                                // third request
                                                                test.strictEqual(requests[2].path, '/notFound');
                                                                test.strictEqual(requests[2].method, 'GET');
                                                                // fourth request
                                                                test.strictEqual(requests[3].path, '/somePathTwo');
                                                                test.strictEqual(requests[3].method, 'GET');
                                                                test.done();
                                                            }, function () {
                                                                test.ok(false, "should return correct requests");
                                                                test.done();
                                                            });
                                                    });
                                            });
                                    });
                            });
                    }, function (error) {
                        test.ok(false, "failed while mocking request \n" + error);
                        test.done();
                    });
                }, function (error) {
                    test.ok(false, "failed while mocking request \n" + error);
                    test.done();
                });
            }, function (error) {
                test.ok(false, "failed while mocking request \n" + error);
                test.done();
            });
        },

        'should retrieve all requests using path': function (test) {
            // given - a client
            var client = mockServerClient("localhost", mockServerPort);
            // and - first expectation
            client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201).then(function () {
                // and - second expectation
                client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201).then(function () {
                    // and - third expectation
                    client.mockSimpleResponse('/somePathTwo', {name: 'two'}, 202).then(function () {

                        sendRequest("POST", "localhost", mockServerPort, "/somePathOne", "someBody")
                            .then(function (response) {
                                test.strictEqual(response.statusCode, 201);
                            }, function (error) {
                                test.ok(false, error);
                            })
                            .then(function () {

                                sendRequest("GET", "localhost", mockServerPort, "/somePathOne")
                                    .then(function (response) {
                                        test.strictEqual(response.statusCode, 201);
                                    }, function (error) {
                                        test.ok(false, error);
                                    })
                                    .then(function () {

                                        sendRequest("GET", "localhost", mockServerPort, "/notFound")
                                            .then(function (response) {
                                                test.ok(false, "should not match expectation");
                                                test.done();
                                            }, function (error) {
                                                test.strictEqual(error.statusCode, 404);
                                            })
                                            .then(function () {

                                                sendRequest("GET", "localhost", mockServerPort, "/somePathTwo")
                                                    .then(function (response) {
                                                        test.strictEqual(response.statusCode, 202);
                                                    }, function (error) {
                                                        test.ok(false, error);
                                                    })
                                                    .then(function () {

                                                        // when
                                                        client.retrieveRequests("/.*").then(function (requests) {
                                                            // then
                                                            test.strictEqual(requests.length, 4);
                                                            // first request
                                                            test.strictEqual(requests[0].path, '/somePathOne');
                                                            test.strictEqual(requests[0].method, 'POST');
                                                            test.strictEqual(requests[0].body, 'someBody');
                                                            // second request
                                                            test.strictEqual(requests[1].path, '/somePathOne');
                                                            test.strictEqual(requests[1].method, 'GET');
                                                            // third request
                                                            test.strictEqual(requests[2].path, '/notFound');
                                                            test.strictEqual(requests[2].method, 'GET');
                                                            // fourth request
                                                            test.strictEqual(requests[3].path, '/somePathTwo');
                                                            test.strictEqual(requests[3].method, 'GET');
                                                            test.done();
                                                        }, function () {
                                                            test.ok(false, "should return correct requests");
                                                            test.done();
                                                        });
                                                    });
                                            });
                                    });
                            });
                    }, function (error) {
                        test.ok(false, "failed while mocking request \n" + error);
                        test.done();
                    });
                }, function (error) {
                    test.ok(false, "failed while mocking request \n" + error);
                    test.done();
                });
            }, function (error) {
                test.ok(false, "failed while mocking request \n" + error);
                test.done();
            });
        }
    };

})();