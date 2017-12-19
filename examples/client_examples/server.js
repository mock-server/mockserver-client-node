function createExpectation() {
    var mockServerClient = require('mockserver-client').mockServerClient;
    mockServerClient("localhost", 1080)
        .mockAnyResponse({
            "httpRequest": {
                "method": "GET",
                "path": "/view/cart",
                "queryStringParameters": {
                    "cartId": ["055CA455-1DF7-45BB-8535-4F83E7266092"]
                },
                "cookies": {
                    "session": "4930456C-C718-476F-971F-CB8E047AB349"
                }
            },
            "httpResponse": {
                "body": "some_response_body"
            }
        })
        .then(
            function () {
                console.log("expectation created");
            },
            function (error) {
                console.log(error);
            }
        );
}

function verifyRequests() {
    var mockServerClient = require('mockserver-client').mockServerClient;
    mockServerClient("localhost", 1080)
        .verify(
            {
                'path': '/some/path'
            }, 2, true)
        .then(
            function () {
                console.log("request found exactly 2 times");
            },
            function (error) {
                console.log(error);
            }
        );
}

function verifyRequestSequence() {
    var mockServerClient = require('mockserver-client').mockServerClient;
    mockServerClient("localhost", 1080)
        .verifySequence(
            {
                'path': '/some/path/one'
            },
            {
                'path': '/some/path/two'
            },
            {
                'path': '/some/path/three'
            }
        )
        .then(
            function () {
                console.log("request sequence found in the order specified");
            },
            function (error) {
                console.log(error);
            }
        );
}

function retrieveRecordedRequests() {
    var mockServerClient = require('mockserver-client').mockServerClient;
    mockServerClient("localhost", 1080)
        .retrieveRecordedRequests({
            "path": "/some/path",
            "method": "POST"
        })
        .then(
            function (recordedRequests) {
                console.log(JSON.stringify(recordedRequests));
            },
            function (error) {
                console.log(error);
            }
        );
}

function retrieveRecordedLogMessages() {
    var mockServerClient = require('mockserver-client').mockServerClient;
    mockServerClient("localhost", 1080)
        .retrieveLogMessages({
            "path": "/some/path",
            "method": "POST"
        })
        .then(
            function (logMessages) {
                // logMessages is a String[]
                console.log(logMessages);
            },
            function (error) {
                console.log(error);
            }
        );
}

function clear() {
    var mockServerClient = require('mockserver-client').mockServerClient;
    mockServerClient("localhost", 1080)
        .clear({
            'path': '/some/path'
        })
        .then(
            function () {
                console.log("cleared state that matches request matcher");
            },
            function (error) {
                console.log(error);
            }
        );
}

function clearLog() {
    var mockServerClient = require('mockserver-client').mockServerClient;
    mockServerClient("localhost", 1080)
        .clear({
            'path': '/some/path'
        }, 'LOG')
        .then(
            function () {
                console.log("cleared state that matches request matcher");
            },
            function (error) {
                console.log(error);
            }
        );
}

function reset() {
    var mockServerClient = require('mockserver-client').mockServerClient;
    mockServerClient("localhost", 1080)
        .reset()
        .then(
            function () {
                console.log("reset all state");
            },
            function (error) {
                console.log(error);
            }
        );
}