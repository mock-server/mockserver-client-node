function matchRequestByOpenAPILoadedByHttpUrl() {
    var mockServerClient = require('mockserver-client').mockServerClient;
    mockServerClient("localhost", 1080).mockAnyResponse({
        "httpRequest": {
            "specUrlOrPayload": "https://raw.githubusercontent.com/mock-server/mockserver/master/mockserver-integration-testing/src/main/resources/org/mockserver/mock/openapi_petstore_example.json"
        },
        "httpResponse": {
            "body": "some_response_body"
        }
    }).then(
        function () {
            console.log("expectation created");
        },
        function (error) {
            console.log(error);
        }
    );
}

function matchRequestByOpenAPIOperation() {
    var mockServerClient = require('mockserver-client').mockServerClient;
    mockServerClient("localhost", 1080).mockAnyResponse({
        "httpRequest": {
            "specUrlOrPayload": "https://raw.githubusercontent.com/mock-server/mockserver/master/mockserver-integration-testing/src/main/resources/org/mockserver/mock/openapi_petstore_example.json",
            "operationId": "showPetById"
        },
        "httpResponse": {
            "body": "some_response_body"
        }
    }).then(
        function () {
            console.log("expectation created");
        },
        function (error) {
            console.log(error);
        }
    );
}

function matchRequestByOpenAPILoadedByFileUrl() {
    var mockServerClient = require('mockserver-client').mockServerClient;
    mockServerClient("localhost", 1080).mockAnyResponse({
        "httpRequest": {
            "specUrlOrPayload": "file:/Users/jamesbloom/git/mockserver/mockserver/mockserver-core/target/test-classes/org/mockserver/mock/openapi_petstore_example.json"
        },
        "httpResponse": {
            "body": "some_response_body"
        }
    }).then(
        function () {
            console.log("expectation created");
        },
        function (error) {
            console.log(error);
        }
    );
}

function matchRequestByOpenAPILoadedByClasspathLocation() {
    var mockServerClient = require('mockserver-client').mockServerClient;
    mockServerClient("localhost", 1080).mockAnyResponse({
        "httpRequest": {
            "specUrlOrPayload": "org/mockserver/mock/openapi_petstore_example.json"
        },
        "httpResponse": {
            "body": "some_response_body"
        }
    }).then(
        function () {
            console.log("expectation created");
        },
        function (error) {
            console.log(error);
        }
    );
}

function matchRequestByOpenAPILoadedByStringLiteral() {
    var fs = require('fs');
    var jsEscape = require('js-string-escape');
    try {
        var mockServerClient = require('mockserver-client').mockServerClient;
        mockServerClient("localhost", 1080).mockAnyResponse({
            "httpRequest": {
                "specUrlOrPayload": jsEscape.jsStringEscape(fs.readFileSync("/Users/jamesbloom/git/mockserver/mockserver/mockserver-core/target/test-classes/org/mockserver/mock/openapi_petstore_example.json", "utf8")),
                "operationId": "showPetById"
            },
            "httpResponse": {
                "body": "some_response_body"
            }
        }).then(
            function () {
                console.log("expectation created");
            },
            function (error) {
                console.log(error);
            }
        );
    } catch (e) {
        console.log('Error:', e.stack);
    }
}

function matchRequestByOpenAPIOperationTwice() {
    var mockServerClient = require('mockserver-client').mockServerClient;
    mockServerClient("localhost", 1080).mockAnyResponse({
        "httpRequest": {
            "specUrlOrPayload": "https://raw.githubusercontent.com/mock-server/mockserver/master/mockserver-integration-testing/src/main/resources/org/mockserver/mock/openapi_petstore_example.json",
            "operationId": "showPetById"
        },
        "httpResponse": {
            "statusCode": 200,
            "body": "some_body"
        },
        "times": {
            "unlimited": true
        }
    }).then(
        function () {
            console.log("expectation created");
        },
        function (error) {
            console.log(error);
        }
    );
}

function updateExpectationById() {
    var mockServerClient = require('mockserver-client').mockServerClient;
    mockServerClient("localhost", 1080).mockAnyResponse({
        "id": "630a6e5b-9d61-4668-a18f-a0d3df558583",
        "priority": 0,
        "httpRequest": {
            "specUrlOrPayload": "https://raw.githubusercontent.com/mock-server/mockserver/master/mockserver-integration-testing/src/main/resources/org/mockserver/mock/openapi_petstore_example.json",
            "operationId": "showPetById"
        },
        "httpResponse": {
            "statusCode": 200,
            "body": "some_response_body"
        },
        "times": {
            "unlimited": true
        },
        "timeToLive": {
            "unlimited": true
        }
    }).then(
        function () {
            console.log("expectation created");
        },
        function (error) {
            console.log(error);
        }
    );
}
