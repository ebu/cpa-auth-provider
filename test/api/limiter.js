"use strict";

var config = require('../../config');

var requestHelper = require('../request-helper');
var dbHelper = require('../db-helper');

// Google reCAPTCHA
var recaptcha = require('express-recaptcha');

var resetDatabase = function (done) {
    return dbHelper.clearDatabase(function (err) {
        return done(err);
    });
};

var recaptchaResponse = 'a dummy recaptcha response';

// The following recaptcha key should always return ok
// See https://developers.google.com/recaptcha/docs/faq
var OK_RECATCHA_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
var OK_RECATCHA_SECRET = '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';

var STRONG_PASSWORD = 'correct horse battery staple';


describe('Limiter test', function () {

    context('When using rate limiter', function () {

        var mail = 'email-for-limiter-test@socool.com';
        var i = 0;

        var savedLimiterType = config.limiter.type;

        before(function (done) {
            config.limiter.type = "rate";
            done();
        });

        after(function (done) {
            config.limiter.type = savedLimiterType;
            done();
        });

        before(function (done) {
            recaptcha.init(OK_RECATCHA_KEY, OK_RECATCHA_SECRET);
            done();
        });

        before(resetDatabase);


        before(function (done) {
            signup.call(this, (i++) + mail, done);
        });
        // before(function (done) {
        //     signup.call(this, (i++) + mail, done);
        // });
        // before(function (done) {
        //     signup.call(this, (i++) + mail, done);
        // });
        // before(function (done) {
        //     signup.call(this, (i++) + mail, done);
        // });
        // before(function (done) {
        //     signup.call(this, (i++) + mail, done);
        // });
        // before(function (done) {
        //     signup.call(this, (i++) + mail, done);
        // });
        // before(function (done) {
        //     signup.call(this, (i++) + mail, done);
        // });
        // before(function (done) {
        //     signup.call(this, (i++) + mail, done);
        // });
        // before(function (done) {
        //     signup.call(this, (i++) + mail, done);
        // });
        // before(function (done) {
        //     signup.call(this, (i++) + mail, done);
        // });
        // before(function (done) {
        //     signup.call(this, (i++) + mail, done);
        // });

        it('should return a success true', function () {
            console.log(this.res.error);
            expect(this.res.statusCode).to.equal(200);
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
            password: STRONG_PASSWORD,
            'g-recaptcha-response': recaptchaResponse
        }
    }, done);
}

