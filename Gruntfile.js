/*
 * mockserver
 * http://mock-server.com
 *
 * Copyright (c) 2014 James Bloom
 * Licensed under the Apache License, Version 2.0
 */

'use strict';

module.exports = function (grunt) {

    grunt.initConfig({
        exec: {
            stop_existing_mockservers: './stop_MockServer.sh'
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            user_defaults: [
                'Gruntfile.js',
                'js/**/*.js',
                '!js/lib/**/*.js',
                '<%= nodeunit.no_proxy %>',
                '<%= nodeunit.with_proxy %>'
            ]
        },
        start_mockserver: {
            options: {
                serverPort: 1080,
                proxyPort: 1090,
                systemProperties: "-Dmockserver.enableCORSForAllResponses=true"
            }
        },
        stop_mockserver: {
            options: {
                serverPort: 1080,
                proxyPort: 1090
            }
        },
        nodeunit: {
            no_proxy: [
                'test/no_proxy/*_test.js'
            ],
            with_proxy: [
                'test/with_proxy/*_test.js'
            ],
            options: {
                reporter: 'nested'
            }
        },
        webdriver_jasmine_runner: {
            with_proxy: {
                options: {
                    browser: 'chrome',
                    testServer: 'localhost',
                    testServerPort: 1080,
                    testFile: 'test/SpecRunner.html?proxy=true',
                    proxy: {
                        proxyType: 'manual',
                        httpProxy: 'localhost:1090'
                    }
                }
            }
        },
        karma: {
            options: {
                configFile: 'test/karma.conf.js',
                logLevel: 'INFO',
                reporters: 'spec',
                browserDisconnectTimeout: 10 * 10000,
                browserNoActivityTimeout: 10 * 10000,
                singleRun: true,
                files: [
                    'mockServerClient.js',
                    'proxyClient.js',
                    'test/no_proxy/mock_server_browser_client_spec.js',
                    'test/with_proxy/proxy_browser_client_spec.js'
                ]
            },
            no_proxy_phantom: {
                browsers: ['PhantomJS'],
                mode: 'no_proxy'
            },
            with_proxy_phantom: {
                browsers: ['PhantomJS_with_proxy'],
                mode: 'with_proxy'
            },
            no_proxy_chrome: {
                browsers: ['Chrome'],
                mode: 'no_proxy'
            },
            with_proxy_chrome: {
                browsers: ['Chrome_with_proxy'],
                // browsers: ['Chrome'],
                mode: 'with_proxy',
                proxies: {
                    '/somePath': 'http://127.0.0.1:1090/somePath',
                    '/someOtherPath':  'http://127.0.0.1:1090/someOtherPath',
                    '/one':  'http://127.0.0.1:1090/one',
                    '/two':  'http://127.0.0.1:1090/two',
                    '/three':  'http://127.0.0.1:1090/three'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('mockserver-node');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-nodeunit');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-webdriver-jasmine-runner');

    grunt.registerTask('test_node', ['start_mockserver', 'nodeunit', 'stop_mockserver']);
    grunt.registerTask('test_browser', ['start_mockserver', 'karma:no_proxy_chrome', 'karma:with_proxy_chrome', 'stop_mockserver']);
    grunt.registerTask('test', ['start_mockserver', 'nodeunit', 'karma:no_proxy_chrome'/*, 'karma:with_proxy_chrome'*/, 'stop_mockserver']);

    grunt.registerTask('default', ['exec:stop_existing_mockservers', 'jshint', 'test']);
};
