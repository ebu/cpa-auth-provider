"use strict";

var generate = require('../../lib/generate');
var db = require('../../models');

var requestHelper = require('../request-helper');
var dbHelper = require('../db-helper');

var resetDatabase = function (done) {
    dbHelper.clearDatabase(function (err) {
        done(err);
    });
};

var recaptchaResponse = '03AOPBWq-G1Wmuf3Vdr9jdWqVdNnqwgQPYVJOBoiAAglGFbaL8PQsLaRVGNEa4WXa-rX2wZmeZ8gK8aLZnhukf55ZOzrrKg5AoCg5DhpJ4FmrQj4AMS3XMsqC3oQMyzoCs-kyOvJ6RBy0BHheC6EXJFpDsMK_gnZRUpOmWsnH8PRt_TCsx2ZgDUIGoZF9fX175moy-A1N5s1ZQ1xtU-eTVI6RWv0ZcwUKdkOrUBomQ9CDguQQwmeUv8tIoRoeMtAMlS1tQCRXHjC5dKIw7BxV-UEraDCsNdnwCOL-LRga6f0MuSXuBqWmJzUg';


// Test authenticate

describe('GET /api/local/request_verification_email', function () {


    context('When unauthenticated user signup with correct credential request a new validation email', function () {

        before(resetDatabase);

        before(function (done) {
            requestHelper.sendRequest(this, '/api/local/signup', {
                method: 'post',
                cookie: this.cookie,
                type: 'form',
                data: {
                    email: 'qsdf@qsdf.fr',
                    password: 'qsdf',
                    'g-recaptcha-response': recaptchaResponse
                }
            }, done);
        });

        it('should return a success false', function () {
            // if Test fail  here google should have change the recaptcha algorithm
            // => update recaptchaResponse by getting the value post as parameter g-recaptcha-response in signup query using a browser
            expect(this.res.body.msg).to.not.equal("msg:Something went wrong with the reCAPTCHA");
        });

        before(function (done) {
            requestHelper.sendRequest(this, '/api/local/authenticate', {
                method: 'post',
                cookie: this.cookie,
                type: 'form',
                data: {
                    email: 'qsdf@qsdf.fr',
                    password: 'qsdf'
                }
            }, done);
        });

        // Test resend validation mail
        before(function (done) {
            this.accessToken = this.res.body.token.substring(4, this.res.body.token.size);

            requestHelper.sendRequest(this, '/api/local/request_verification_email', {
                    method: 'get',
                    accessToken: this.accessToken,
                    tokenType: 'JWT'
                }, done
            );
        });

        it('/api/local/request_verification_email should return a success ', function () {
            expect(this.res.statusCode).to.equal(204);
        });
    });


});