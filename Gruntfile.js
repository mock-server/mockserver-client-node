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
                serverSecurePort: 1082,
                proxyPort: 1090,
                proxySecurePort: 1092
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
        }
    });

    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('mockserver-grunt');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-nodeunit');

    grunt.registerTask('test', ['start_mockserver', 'nodeunit', 'stop_mockserver']);

    grunt.registerTask('wrecker', ['jshint', 'test']);
    grunt.registerTask('default', ['exec', 'wrecker']);
};
