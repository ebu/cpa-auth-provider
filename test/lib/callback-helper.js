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
                var oldPrefix, oldUrl;
                before(
                    function (done) {
                        oldUrl = config.baseUrl;
                        oldPrefix = config.urlPrefix;
                        config.baseUrl = HOST;
                        config.urlPrefix = '';
                        done();
                    }
                );
                after(
                    function () {
                        config.baseUrl = oldUrl;
                        config.urlPrefix = oldPrefix;
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
            function () {
                var oldPrefix, oldUrl;
                before(
                    function (done) {
                        oldUrl = config.baseUrl;
                        oldPrefix = config.urlPrefix;
                        config.baseUrl = HOST;
                        config.urlPrefix = PREFIX;
                        done();
                    }
                );
                after(
                    function () {
                        config.baseUrl = oldUrl;
                        config.urlPrefix = oldPrefix;
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
            function () {
                var oldPrefix, oldUrl;
                before(
                    function (done) {
                        oldUrl = config.baseUrl;
                        oldPrefix = config.urlPrefix;
                        config.baseUrl = HOST + '/';
                        config.urlPrefix = PREFIX + '/';
                        done();
                    }
                );
                after(
                    function () {
                        config.baseUrl = oldUrl;
                        config.urlPrefix = oldPrefix;
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