"use strict";

var config = require('../../config');

var requestHelper = require('../request-helper');

describe('GET /', function () {

    context('with a a displayMenuBar conf variable at true', function () {

        before(function () {
            config.displayMenuBar = true;
        });

        before(function (done) {
            requestHelper.sendRequest(this, '/password/recovery', {cookie: this.cookie, parseDOM: true}, done);
        });

        it('should show the navigation bar', function () {
            expect(this.$('nav.navbar').length).to.equal(1);
        });

    });

    context('with a a displayMenuBar conf variable at false', function () {

        before(function () {
            config.displayMenuBar = false;
        });

        before(function (done) {
            requestHelper.sendRequest(this, '/password/recovery', {cookie: this.cookie, parseDOM: true}, done);
        });

        it('should hide the navigation bar', function () {
            expect(this.$('nav.navbar').length).to.equal(0);
        });

    });

});