# mockserver-client-node 

> Communicate with [MockServer](http://mock-server.com/) from any node or grunt build

[![Build Status](https://drone.io/github.com/jamesdbloom/mockserver-client-node/status.png)](https://drone.io/github.com/jamesdbloom/mockserver-client-node/latest) [![Dependency Status](https://david-dm.org/jamesdbloom/mockserver-client-node.png)](https://david-dm.org/jamesdbloom/mockserver-client-node) [![devDependency Status](https://david-dm.org/jamesdbloom/mockserver-client-node/dev-status.png)](https://david-dm.org/jamesdbloom/mockserver-client-node#info=devDependencies)
[![Still Maintained](http://stillmaintained.com/jamesdbloom/mockserver.png)](http://stillmaintained.com/jamesdbloom/mockserver)


[![NPM](https://nodei.co/npm/mockserver-client.png?downloads=true&stars=true)](https://nodei.co/npm/mockserver-client/) [![wercker status](https://app.wercker.com/status/7b78f11513b3dc5379f510a7ac82d0d6/m "wercker status")](https://app.wercker.com/project/bykey/7b78f11513b3dc5379f510a7ac82d0d6)


For chat room: [![Gitter](https://badges.gitter.im/Join Chat.svg)](https://gitter.im/jamesdbloom/mockserver?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## Getting Started

MockServer is for mocking of any system you integrate with via HTTP or HTTPS (i.e. services, web sites, etc).

This npm modules is allows any grunt of node project to easily communicate with the [MockServer](http://mock-server.com/).

An addition to this module for communicating with the MockServer there is also a grunt task that can be used to start and stop MockServer from grunt called [mockserver-grunt](https://www.npmjs.org/package/mockserver-grunt).

The both the MockServer and proxy clients can be created as follows:

```js
var mockServer = require('mockserver-client'),
    mockServerClient = mockServer.mockServerClient, // MockServer client
    proxyClient = mockServer.proxyClient; // proxy client
```
**Note:** this assumes you have an instance of MockServer running on port 1080 for more information on how to do this see [mockserver-grunt](https://www.npmjs.org/package/mockserver-grunt).

## Setup Expectation

Then an simple expectation can be setup as follows:

```js
mockServerClient("localhost", 1080).
    mockSimpleResponse('/somePath', { name: 'value' }, 203);
```

Or a more complex expectation can be setup as follows:

```js
mockServerClient("localhost", 1080).mockAnyResponse(
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
);
```

For the full syntax support see [MockServer - Creating JavaScript Expectations](http://mock-server.com/#create-expectations-javascript).

## Verify Requests

It is also possible to verify that request were made as follows:

```js
mockServerClient("localhost", 1080).verify(
    {
        'method': 'POST',
        'path': '/somePath',
        'body': 'someBody'
    }, 1, true);
```
## Release History
 * 2014-28-10   v0.0.1   Initial release
 * 2014-28-10   v0.0.2   Fixed module naming
 * 2014-28-10   v0.0.3   Fixing module loading
 * 2014-28-10   v0.0.4   Fixing badges
 * 2014-01-11   v1.0.0   Cleaned code & removed duplication
 * 2014-02-11   v1.0.1   Added wercker build process
 * 2014-21-11   v1.0.2   Fixed asynchronous errors
 * 2014-04-12   v1.0.3   Improved connection error handling
 * 2014-04-12   v1.0.4   Supporting protractor based promises
 * 2015-04-06   v1.0.5   Upgrading dependencies
 * 2015-06-02   v1.0.6   Improved clear and dumpToLog options

---

Task submitted by [James D Bloom](http://blog.jamesdbloom.com)
