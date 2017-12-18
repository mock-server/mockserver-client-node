if ((typeof __karma__ !== 'undefined' ? __karma__.config.mode === 'with_proxy' : window.location.href.indexOf('proxy=true') !== -1)) {

    describe("proxyClient client:", function () {
        var mockServerPort = 1080;
        var proxyPort = 1090;

        function HttpRequest() {
            var xmlhttp = new XMLHttpRequest();
            if (navigator.userAgent.indexOf('PhantomJS') !== -1) {
                var _this = {
                    open: function (method, url) {
                        xmlhttp.open(method, url, false);
                    },
                    setRequestHeader: function (name, value) {
                        xmlhttp.setRequestHeader(name, value);
                    },
                    send: function (data) {
                        xmlhttp.send(data);
                        _this.onload.call(xmlhttp);
                    }
                };
                return _this;
            }
            return xmlhttp;
        }

        var fail = function (error) {
            throw error;
        };

        var originalTimeout;

        beforeEach(function (done) {
            originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
            jasmine.DEFAULT_TIMEOUT_INTERVAL = 250 * 1000;
            mockServerClient("localhost", mockServerPort).reset()
                .then(function () {
                    proxyClient("localhost", proxyPort).reset()
                        .then(function () {
                            done();
                        }, fail);
                }, fail);
        });

        afterEach(function (done) {
            jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
            done();
        });

        it("should verify exact number of requests have been sent", function (done) {
            // given
            var proxy_client = proxyClient("localhost", proxyPort);
            var mock_server_client = mockServerClient("localhost", mockServerPort);
            mock_server_client.mockSimpleResponse('/somePath', {name: 'value'}, 203)
                .then(function () {
                    mock_server_client.mockSimpleResponse('/somePath', {name: 'value'}, 203)
                        .then(function () {
                            var xmlhttp = HttpRequest();
                            xmlhttp.onload = function () {
                                expect(this.status).toEqual(203);
                                var xmlhttp = HttpRequest();
                                xmlhttp.onload = function () {
                                    expect(this.status).toEqual(203);

                                    // when
                                    proxy_client.verify({
                                        'method': 'POST',
                                        'path': '/somePath',
                                        'body': 'someBody'
                                    }, 2, true)
                                        .then(function () {
                                            done();
                                        }, fail);
                                };
                                xmlhttp.open("POST", "http://localhost:" + mockServerPort + "/somePath");
                                xmlhttp.send("someBody");
                            };
                            xmlhttp.open("POST", "http://localhost:" + mockServerPort + "/somePath");
                            xmlhttp.send("someBody");
                        }, fail);
                }, fail);
        });

        it("should verify at least a number of requests have been sent", function (done) {
            // given
            var client = proxyClient("localhost", proxyPort);
            var xmlhttp = HttpRequest();
            xmlhttp.onload = function () {
                expect(this.status).toEqual(404);
                var xmlhttp = HttpRequest();
                xmlhttp.onload = function () {
                    expect(this.status).toEqual(404);

                    // when
                    client.verify({
                        'method': 'POST',
                        'path': '/somePath',
                        'body': 'someBody'
                    }, 1)
                        .then(function () {
                            done();
                        }, fail);
                };
                xmlhttp.open("POST", "http://localhost:" + mockServerPort + "/somePath");
                xmlhttp.send("someBody");
            };
            xmlhttp.open("POST", "http://localhost:" + mockServerPort + "/somePath");
            xmlhttp.send("someBody");
        });

        it("should fail when no requests have been sent", function (done) {
            // given
            var client = proxyClient("localhost", proxyPort);
            var xmlhttp = HttpRequest();
            xmlhttp.onload = function () {
                expect(this.status).toEqual(404);

                // when
                client.verify({
                    'path': '/someOtherPath'
                }, 1)
                    .then(fail, function (error) {
                        expect(error).toContain("Request not found at least once, expected:<{\n" +
                            "  \"path\" : \"/someOtherPath\"\n" +
                            "}> but was:<{\n");
                        done();
                    });
            };
            xmlhttp.open("POST", "http://localhost:" + mockServerPort + "/somePath");
            xmlhttp.send("someBody");
        });

        it("should fail when not enough exact requests have been sent", function (done) {
            // given
            var client = proxyClient("localhost", proxyPort);
            var xmlhttp = HttpRequest();
            xmlhttp.onload = function () {
                expect(this.status).toEqual(404);

                // when
                client.verify({
                    'method': 'POST',
                    'path': '/somePath',
                    'body': 'someBody'
                }, 2, true)
                    .then(fail, function (error) {
                        expect(error).toContain("Request not found exactly 2 times, expected:<{\n" +
                            "  \"method\" : \"POST\",\n" +
                            "  \"path\" : \"/somePath\",\n" +
                            "  \"body\" : \"someBody\"\n" +
                            "}> but was:<{\n");
                        done();
                    });
            };
            xmlhttp.open("POST", "http://localhost:" + mockServerPort + "/somePath");
            xmlhttp.send("someBody");
        });

        it("should fail when not enough at least requests have been sent", function (done) {
            // given
            var client = proxyClient("localhost", proxyPort);
            var xmlhttp = HttpRequest();
            xmlhttp.onload = function () {
                expect(this.status).toEqual(404);

                // when
                client.verify({
                    'method': 'POST',
                    'path': '/somePath',
                    'body': 'someBody'
                }, 2)
                    .then(fail, function (error) {
                        expect(error).toContain("Request not found at least 2 times, expected:<{\n" +
                            "  \"method\" : \"POST\",\n" +
                            "  \"path\" : \"/somePath\",\n" +
                            "  \"body\" : \"someBody\"\n" +
                            "}> but was:<{\n");
                        done();
                    });
            };
            xmlhttp.open("POST", "http://localhost:" + mockServerPort + "/somePath");
            xmlhttp.send("someBody");
        });

        it("should pass when correct sequence of requests have been sent", function (done) {
            // given
            var client = proxyClient("localhost", mockServerPort);
            var xmlhttp = HttpRequest();
            xmlhttp.onload = function () {
                expect(this.status).toEqual(404);
                var xmlhttp = HttpRequest();
                xmlhttp.onload = function () {
                    expect(this.status).toEqual(404);
                    var xmlhttp = HttpRequest();
                    xmlhttp.onload = function () {
                        expect(this.status).toEqual(404);

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
                        )
                            .then(function () {
                                done();
                            }, fail);
                    };
                    xmlhttp.open("GET", "http://localhost:" + mockServerPort + "/three");
                    xmlhttp.send();
                };
                xmlhttp.open("GET", "http://localhost:" + mockServerPort + "/two");
                xmlhttp.send();
            };
            xmlhttp.open("POST", "http://localhost:" + mockServerPort + "/one");
            xmlhttp.send("someBody");
        });

        it("should fail when incorrect sequence of requests have been sent", function (done) {
            // given
            var client = proxyClient("localhost", mockServerPort);
            var xmlhttp = HttpRequest();
            xmlhttp.onload = function () {
                expect(this.status).toEqual(404);
                var xmlhttp = HttpRequest();
                xmlhttp.onload = function () {
                    expect(this.status).toEqual(404);
                    var xmlhttp = HttpRequest();
                    xmlhttp.onload = function () {
                        expect(this.status).toEqual(404);

                        // when - wrong order
                        client.verifySequence(
                            {
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
                            }
                        )
                            .then(fail, function () {

                                // when - first request incorrect body
                                client.verifySequence(
                                    {
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
                                    }
                                )
                                    .then(fail, function () {
                                        done();
                                    });

                                done();
                            });
                    };
                    xmlhttp.open("GET", "http://localhost:" + mockServerPort + "/three");
                    xmlhttp.send();
                };
                xmlhttp.open("GET", "http://localhost:" + mockServerPort + "/two");
                xmlhttp.send();
            };
            xmlhttp.open("POST", "http://localhost:" + mockServerPort + "/one");
            xmlhttp.send("someBody");
        });

        it("should clear proxy by path", function (done) {
            // given
            var client = proxyClient("localhost", proxyPort);
            var xmlhttp = HttpRequest();
            xmlhttp.onload = function () {
                expect(this.status).toEqual(404);
                var xmlhttp = HttpRequest();
                xmlhttp.onload = function () {
                    expect(this.status).toEqual(404);

                    // then
                    client.verify(
                        {
                            'method': 'POST',
                            'path': '/somePath',
                            'body': 'someBody'
                        }, 1)
                        .then(function () {

                            // when
                            client.clear('/somePath')
                                .then(function () {

                                    // then
                                    client.verify({
                                        'method': 'POST',
                                        'path': '/somePath',
                                        'body': 'someBody'
                                    }, 1)
                                        .then(fail, function () {
                                            done();
                                        });
                                }, fail);
                        }, fail);
                };
                xmlhttp.open("POST", "http://localhost:" + mockServerPort + "/somePath");
                xmlhttp.send("someBody");
            };
            xmlhttp.open("POST", "http://localhost:" + mockServerPort + "/somePath");
            xmlhttp.send("someBody");
        });

        it("should clear expectations by request matcher", function (done) {
            // given
            var client = proxyClient("localhost", proxyPort);
            var xmlhttp = HttpRequest();
            xmlhttp.onload = function () {
                expect(this.status).toEqual(404);
                var xmlhttp = HttpRequest();
                xmlhttp.onload = function () {
                    expect(this.status).toEqual(404);

                    // then
                    client.verify(
                        {
                            'method': 'POST',
                            'path': '/somePath',
                            'body': 'someBody'
                        }, 1)
                        .then(function () {
                            // when
                            client.clear({
                                "path": "/somePath"
                            })
                                .then(function () {

                                    // then
                                    client.verify({
                                        'method': 'POST',
                                        'path': '/somePath',
                                        'body': 'someBody'
                                    }, 1)
                                        .then(fail, function () {
                                            done();
                                        });
                                }, fail);
                        }, fail);
                };
                xmlhttp.open("POST", "http://localhost:" + mockServerPort + "/somePath");
                xmlhttp.send("someBody");
            };
            xmlhttp.open("POST", "http://localhost:" + mockServerPort + "/somePath");
            xmlhttp.send("someBody");
        });

        it("should clear expectations by expectation matcher", function (done) {
            // given
            var client = proxyClient("localhost", proxyPort);
            var xmlhttp = HttpRequest();
            xmlhttp.onload = function () {
                expect(this.status).toEqual(404);
                var xmlhttp = HttpRequest();
                xmlhttp.onload = function () {
                    expect(this.status).toEqual(404);

                    // then
                    client.verify(
                        {
                            'method': 'POST',
                            'path': '/somePath',
                            'body': 'someBody'
                        }, 1)
                        .then(function () {

                            // when
                            client.clear({
                                "httpRequest": {
                                    "path": "/somePath"
                                }
                            })
                                .then(function () {

                                    // then
                                    client.verify({
                                        'method': 'POST',
                                        'path': '/somePath',
                                        'body': 'someBody'
                                    }, 1)
                                        .then(fail, function () {
                                            done();
                                        });
                                }, fail);
                        }, fail);
                };
                xmlhttp.open("POST", "http://localhost:" + mockServerPort + "/somePath");
                xmlhttp.send("someBody");
            };
            xmlhttp.open("POST", "http://localhost:" + mockServerPort + "/somePath");
            xmlhttp.send("someBody");
        });

        it("should reset proxy", function (done) {
            // given
            var client = proxyClient("localhost", proxyPort);
            var xmlhttp = HttpRequest();
            xmlhttp.onload = function () {
                expect(this.status).toEqual(404);
                var xmlhttp = HttpRequest();
                xmlhttp.onload = function () {
                    expect(this.status).toEqual(404);

                    // then
                    client.verify(
                        {
                            'method': 'POST',
                            'path': '/somePath',
                            'body': 'someBody'
                        }, 1)
                        .then(function () {

                            // when
                            client.reset()
                                .then(function () {

                                    // then
                                    client.verify({
                                        'method': 'POST',
                                        'path': '/somePath',
                                        'body': 'someBody'
                                    }, 1)
                                        .then(fail, function () {
                                            done();
                                        });
                                }, fail);
                        }, fail);
                };
                xmlhttp.open("POST", "http://localhost:" + mockServerPort + "/somePath");
                xmlhttp.send("someBody");
            };
            xmlhttp.open("POST", "http://localhost:" + mockServerPort + "/somePath");
            xmlhttp.send("someBody");
        });

        it("should retrieve some recorded recorded requests using object matcher", function (done) {
            // given
            var client = mockServerClient("localhost", mockServerPort);
            client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201)
                .then(function () {
                    client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201)
                        .then(function () {
                            client.mockSimpleResponse('/somePathTwo', {name: 'two'}, 202)
                                .then(function () {
                                    var xmlhttp = HttpRequest();
                                    xmlhttp.onload = function () {
                                        expect(this.status).toEqual(201);

                                        var xmlhttp = HttpRequest();
                                        xmlhttp.onload = function () {
                                            expect(this.status).toEqual(201);

                                            var xmlhttp = HttpRequest();
                                            xmlhttp.onload = function () {
                                                expect(this.status).toEqual(404);

                                                var xmlhttp = HttpRequest();
                                                xmlhttp.onload = function () {
                                                    expect(this.status).toEqual(202);

                                                    // when
                                                    var requests = client.retrieveRecordedRequests({
                                                        "httpRequest": {
                                                            "path": "/somePathOne"
                                                        }
                                                    })
                                                        .then(function (requests) {

                                                            // then
                                                            expect(requests.length).toEqual(2);
                                                            // first request
                                                            expect(requests[0].path).toEqual('/somePathOne');
                                                            expect(requests[0].method).toEqual('POST');
                                                            expect(requests[0].body).toEqual({
                                                                contentType: "text/plain; charset=utf-8",
                                                                string: "someBody",
                                                                type: "STRING"
                                                            });
                                                            // second request
                                                            expect(requests[1].path).toEqual('/somePathOne');
                                                            expect(requests[1].method).toEqual('GET');

                                                            done();
                                                        }, fail);
                                                };
                                                xmlhttp.open("GET", "http://localhost:" + mockServerPort + "/somePathTwo");
                                                xmlhttp.send();
                                            };
                                            xmlhttp.open("GET", "http://localhost:" + mockServerPort + "/notFound");
                                            xmlhttp.send();
                                        };
                                        xmlhttp.open("GET", "http://localhost:" + mockServerPort + "/somePathOne");
                                        xmlhttp.send();
                                    };
                                    xmlhttp.open("POST", "http://localhost:" + mockServerPort + "/somePathOne");
                                    xmlhttp.send("someBody");
                                }, fail);
                        }, fail);
                }, fail);
        });

        it("should retrieve some recorded requests using path", function (done) {
            // given
            var client = mockServerClient("localhost", mockServerPort);
            client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201)
                .then(function () {
                    client.mockSimpleResponse('/somePathOne', {name: 'one'}, 201)
                        .then(function () {
                            client.mockSimpleResponse('/somePathTwo', {name: 'two'}, 202)
                                .then(function () {
                                    var xmlhttp = HttpRequest();
                                    xmlhttp.onload = function () {
                                        expect(this.status).toEqual(201);

                                        var xmlhttp = HttpRequest();
                                        xmlhttp.onload = function () {
                                            expect(this.status).toEqual(201);

                                            var xmlhttp = HttpRequest();
                                            xmlhttp.onload = function () {
                                                expect(this.status).toEqual(404);

                                                var xmlhttp = HttpRequest();
                                                xmlhttp.onload = function () {
                                                    expect(this.status).toEqual(202);

                                                    // when
                                                    var requests = proxyClient("localhost", proxyPort).retrieveRecordedRequests("/somePathOne")
                                                        .then(function (requests) {

                                                            // then
                                                            expect(requests.length).toEqual(2);
                                                            // first request
                                                            expect(requests[0].path).toEqual('/somePathOne');
                                                            expect(requests[0].method).toEqual('POST');
                                                            expect(requests[0].body).toEqual({
                                                                contentType: "text/plain; charset=utf-8",
                                                                string: "someBody",
                                                                type: "STRING"
                                                            });
                                                            // second request
                                                            expect(requests[1].path).toEqual('/somePathOne');
                                                            expect(requests[1].method).toEqual('GET');

                                                            done();
                                                        }, fail);
                                                };
                                                xmlhttp.open("GET", "http://localhost:" + mockServerPort + "/somePathTwo");
                                                xmlhttp.send();
                                            };
                                            xmlhttp.open("GET", "http://localhost:" + mockServerPort + "/notFound");
                                            xmlhttp.send();
                                        };
                                        xmlhttp.open("GET", "http://localhost:" + mockServerPort + "/somePathOne");
                                        xmlhttp.send();
                                    };
                                    xmlhttp.open("POST", "http://localhost:" + mockServerPort + "/somePathOne");
                                    xmlhttp.send("someBody");
                                }, fail);
                        }, fail);
                }, fail);
        });

    });

}