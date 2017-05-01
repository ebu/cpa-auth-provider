"use strict";

var config = require('../../config');
var requestHelper = require("../request-helper");

describe('GET /auth - for tracking cookie', function () {
    before(function (done) {
        requestHelper.sendRequest(this, '/auth', null, done);
    });

    it('should set a cookie', function () {
        expect(this.res.header['set-cookie']).to.be.an('array');
        expect(this.res.header['set-cookie'].length).to.equal(2);
    });
});

describe('GET /auth - for tracking cookie', function () {
    before(function (done) {
        config.trackingCookie.enabled = false;
        requestHelper.sendRequest(this, '/auth', null, done);
    });

    it('should not set a cookie if config.trackingCookie.enabled is false', function () {
        expect(this.res.header['set-cookie']).to.be.an('array');
        expect(this.res.header['set-cookie'].length).to.equal(1);
    });
});