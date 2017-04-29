/*
 * mockserver
 * http://mock-server.com
 *
 * Copyright (c) 2014 James Bloom
 * Licensed under the Apache License, Version 2.0
 */
(function () {
    "use strict";

    if (module && require) {
        var WebSocketClient = require('websocket').client;

        var webSocketClient = function (host, port, contextPath) {

            var clientId;
            var clientIdHandler;
            var requestHandler;
            var webSocketLocation = "ws://" + host + ":" + port + contextPath + "/_mockserver_callback_websocket";

            var client = new WebSocketClient({
                maxReceivedFrameSize: 64 * 1024 * 1024,   // 64MiB
                maxReceivedMessageSize: 64 * 1024 * 1024, // 64MiB
                fragmentOutgoingMessages: false
            });

            client.on('connectFailed', function (error) {
                console.log('Connect Error: ' + error.toString());
            });

            client.on('connect', function (connection) {
                connection.on('error', function (error) {
                    console.log('Connection Error: ' + error.toString());
                });
                connection.on('message', function (message) {
                    if (message.type === 'utf8') {
                        var payload = JSON.parse(message.utf8Data);
                        if (payload.type === "org.mockserver.model.HttpRequest") {
                            var request = JSON.parse(payload.value);
                            var response = requestHandler(request);
                            connection.sendUTF(JSON.stringify(response));
                        } else if (payload.type === "org.mockserver.client.serialization.model.WebSocketClientIdDTO") {
                            var registration = JSON.parse(payload.value);
                            if (registration.clientId) {
                                clientId = registration.clientId;
                                if (clientIdHandler) {
                                    clientIdHandler(clientId);
                                }
                            }
                        }
                    } else {
                        console.log('Incorrect message format: ' + JSON.parse(message));
                    }
                });
            });

            client.connect(webSocketLocation, []);

            function requestCallback(callback) {
                requestHandler = callback;
            }

            function clientIdCallback(callback) {
                clientIdHandler = callback;
                if (clientId) {
                    clientIdHandler(clientId);
                }
            }

            return {
                requestCallback: requestCallback,
                clientIdCallback: clientIdCallback
            };
        };

        module.exports = {
            webSocketClient: webSocketClient
        };
    }
})();