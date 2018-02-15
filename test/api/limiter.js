"use strict";

var config = require('../../config');

var requestHelper = require('../request-helper');
var dbHelper = require('../db-helper');
var limiter = require('../../lib/limiter-helper');

var resetDatabase = function (done) {
    return dbHelper.clearDatabase(function (err) {
        return done(err);
    });
};

var STRONG_PASSWORD = "correct horse battery staple";

describe('Limiter test', function () {

    context('When using rate limiter', function () {

        var savedLimiterType = config.limiter.type;
        config.limiter.parameters = config.limiter.parameters || {};
        config.limiter.parameters.rate = config.limiter.parameters.rate || {};
        var savedMax = config.limiter.parameters.rate.max;  //limiter.getCurrentRateLimitOptions('max');

        before(function (done) {
            config.limiter.type = "rate";
            config.limiter.parameters.rate.max = 2;
            limiter.updateConfig();
            done();
        });


        before(resetDatabase);

        // 3 signup (limit is 2)
        before(function (done) {
            signup.call(this, "email-for-limiter-test-1@socool.com", done);
        });
        before(function (done) {
            signup.call(this, "email-for-limiter-test-2@socool.com", done);
        });
        before(function (done) {
            signup.call(this, "email-for-limiter-test-3@socool.com", done);
        });

        after(function (done) {
            config.limiter.type = savedLimiterType;
            config.limiter.parameters.rate.max = savedMax;
            limiter.updateConfig();
            done();
        });

        it('should return a success true', function () {
            expect(this.res.statusCode).to.equal(429);
            expect(this.res.text).to.equal("Too many requests, please try again later.");
        });
    });
});

function signup(mail, done) {
    requestHelper.sendRequest(this, '/api/local/signup', {
        method: 'post',
        cookie: this.cookie,
        type: 'form',
        data: {
            email: mail,
            password: STRONG_PASSWORD
        }
    }, done);
}

