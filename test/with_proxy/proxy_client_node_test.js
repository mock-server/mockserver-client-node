(function () {

  'use strict';

  var mockServer = require('../../');
  var mockServerClient = mockServer.mockServerClient;
  var proxyClient = mockServer.proxyClient;
  var Q = require('q');
  var http = require('http');
  var mockServerPort = 1080;
  var proxyPort = 1090;

  function sendRequestViaProxy(destinationUrl, jsonBody, method) {
    var deferred = Q.defer();

    var body = (typeof jsonBody === "string" ? jsonBody : JSON.stringify(jsonBody || ""));
    var options = {
      method: method || "POST",
      host: "localhost",
      port: proxyPort,
      headers: {
        Host: "localhost:" + mockServerPort,
        Connection: "keep-alive"
      },
      path: destinationUrl
    };

    var callback = function (response) {
      var data = '';

      response.on('data', function (chunk) {
        data += chunk;
      });

      response.on('end', function () {
        if (response.statusCode >= 400 && response.statusCode < 600) {
          if (response.statusCode === 404) {
            deferred.reject("404 Not Found");
          } else {
            deferred.reject(data);
          }
        } else {
          deferred.resolve({
            statusCode: response.statusCode,
            headers: response.headers,
            body: data
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

  var fail = function (test) {
    return function (error) {
      test.ok(false, "failed with the following error \n" + error);
      test.done();
    };
  };

  exports.proxy_client_node_test = {
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

    'should verify exact number of requests have been sent': function (test) {
      // given - a client
      var client = proxyClient("localhost", proxyPort);
      // and - a request
      sendRequestViaProxy("http://localhost:" + mockServerPort + "/somePath", "someBody")
        .then(fail(test), function (error) {
          test.equal(error, "404 Not Found");

          // and - another request
          sendRequestViaProxy("http://localhost:" + mockServerPort + "/somePath", "someBody")
            .then(fail(test), function (error) {
              test.equal(error, "404 Not Found");

              // and - a verification that passes
              client.verify(
                {
                  'method': 'POST',
                  'path': '/somePath',
                  'body': 'someBody'
                }, 2, true).then(function () {
                test.done();
              }, fail(test));
            });
        });
    },

    'should verify at least a number of requests have been sent': function (test) {
      // given - a client
      var client = proxyClient("localhost", proxyPort);
      // and - a request
      sendRequestViaProxy("http://localhost:" + mockServerPort + "/somePath", "someBody")
        .then(fail(test), function (error) {
          test.equal(error, "404 Not Found");

          // and - another request
          sendRequestViaProxy("http://localhost:" + mockServerPort + "/someOtherPath", "someBody")
            .then(fail(test), function (error) {
              test.equal(error, "404 Not Found");

              // and - a verification that passes
              client.verify(
                {
                  'method': 'POST',
                  'path': '/somePath',
                  'body': 'someBody'
                }, 1).then(function () {
                test.done();
              }, fail(test));
            });
        });
    },

    'should fail when no requests have been sent': function (test) {
      // given - a client
      var client = proxyClient("localhost", proxyPort);
      // and - a request
      sendRequestViaProxy("http://localhost:" + mockServerPort + "/somePath", "someBody")
        .then(fail(test), function (error) {
          test.equal(error, "404 Not Found");

          // when - a verification that should fail
          client.verify(
            {
              'path': '/someOtherPath'
            }, 1)
            .then(fail(test), function (message) {
              test.ok(message.startsWith("Request not found at least once, expected:<{\n" +
                "  \"path\" : \"/someOtherPath\"\n" +
                "}> but was:<{\n"));
              test.done();
            });
        });
    },

    'should fail when not enough exact requests have been sent': function (test) {
      // given - a client
      var client = proxyClient("localhost", proxyPort);
      // and - a request
      sendRequestViaProxy("http://localhost:" + mockServerPort + "/somePath", "someBody")
        .then(fail(test), function (error) {
          test.equal(error, "404 Not Found");

          // when - a verification that should fail
          client.verify(
            {
              'method': 'POST',
              'path': '/somePath',
              'body': 'someBody'
            }, 2, true)
            .then(fail(test), function (message) {
              test.ok(message.startsWith("Request not found exactly 2 times, expected:<{\n" +
                "  \"method\" : \"POST\",\n" +
                "  \"path\" : \"/somePath\",\n" +
                "  \"body\" : \"someBody\"\n" +
                "}> but was:<{\n"));
              test.done();
            });
        });
    },

    'should fail when not enough at least requests have been sent': function (test) {
      // given - a client
      var client = proxyClient("localhost", proxyPort);
      // and - a request
      sendRequestViaProxy("http://localhost:" + mockServerPort + "/somePath", "someBody")
        .then(fail(test), function (error) {
          test.equal(error, "404 Not Found");

          // when - a verification that should fail
          client.verify(
            {
              'method': 'POST',
              'path': '/somePath',
              'body': 'someBody'
            }, 2)
            .then(fail(test), function (message) {
              test.ok(message.startsWith("Request not found at least 2 times, expected:<{\n" +
                "  \"method\" : \"POST\",\n" +
                "  \"path\" : \"/somePath\",\n" +
                "  \"body\" : \"someBody\"\n" +
                "}> but was:<{\n"));
              test.done();
            });
        });
    },

    'should pass when correct sequence of requests have been sent': function (test) {
      // given
      var client = proxyClient("localhost", mockServerPort);
      sendRequestViaProxy("http://localhost:" + mockServerPort + "/one", "someBody")
        .then(fail(test), function (error) {
          test.equal(error, "404 Not Found");
          sendRequestViaProxy("http://localhost:" + mockServerPort + "/two", undefined, "GET")
            .then(fail(test), function (error) {
              test.equal(error, "404 Not Found");
              sendRequestViaProxy("http://localhost:" + mockServerPort + "/three", undefined, "GET")
                .then(fail(test), function (error) {
                  test.equal(error, "404 Not Found");

                  // when
                  client.verifySequence(
                    {
                      'method': 'POST',
                      'path': '/one',
                      'body': 'someBody'
                    },
                    {
                      'method': 'GET',
                      'path': '/two'
                    },
                    {
                      'method': 'GET',
                      'path': '/three'
                    }
                  ).then(function () {
                    test.done();
                  }, fail(test));
                });
            });
        });

    },

    'should fail when incorrect sequence of requests have been sent': function (test) {
      // given
      var client = proxyClient("localhost", mockServerPort);

      sendRequestViaProxy("http://localhost:" + mockServerPort + "/one", "someBody")
        .then(fail(test), function (error) {
          test.equal(error, "404 Not Found");

          sendRequestViaProxy("http://localhost:" + mockServerPort + "/two", undefined, "GET")
            .then(fail(test), function (error) {
              test.equal(error, "404 Not Found");

              sendRequestViaProxy("http://localhost:" + mockServerPort + "/three", undefined, "GET")
                .then(fail(test), function (error) {
                  test.equal(error, "404 Not Found");

                  // when - wrong order
                  client.verifySequence({
                      'method': 'POST',
                      'path': '/one',
                      'body': 'someBody'
                    },
                    {
                      'method': 'GET',
                      'path': '/three'
                    },
                    {
                      'method': 'GET',
                      'path': '/two'
                    })
                    .then(fail(test), function () {

                      // when - first request incorrect body
                      client.verifySequence({
                          'method': 'POST',
                          'path': '/one',
                          'body': 'some_incorrect_body'
                        },
                        {
                          'method': 'GET',
                          'path': '/two'
                        },
                        {
                          'method': 'GET',
                          'path': '/three'
                        })
                        .then(fail(test), function () {
                          test.done();
                        });

                    });
                });
            });
        });

    },

    'should clear proxy by path': function (test) {
      // given - a client
      var client = proxyClient("localhost", proxyPort);

      // and - a request
      sendRequestViaProxy("http://localhost:" + mockServerPort + "/somePath", "someBody")
        .then(fail(test), function (error) {
          test.equal(error, "404 Not Found");

          // and - another request
          sendRequestViaProxy("http://localhost:" + mockServerPort + "/someOtherPath", "someBody")
            .then(fail(test), function (error) {
              test.equal(error, "404 Not Found");

              // and - a verification that passes
              client.verify({
                'method': 'POST',
                'path': '/somePath',
                'body': 'someBody'
              }, 1)
                .then(function () {
                  // when - matching requests cleared
                  client.clear('/somePath')
                    .then(function () {

                      // then - the verification should fail requests that were cleared
                      client.verify({
                        'method': 'POST',
                        'path': '/somePath',
                        'body': 'someBody'
                      }, 1)
                        .then(fail(test), function (message) {
                          test.ok(message.startsWith("Request not found at least once, expected:<{\n" +
                            "  \"method\" : \"POST\",\n" +
                            "  \"path\" : \"/somePath\",\n" +
                            "  \"body\" : \"someBody\"\n" +
                            "}> but was:<{\n"));
                          // then - the verification should pass for other requests
                          client.verify({
                            'method': 'POST',
                            'path': '/someOtherPath',
                            'body': 'someBody'
                          }, 1)
                            .then(function () {
                              test.ok(true, "verification has passed");
                              test.done();
                            }, fail(test));
                        });
                    }, fail(test));
                }, fail(test));
            });
        });
    },

    'should clear proxy by request matcher': function (test) {
      // given - a client
      var client = proxyClient("localhost", proxyPort);
      // and - a request
      sendRequestViaProxy("http://localhost:" + mockServerPort + "/somePath", "someBody")
        .then(fail(test), function (error) {
          test.equal(error, "404 Not Found");

          // and - another request
          sendRequestViaProxy("http://localhost:" + mockServerPort + "/someOtherPath", "someBody")
            .then(fail(test), function (error) {
              test.equal(error, "404 Not Found");

              // and - a verification that passes
              client.verify({
                'method': 'POST',
                'path': '/somePath',
                'body': 'someBody'
              }, 1)
                .then(function () {
                  // when - matching requests cleared
                  client.clear({
                    "path": "/somePath"
                  })
                    .then(function () {

                      // then - the verification should fail requests that were cleared
                      client.verify({
                        'method': 'POST',
                        'path': '/somePath',
                        'body': 'someBody'
                      }, 1)
                        .then(fail(test), function (message) {
                          test.ok(message.startsWith("Request not found at least once, expected:<{\n" +
                            "  \"method\" : \"POST\",\n" +
                            "  \"path\" : \"/somePath\",\n" +
                            "  \"body\" : \"someBody\"\n" +
                            "}> but was:<{\n"));
                          // then - the verification should pass for other requests
                          client.verify({
                            'method': 'POST',
                            'path': '/someOtherPath',
                            'body': 'someBody'
                          }, 1)
                            .then(function () {
                              test.done();
                            }, fail(test));
                        });
                    }, fail(test));
                }, fail(test));
            });
        });
    },

    'should clear proxy by expectation matcher': function (test) {
      // given - a client
      var client = proxyClient("localhost", proxyPort);
      // and - a request
      sendRequestViaProxy("http://localhost:" + mockServerPort + "/somePath", "someBody")
        .then(fail(test), function (error) {
          test.equal(error, "404 Not Found");

          // and - another request
          sendRequestViaProxy("http://localhost:" + mockServerPort + "/someOtherPath", "someBody")
            .then(fail(test), function (error) {
              test.equal(error, "404 Not Found");

              // and - a verification that passes
              client.verify({
                'method': 'POST',
                'path': '/somePath',
                'body': 'someBody'
              }, 1)
                .then(function () {
                  // when - matching requests cleared
                  client.clear({
                    "httpRequest": {
                      "path": "/somePath"
                    }
                  })
                    .then(function () {

                      // then - the verification should fail requests that were cleared
                      client.verify({
                        'method': 'POST',
                        'path': '/somePath',
                        'body': 'someBody'
                      }, 1)
                        .then(fail(test), function (message) {
                          test.ok(message.startsWith("Request not found at least once, expected:<{\n" +
                            "  \"method\" : \"POST\",\n" +
                            "  \"path\" : \"/somePath\",\n" +
                            "  \"body\" : \"someBody\"\n" +
                            "}> but was:<{\n"));
                          // then - the verification should pass for other requests
                          client.verify({
                            'method': 'POST',
                            'path': '/someOtherPath',
                            'body': 'someBody'
                          }, 1)
                            .then(function () {
                              test.done();
                            }, fail(test));
                        });
                    }, fail(test));
                }, fail(test));
            });
        });
    },

    'should reset proxy': function (test) {
      // given - a client
      var client = proxyClient("localhost", proxyPort);
      // and - a request
      sendRequestViaProxy("http://localhost:" + mockServerPort + "/somePath", "someBody")
        .then(fail(test), function (error) {
          test.equal(error, "404 Not Found");

          // and - another request
          sendRequestViaProxy("http://localhost:" + mockServerPort + "/somePath", "someBody")
            .then(fail(test), function (error) {
              test.equal(error, "404 Not Found");

              // and - a verification that passes
              client.verify({
                'method': 'POST',
                'path': '/somePath',
                'body': 'someBody'
              }, 1)
                .then(function () {
                  // when - all recorded requests reset
                  client.reset()
                    .then(function () {

                      // then - the verification should fail
                      client.verify({
                        'method': 'POST',
                        'path': '/somePath',
                        'body': 'someBody'
                      }, 1)
                        .then(fail(test), function (error) {
                          test.equals(error, "Request not found at least once, expected:<{\n" +
                            "  \"method\" : \"POST\",\n" +
                            "  \"path\" : \"/somePath\",\n" +
                            "  \"body\" : \"someBody\"\n" +
                            "}> but was:<>");
                          test.done();
                        });
                    }, fail(test));
                }, fail(test));
            });
        });
    },

    'should retrieve some recorded requests using object matcher': function (test) {
      // given
      var client = mockServerClient("localhost", mockServerPort);
      client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201)
        .then(function () {
          client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201)
            .then(function () {
              client.mockSimpleResponse('/somePathTwo', {name: 'two'}, 202)
                .then(function () {
                  sendRequestViaProxy("http://localhost:" + mockServerPort + "/somePathOne", "someBody")
                    .then(function (response) {
                      test.equal(response.statusCode, 201);

                      sendRequestViaProxy("http://localhost:" + mockServerPort + "/somePathOne", undefined, "GET")
                        .then(function (response) {
                          test.equal(response.statusCode, 201);

                          sendRequestViaProxy("http://localhost:" + mockServerPort + "/notFound", undefined, "GET")
                            .then(fail(test), function (error) {
                              test.equal(error, "404 Not Found");

                              sendRequestViaProxy("http://localhost:" + mockServerPort + "/somePathTwo", undefined, "GET")
                                .then(function (response) {
                                  test.equal(response.statusCode, 202);

                                  // when
                                  proxyClient("localhost", proxyPort)
                                    .retrieveRecordedRequests({
                                      "httpRequest": {
                                        "path": "/somePathOne"
                                      }
                                    })
                                    .then(function (requests) {

                                      // then
                                      test.equal(requests.length, 2);
                                      // first request
                                      test.equal(requests[0].path, '/somePathOne');
                                      test.equal(requests[0].method, 'POST');
                                      test.equal(requests[0].body, 'someBody');
                                      // second request
                                      test.equal(requests[1].path, '/somePathOne');
                                      test.equal(requests[1].method, 'GET');

                                      test.done();
                                    }, fail(test));
                                }, fail(test));
                            });
                        }, fail(test));
                    }, fail(test));
                }, fail(test));
            }, fail(test));
        }, fail(test));
    },

    'should retrieve some recorded requests using path': function (test) {
      // given
      var client = mockServerClient("localhost", mockServerPort);
      client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201)
        .then(function () {
          client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201)
            .then(function () {
              client.mockSimpleResponse('/somePathTwo', {name: 'two'}, 202)
                .then(function () {

                  sendRequestViaProxy("http://localhost:" + mockServerPort + "/somePathOne", "someBody")
                    .then(function (response) {
                      test.equal(response.statusCode, 201);

                      sendRequestViaProxy("http://localhost:" + mockServerPort + "/somePathOne", undefined, "GET")
                        .then(function (response) {
                          test.equal(response.statusCode, 201);

                          sendRequestViaProxy("http://localhost:" + mockServerPort + "/notFound", undefined, "GET")
                            .then(fail(test), function (error) {
                              test.equal(error, "404 Not Found");

                              sendRequestViaProxy("http://localhost:" + mockServerPort + "/somePathTwo", undefined, "GET")
                                .then(function (response) {
                                  test.equal(response.statusCode, 202);

                                  // when
                                  proxyClient("localhost", proxyPort)
                                    .retrieveRecordedRequests("/somePathOne")
                                    .then(function (requests) {

                                      // then
                                      test.equal(requests.length, 2);
                                      // first request
                                      test.equal(requests[0].path, '/somePathOne');
                                      test.equal(requests[0].method, 'POST');
                                      test.equal(requests[0].body, 'someBody');
                                      // second request
                                      test.equal(requests[1].path, '/somePathOne');
                                      test.equal(requests[1].method, 'GET');

                                      test.done();
                                    }, fail(test));
                                }, fail(test));
                            }, fail(test));
                        }, fail(test));
                    }, fail(test));

                }, fail(test));
            }, fail(test));
        }, fail(test));
    },

    'should retrieve some recorded expectations using object matcher': function (test) {
      // given
      var client = mockServerClient("localhost", mockServerPort);
      client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201)
        .then(function () {
          client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201)
            .then(function () {
              client.mockSimpleResponse('/somePathTwo', {name: 'two'}, 202)
                .then(function () {
                  sendRequestViaProxy("http://localhost:" + mockServerPort + "/somePathOne", "someBody")
                    .then(function (response) {
                      test.equal(response.statusCode, 201);

                      sendRequestViaProxy("http://localhost:" + mockServerPort + "/somePathOne", undefined, "GET")
                        .then(function (response) {
                          test.equal(response.statusCode, 201);

                          sendRequestViaProxy("http://localhost:" + mockServerPort + "/notFound", undefined, "GET")
                            .then(fail(test), function (error) {
                              test.equal(error, "404 Not Found");

                              sendRequestViaProxy("http://localhost:" + mockServerPort + "/somePathTwo", undefined, "GET")
                                .then(function (response) {
                                  test.equal(response.statusCode, 202);

                                  // when
                                  proxyClient("localhost", proxyPort)
                                    .retrieveRecordedExpectations({
                                      "httpRequest": {
                                        "path": "/somePathOne"
                                      }
                                    })
                                    .then(function (expectations) {

                                      // then
                                      test.equal(expectations.length, 2);
                                      // first expectation
                                      test.equal(expectations[0].httpRequest.path, '/somePathOne');
                                      test.equal(expectations[0].httpRequest.method, 'POST');
                                      test.equal(expectations[0].httpRequest.body, 'someBody');
                                      test.equal(expectations[0].httpResponse.body, '{"name":"one"}');
                                      test.equal(expectations[0].httpResponse.statusCode, 201);
                                      // second expectation
                                      test.equal(expectations[1].httpRequest.path, '/somePathOne');
                                      test.equal(expectations[1].httpRequest.method, 'GET');
                                      test.equal(expectations[0].httpResponse.body, '{"name":"one"}');
                                      test.equal(expectations[0].httpResponse.statusCode, 201);

                                      test.done();
                                    }, fail(test));
                                }, fail(test));
                            });
                        }, fail(test));
                    }, fail(test));
                }, fail(test));
            }, fail(test));
        }, fail(test));
    },

    'should retrieve some recorded expectations using path': function (test) {
      // given
      var client = mockServerClient("localhost", mockServerPort);
      client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201)
        .then(function () {
          client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201)
            .then(function () {
              client.mockSimpleResponse('/somePathTwo', {name: 'two'}, 202)
                .then(function () {

                  sendRequestViaProxy("http://localhost:" + mockServerPort + "/somePathOne", "someBody")
                    .then(function (response) {
                      test.equal(response.statusCode, 201);

                      sendRequestViaProxy("http://localhost:" + mockServerPort + "/somePathOne", undefined, "GET")
                        .then(function (response) {
                          test.equal(response.statusCode, 201);

                          sendRequestViaProxy("http://localhost:" + mockServerPort + "/notFound", undefined, "GET")
                            .then(fail(test), function (error) {
                              test.equal(error, "404 Not Found");

                              sendRequestViaProxy("http://localhost:" + mockServerPort + "/somePathTwo", undefined, "GET")
                                .then(function (response) {
                                  test.equal(response.statusCode, 202);

                                  // when
                                  proxyClient("localhost", proxyPort)
                                    .retrieveRecordedExpectations("/somePathOne")
                                    .then(function (expectations) {

                                      // then
                                      test.equal(expectations.length, 2);
                                      // first expectation
                                      test.equal(expectations[0].httpRequest.path, '/somePathOne');
                                      test.equal(expectations[0].httpRequest.method, 'POST');
                                      test.equal(expectations[0].httpRequest.body, 'someBody');
                                      test.equal(expectations[0].httpResponse.body, '{"name":"one"}');
                                      test.equal(expectations[0].httpResponse.statusCode, 201);
                                      // second expectation
                                      test.equal(expectations[1].httpRequest.path, '/somePathOne');
                                      test.equal(expectations[1].httpRequest.method, 'GET');
                                      test.equal(expectations[0].httpResponse.body, '{"name":"one"}');
                                      test.equal(expectations[0].httpResponse.statusCode, 201);

                                      test.done();
                                    }, fail(test));
                                }, fail(test));
                            }, fail(test));
                        }, fail(test));
                    }, fail(test));

                }, fail(test));
            }, fail(test));
        }, fail(test));
    },

    'should retrieve some logs using object matcher': function (test) {
      // given
      var client = mockServerClient("localhost", mockServerPort);
      client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201)
        .then(function () {

          sendRequestViaProxy("http://localhost:" + mockServerPort + "/somePathOne", "someBody")
            .then(function (response) {
              test.equal(response.statusCode, 201);


              sendRequestViaProxy("http://localhost:" + mockServerPort + "/notFound", undefined, "GET")
                .then(fail(test), function (error) {
                  test.equal(error, "404 Not Found");

                  // when
                  proxyClient("localhost", proxyPort)
                    .retrieveLogMessages({
                      "httpRequest": {
                        "path": "/somePathOne"
                      }
                    })
                    .then(function (expectations) {

                      // then
                      test.equal(expectations.length, 5);

                      test.ok(expectations[0].indexOf('resetting all expectations and request logs') !== -1);
                      test.ok(expectations[2].indexOf('returning response:\n' +
                        '\n' +
                        '\t{\n' +
                        '\t  "statusCode" : 201') !== -1);
                      test.ok(expectations[4].indexOf('retrieving logs that match:\n' +
                        '\n' +
                        '\t{\n' +
                        '\t  "path" : "/somePathOne"\n' +
                        '\t}\n' +
                        '\n') !== -1);

                      test.done();
                    }, fail(test));
                }, fail(test));
            }, fail(test));
        }, fail(test));
    },

    'should retrieve some logs using using path': function (test) {
      // given
      var client = mockServerClient("localhost", mockServerPort);
      client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201)
        .then(function () {

          sendRequestViaProxy("http://localhost:" + mockServerPort + "/somePathOne", "someBody")
            .then(function (response) {
              test.equal(response.statusCode, 201);


              sendRequestViaProxy("http://localhost:" + mockServerPort + "/notFound", undefined, "GET")
                .then(fail(test), function (error) {
                  test.equal(error, "404 Not Found");

                  // when
                  proxyClient("localhost", proxyPort)
                    .retrieveLogMessages("/somePathOne")
                    .then(function (expectations) {

                      // then
                        test.equal(expectations.length, 5);

                        test.ok(expectations[0].indexOf('resetting all expectations and request logs') !== -1);
                        test.ok(expectations[2].indexOf('returning response:\n' +
                            '\n' +
                            '\t{\n' +
                            '\t  "statusCode" : 201') !== -1);
                        test.ok(expectations[4].indexOf('retrieving logs that match:\n' +
                            '\n' +
                            '\t{\n' +
                            '\t  "path" : "/somePathOne"\n' +
                            '\t}\n' +
                            '\n') !== -1);

                      test.done();
                    }, fail(test));
                }, fail(test));
            }, fail(test));
        }, fail(test));
    }
  };

})();