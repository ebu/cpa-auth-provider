"use strict";

var config = require('../../config');

var requestHelper = require('../request-helper');
var jsdom = require('jsdom');

describe('GET /', function () {

    context('with a a displayMenuBar conf variable at true', function () {

        var doc, window, $;

        before(function () {
            config.displayMenuBar = true;
        });

        before(function (done) {
            requestHelper.sendRequest(this, '/password/recovery', {cookie: this.cookie, parseDOM: true}, done);
        });

        before(function (done) {
            if(this.res.text) {
                doc = jsdom.jsdom(this.res.text);
                window = doc.parentWindow;
                $ = global.jQuery = require('jquery')(window);
            }
            done();
        });

        it('should show the navigation bar', function () {
            expect($('nav.navbar').length).to.equal(1);
        });

    });

    context('with a a displayMenuBar conf variable at false', function () {

        var doc, window, $;

        before(function () {
            config.displayMenuBar = false;
        });

        before(function (done) {
            requestHelper.sendRequest(this, '/password/recovery', {cookie: this.cookie, parseDOM: true}, done);
        });

        before(function (done) {
            if(this.res.text) {
                doc = jsdom.jsdom(this.res.text);
                window = doc.parentWindow;
                $ = global.jQuery = require('jquery')(window);
            }
            done();
        });

        it('should hide the navigation bar', function () {
            expect($('nav.navbar').length).to.equal(0);
        });

    });

});