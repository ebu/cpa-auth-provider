describe(
    'Check callback-helper',
    function () {
        var callbackHelper = require('../../lib/callback-helper');
        var config = require('../../config');

        var HOST = 'http://www.test.super.de:3456';
        var PATH = 'my/path';
        var PREFIX = 'test';

        context(
            'with empty prefix',
            function () {
                before(
                    function (done) {
                        config.baseUrl = HOST;
                        config.urlPrefix = '';
                        done();
                    }
                );

                it(
                    'should have correct path',
                    function () {
                        expect(callbackHelper.getURL(PATH)).equal(HOST + '/' + PATH);
                    }
                );

                it(
                    'should work with empty path',
                    function () {
                        expect(callbackHelper.getURL('')).equal(HOST + '/');
                    }
                );
            }
        );

        context(
            'with prefix',
            function() {
                before(
                    function(done) {
                        config.baseUrl = HOST;
                        config.urlPrefix = PREFIX;
                        done();
                    }
                );

                it(
                    'should have correct path',
                    function () {
                        expect(callbackHelper.getURL(PATH)).equal(HOST + '/' + PREFIX + '/' + PATH);
                    }
                );

                it(
                    'should work with empty path',
                    function () {
                        expect(callbackHelper.getURL('')).equal(HOST + '/' + PREFIX);
                    }
                );
            }
        );

        context(
            'with / at end of host and prefix',
            function() {
                before(
                    function(done) {
                        config.baseUrl = HOST + '/';
                        config.urlPrefix = PREFIX + '/';
                        done();
                    }
                );

                it(
                    'should have correct path',
                    function () {
                        expect(callbackHelper.getURL(PATH)).equal(HOST + '/' + PREFIX + '/' + PATH);
                    }
                );

                it(
                    'should work with empty path',
                    function () {
                        expect(callbackHelper.getURL('')).equal(HOST + '/' + PREFIX + '/');
                    }
                );
            }
        );
    }
);