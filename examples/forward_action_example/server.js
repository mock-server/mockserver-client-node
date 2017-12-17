function forwardRequestInHTTP() {
    var mockServerClient = require('mockserver-client').mockServerClient;
    mockServerClient("localhost", 1080).mockAnyResponse({
        "httpRequest": {
            "path": "/some/path"
        },
        "httpForward": {
            "host": "mock-server.com",
            "port": 80,
            "scheme": "HTTP"
        }
    });
}

function forwardRequestInHTTPS() {
    var mockServerClient = require('mockserver-client').mockServerClient;
    mockServerClient("localhost", 1080).mockAnyResponse({
        "httpRequest": {
            "path": "/some/path"
        },
        "httpForward": {
            "host": "mock-server.com",
            "port": 443,
            "scheme": "HTTPS"
        }
    });
}

function javascriptTemplatedForward() {
    var mockServerClient = require('mockserver-client').mockServerClient;
    mockServerClient("localhost", 1080).mockAnyResponse({
        "httpRequest": {
            "path": "/some/path"
        },
        "httpForwardTemplate": {
            "template": "return {\n" +
            "    'path' : \"/somePath\",\n" +
            "    'queryStringParameters' : {\n" +
            "        'userId' : request.queryStringParameters && request.queryStringParameters['userId']\n" +
            "    },\n" +
            "    'headers' : {\n" +
            "        'Host' : [ \"localhost:1081\" ]\n" +
            "    },\n" +
            "    'body': JSON.stringify({'name': 'value'})\n" +
            "};",
            "templateType": "JAVASCRIPT"
        }
    });
}

function javascriptTemplatedForwardWithDelay() {
    var mockServerClient = require('mockserver-client').mockServerClient;
    mockServerClient("localhost", 1080).mockAnyResponse({
        "httpRequest": {
            "path": "/some/path"
        },
        "httpForwardTemplate": {
            "template": "return {\n" +
            "    'path' : \"/somePath\",\n" +
            "    'cookies' : {\n" +
            "        'SessionId' : request.cookies && request.cookies['SessionId']\n" +
            "    },\n" +
            "    'headers' : {\n" +
            "        'Host' : [ \"localhost:1081\" ]\n" +
            "    },\n" +
            "    'keepAlive' : true,\n" +
            "    'secure' : true,\n" +
            "    'body' : \"some_body\"\n" +
            "};",
            "templateType": "JAVASCRIPT",
            "delay": {"timeUnit": "SECONDS", "value": 20}
        }
    });
}

function velocityTemplatedForward() {
    var mockServerClient = require('mockserver-client').mockServerClient;
    mockServerClient("localhost", 1080).mockAnyResponse({
        "httpRequest": {
            "path": "/some/path"
        },
        "httpForwardTemplate": {
            "template": "{\n" +
            "    'path' : \"/somePath\",\n" +
            "    'queryStringParameters' : {\n" +
            "        'userId' : [ \"$!request.queryStringParameters['userId'][0]\" ]\n" +
            "    },\n" +
            "    'cookies' : {\n" +
            "        'SessionId' : \"$!request.cookies['SessionId']\"\n" +
            "    },\n" +
            "    'headers' : {\n" +
            "        'Host' : [ \"localhost:1081\" ]\n" +
            "    },\n" +
            "    'body': \"{'name': 'value'}\"\n" +
            "}",
            "templateType": "VELOCITY"
        }
    });
}