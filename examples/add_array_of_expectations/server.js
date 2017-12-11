var client = require('mockserver-client').mockServerClient("localhost", 1080);

client
    .mockAnyResponse(
        [
            {
                'httpRequest': {
                    'path': '/somePathOne'
                },
                'httpResponse': {
                    'statusCode': 200,
                    'body': JSON.stringify({'value': 'one'})
                }
            },
            {
                'httpRequest': {
                    'path': '/somePathTwo'
                },
                'httpResponse': {
                    'statusCode': 200,
                    'body': JSON.stringify({'value': 'one'})
                }
            },
            {
                'httpRequest': {
                    'path': '/somePathThree'
                },
                'httpResponse': {
                    'statusCode': 200,
                    'body': JSON.stringify({'value': 'one'})
                }
            }
        ]
    )
    .then(
        function () {
            console.log("created expectations");
        },
        function (error) {
            console.log(error);
        }
    );
