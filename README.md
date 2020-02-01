# mockserver-client-node 

> Communicate with a [MockServer](http://mock-server.com/) from any node or grunt build

[![Build status](https://badge.buildkite.com/368c3b69e959f29725d8ab582f8d75dedddceee196d39b6d28.svg?style=square&theme=slack)](https://buildkite.com/mockserver/mockserver-client-node) [![Dependency Status](https://david-dm.org/mock-server/mockserver-client-node.png)](https://david-dm.org/mock-server/mockserver-client-node) [![devDependency Status](https://david-dm.org/mock-server/mockserver-client-node/dev-status.png)](https://david-dm.org/mock-server/mockserver-client-node#info=devDependencies)

[![NPM](https://nodei.co/npm/mockserver-client.png?downloads=true&stars=true)](https://nodei.co/npm/mockserver-client/) 

# Community

* Backlog:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="https://trello.com/b/dsfTCP46/mockserver" target="_blank"><img height="20px" src="http://mock-server.com/images/trello_badge-md.png" alt="Trello Backlog"></a>
* Freature Requests:&nbsp;&nbsp;<a href="https://github.com/mock-server/mockserver/issues"><img height="20px" src="http://mock-server.com/images/GitHub_Logo-md.png" alt="Github Issues"></a>
* Issues / Bugs:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="https://github.com/mock-server/mockserver/issues"><img height="20px" src="http://mock-server.com/images/GitHub_Logo-md.png" alt="Github Issues"></a>
* Chat:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="https://join-mock-server-slack.herokuapp.com" target="_blank"><img height="20px" src="http://mock-server.com/images/slack-logo-slim-md.png" alt="Join Slack"></a>

## Getting Started

[MockServer](http://mock-server.com/) allows you to mock any system you integrate with via HTTP or HTTPS (i.e. (REST) services, web sites, etc). Please note that it is a third party project that needs java.

This npm module allows any grunt or node project to easily communicate with a running [MockServer](http://mock-server.com/) instance.

As an addition to this module for communicating with a running MockServer there is a second project that can be used to start and stop a MockServer called [mockserver-node](https://www.npmjs.org/package/mockserver-node).

The MockServer client can be created as follows:

```js
var mockServer = require('mockserver-client'),
    mockServerClient = mockServer.mockServerClient // MockServer and proxy client
```
**Note:** this assumes you have an instance of MockServer running on port 1080.
For more information on how to do so check [mockserver-node](https://www.npmjs.org/package/mockserver-node).

## Setup Expectation

A simple expectation can be set up as follows:

```js
mockServerClient("localhost", 1080)
    .mockSimpleResponse('/somePath', { name: 'value' }, 203)
    .then(
        function(result) {
            // do something next
        }, 
        function(error) {
            // handle error
        }
    );
```

A more complex expectation can be set up like this:

```js
mockServerClient("localhost", 1080)
    .mockAnyResponse(
        {
            'httpRequest': {
                'method': 'POST',
                'path': '/somePath',
                'queryStringParameters': [
                    {
                        'name': 'test',
                        'values': [ 'true' ]
                    }
                ],
                'body': {
                    'type': "STRING",
                    'value': 'someBody'
                }
            },
            'httpResponse': {
                'statusCode': 200,
                'body': JSON.stringify({ name: 'value' }),
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
    )
    .then(
        function(result) {
            // do something next
        }, 
        function(error) {
            // handle error
        }
    );
```

For the full syntax support see [MockServer - Creating JavaScript Expectations](http://mock-server.com/#create-expectations-javascript).

## Verify Requests

It is also possible to verify that request were made:

```js
mockServerClient("localhost", 1080)
    .verify(
        {
            'method': 'POST',
            'path': '/somePath',
            'body': 'someBody'
        }, 
        1, true
    )
    .then(
        function() {
            // do something next
        }, 
        function(failure) {
            // handle verification failure
        }
    );
```
It is furthermore possible to verify that sequences of requests were made in a specific order:

```js
mockServerClient("localhost", 1080)
    .verifySequence(
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
            'path': '/somePathThree'
        }
    )
    .then(
        function() {
            // do something next
        }, 
        function(failure) {
            // handle verification failure
        }
    );
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History

Date       | Version | Description
:--------- |:------- |:---------------------------------------
2014-28-10 | v0.0.1  | Initial release
2014-28-10 | v0.0.2  | Fixed module naming
2014-28-10 | v0.0.3  | Fixing module loading
2014-28-10 | v0.0.4  | Fixing badges
2014-01-11 | v1.0.0  | Cleaned code & removed duplication
2014-02-11 | v1.0.1  | Added wercker build process
2014-21-11 | v1.0.2  | Fixed asynchronous errors
2014-04-12 | v1.0.3  | Improved connection error handling
2014-04-12 | v1.0.4  | Supporting protractor based promises
2015-04-06 | v1.0.5  | Upgrading dependencies
2015-06-02 | v1.0.6  | Improved clear and dumpToLog options
2015-09-27 | v1.0.7  | Fixed error with query parameter handling
2015-09-27 | v1.0.8  | Fixed documentation
2015-09-28 | v1.0.9  | Fixed documentation again
2015-10-11 | v1.0.10 | Added retrieve requests or expectations
2016-09-27 | v1.0.11 | Updated dependencies
2016-10-09 | v1.0.12 | Resolved issues with dependencies
2017-04-30 | v1.0.13 | Added websocket (i.e. method callbacks)
2017-05-03 | v1.0.14 | Backward compatibility for mockAnyResponse
2017-05-03 | v1.0.15 | Improving promise logic for protractor
2017-05-04 | v1.0.16 | Removed grunt peer dependencies
2017-11-18 | v2.0.0  | Improved error handling for server validation 
2017-12-06 | v5.1.0  | Upgrading MockServer to 5.1.0 
2017-12-07 | v5.1.1  | Upgrading MockServer to 5.1.1
2017-12-10 | v5.2.0  | Upgrading MockServer to 5.2.0
2017-12-11 | v5.2.1  | Improved error output + upgrade to 5.2.1
2017-12-12 | v5.2.2  | Fixed incorrect error format 5.2.2
2017-12-18 | v5.2.3  | Added retrieveLogs + upgrade to 5.2.3
2017-12-25 | v5.3.0  | Upgrading MockServer to 5.3.0
2018-11-04 | v5.4.1  | Upgrading MockServer to 5.4.1
2018-11-16 | v5.5.0  | Upgrading MockServer to 5.5.0
2018-12-29 | v5.5.1  | Upgrading MockServer to 5.5.1
2019-06-02 | v5.5.4  | Upgrading MockServer to 5.5.4
2019-06-02 | v5.6.0  | Upgrading MockServer to 5.6.0
2019-07-26 | v5.6.1  | Upgrading MockServer to 5.6.1
2019-11-01 | v5.7.0  | Cleaned code & upgrading to 5.7.0
2019-11-10 | v5.7.1  | Upgrading MockServer to 5.7.1
2019-11-17 | v5.7.2  | Upgrading MockServer to 5.7.2
2019-12-01 | v5.8.0  | Upgrading MockServer to 5.8.0
2019-12-24 | v5.8.1  | Upgrading MockServer to 5.8.1
2020-02-01 | v5.9.0  | Upgrading MockServer to 5.9.0

---

Task submitted by [James D Bloom](http://blog.jamesdbloom.com)

[![Analytics](https://ga-beacon.appspot.com/UA-32687194-4/mockserver-client-node/README.md)](https://github.com/igrigorik/ga-beacon)
