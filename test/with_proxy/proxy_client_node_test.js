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
          test.equal(error.statusCode, 404);

          // and - another request
          sendRequestViaProxy("http://localhost:" + mockServerPort + "/somePath", "someBody")
            .then(fail(test), function (error) {
              test.equal(error.statusCode, 404);

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
          test.equal(error.statusCode, 404);

          // and - another request
          sendRequestViaProxy("http://localhost:" + mockServerPort + "/someOtherPath", "someBody")
            .then(fail(test), function (error) {
              test.equal(error.statusCode, 404);

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
          test.equal(error.statusCode, 404);

          // when - a verification that should fail
          client.verify(
            {
              'path': '/someOtherPath'
            }, 1)
            .then(fail(test), function (error) {
              test.equals(error, "Request not found at least once, expected:<{\n" +
                "  \"path\" : \"/someOtherPath\"\n" +
                "}> but was:<{\n" +
                "  \"method\" : \"POST\",\n" +
                "  \"path\" : \"/somePath\",\n" +
                "  \"body\" : \"someBody\",\n" +
                "  \"headers\" : {\n" +
                "    \"content-length\" : [ \"8\" ],\n" +
                "    \"Connection\" : [ \"keep-alive\" ],\n" +
                "    \"Host\" : [ \"localhost:1080\" ]\n" +
                "  },\n" +
                "  \"keepAlive\" : true,\n" +
                "  \"secure\" : false\n" +
                "}>");

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
          test.equal(error.statusCode, 404);

          // when - a verification that should fail
          client.verify(
            {
              'method': 'POST',
              'path': '/somePath',
              'body': 'someBody'
            }, 2, true)
            .then(fail(test), function (error) {
              test.equals(error, "Request not found exactly 2 times, expected:<{\n" +
                "  \"method\" : \"POST\",\n" +
                "  \"path\" : \"/somePath\",\n" +
                "  \"body\" : \"someBody\"\n" +
                "}> but was:<{\n" +
                "  \"method\" : \"POST\",\n" +
                "  \"path\" : \"/somePath\",\n" +
                "  \"body\" : \"someBody\",\n" +
                "  \"headers\" : {\n" +
                "    \"content-length\" : [ \"8\" ],\n" +
                "    \"Connection\" : [ \"keep-alive\" ],\n" +
                "    \"Host\" : [ \"localhost:1080\" ]\n" +
                "  },\n" +
                "  \"keepAlive\" : true,\n" +
                "  \"secure\" : false\n" +
                "}>");
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
          test.equal(error.statusCode, 404);

          // when - a verification that should fail
          client.verify(
            {
              'method': 'POST',
              'path': '/somePath',
              'body': 'someBody'
            }, 2)
            .then(fail(test), function (error) {
              test.equals(error, "Request not found at least 2 times, expected:<{\n" +
                "  \"method\" : \"POST\",\n" +
                "  \"path\" : \"/somePath\",\n" +
                "  \"body\" : \"someBody\"\n" +
                "}> but was:<{\n" +
                "  \"method\" : \"POST\",\n" +
                "  \"path\" : \"/somePath\",\n" +
                "  \"body\" : \"someBody\",\n" +
                "  \"headers\" : {\n" +
                "    \"content-length\" : [ \"8\" ],\n" +
                "    \"Connection\" : [ \"keep-alive\" ],\n" +
                "    \"Host\" : [ \"localhost:1080\" ]\n" +
                "  },\n" +
                "  \"keepAlive\" : true,\n" +
                "  \"secure\" : false\n" +
                "}>");
              test.done();
            });
        });
    },

    'should pass when correct sequence of requests have been sent': function (test) {
      // given
      var client = proxyClient("localhost", mockServerPort);
      sendRequestViaProxy("http://localhost:" + mockServerPort + "/one", "someBody")
        .then(fail(test), function (error) {
          test.equal(error.statusCode, 404);
          sendRequestViaProxy("http://localhost:" + mockServerPort + "/two", undefined, "GET")
            .then(fail(test), function (error) {
              test.equal(error.statusCode, 404);
              sendRequestViaProxy("http://localhost:" + mockServerPort + "/three", undefined, "GET")
                .then(fail(test), function (error) {
                  test.equal(error.statusCode, 404);

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
          test.equal(error.statusCode, 404);

          sendRequestViaProxy("http://localhost:" + mockServerPort + "/two", undefined, "GET")
            .then(fail(test), function (error) {
              test.equal(error.statusCode, 404);

              sendRequestViaProxy("http://localhost:" + mockServerPort + "/three", undefined, "GET")
                .then(fail(test), function (error) {
                  test.equal(error.statusCode, 404);

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
          test.equal(error.statusCode, 404);

          // and - another request
          sendRequestViaProxy("http://localhost:" + mockServerPort + "/someOtherPath", "someBody")
            .then(fail(test), function (error) {
              test.equal(error.statusCode, 404);

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
                        .then(fail(test), function (error) {
                          test.equals(error, "Request not found at least once, expected:<{\n" +
                            "  \"method\" : \"POST\",\n" +
                            "  \"path\" : \"/somePath\",\n" +
                            "  \"body\" : \"someBody\"\n" +
                            "}> but was:<{\n" +
                            "  \"method\" : \"POST\",\n" +
                            "  \"path\" : \"/someOtherPath\",\n" +
                            "  \"body\" : \"someBody\",\n" +
                            "  \"headers\" : {\n" +
                            "    \"content-length\" : [ \"8\" ],\n" +
                            "    \"Connection\" : [ \"keep-alive\" ],\n" +
                            "    \"Host\" : [ \"localhost:1080\" ]\n" +
                            "  },\n" +
                            "  \"keepAlive\" : true,\n" +
                            "  \"secure\" : false\n" +
                            "}>");

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
          test.equal(error.statusCode, 404);

          // and - another request
          sendRequestViaProxy("http://localhost:" + mockServerPort + "/someOtherPath", "someBody")
            .then(fail(test), function (error) {
              test.equal(error.statusCode, 404);

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
                        .then(fail(test), function (error) {
                          test.equals(error, "Request not found at least once, expected:<{\n" +
                            "  \"method\" : \"POST\",\n" +
                            "  \"path\" : \"/somePath\",\n" +
                            "  \"body\" : \"someBody\"\n" +
                            "}> but was:<{\n" +
                            "  \"method\" : \"POST\",\n" +
                            "  \"path\" : \"/someOtherPath\",\n" +
                            "  \"body\" : \"someBody\",\n" +
                            "  \"headers\" : {\n" +
                            "    \"content-length\" : [ \"8\" ],\n" +
                            "    \"Connection\" : [ \"keep-alive\" ],\n" +
                            "    \"Host\" : [ \"localhost:1080\" ]\n" +
                            "  },\n" +
                            "  \"keepAlive\" : true,\n" +
                            "  \"secure\" : false\n" +
                            "}>");

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
          test.equal(error.statusCode, 404);

          // and - another request
          sendRequestViaProxy("http://localhost:" + mockServerPort + "/someOtherPath", "someBody")
            .then(fail(test), function (error) {
              test.equal(error.statusCode, 404);

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
                        .then(fail(test), function (error) {
                          test.equals(error, "Request not found at least once, expected:<{\n" +
                            "  \"method\" : \"POST\",\n" +
                            "  \"path\" : \"/somePath\",\n" +
                            "  \"body\" : \"someBody\"\n" +
                            "}> but was:<{\n" +
                            "  \"method\" : \"POST\",\n" +
                            "  \"path\" : \"/someOtherPath\",\n" +
                            "  \"body\" : \"someBody\",\n" +
                            "  \"headers\" : {\n" +
                            "    \"content-length\" : [ \"8\" ],\n" +
                            "    \"Connection\" : [ \"keep-alive\" ],\n" +
                            "    \"Host\" : [ \"localhost:1080\" ]\n" +
                            "  },\n" +
                            "  \"keepAlive\" : true,\n" +
                            "  \"secure\" : false\n" +
                            "}>");

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
          test.equal(error.statusCode, 404);

          // and - another request
          sendRequestViaProxy("http://localhost:" + mockServerPort + "/somePath", "someBody")
            .then(fail(test), function (error) {
              test.equal(error.statusCode, 404);

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

    'should retrieve some requests using object matcher': function (test) {
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
                              test.equal(error.statusCode, 404);

                              sendRequestViaProxy("http://localhost:" + mockServerPort + "/somePathTwo", undefined, "GET")
                                .then(function (response) {
                                  test.equal(response.statusCode, 202);

                                  // when
                                  client.retrieveRequests({
                                    "httpRequest": {
                                      "path": "/somePathOne"
                                    }
                                  }).then(function (requests) {

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

    'should retrieve some requests using path': function (test) {
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
                              test.equal(error.statusCode, 404);

                              sendRequestViaProxy("http://localhost:" + mockServerPort + "/somePathTwo", undefined, "GET")
                                .then(function (response) {
                                  test.equal(response.statusCode, 202);

                                  // when
                                  proxyClient("localhost", proxyPort).retrieveRequests("/somePathOne")
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
    }
  };

})();