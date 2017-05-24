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

var recaptchaResponse = '03AOPBWq_AE4T0yzPD_QKTntmUfHZ7TiYNCCDBwOUMJBGmMv_3StO4UeabzvxTPBx_Izz96t9FmhDXJ-XK32gL8LQG4Cg12Zk3ObkEYj7zWbSmxEDYpxuV6OSe2sjEjYbvwp6EdszYQJbGjDqYP50kNX5H4Mb-_xdKzwDzOEVqLk9kDlzvzMz8kSodYRCuWGvkCYm2Sg8VX6Fexz8yTRRqT13TTNvc-hGCJ_EoXmmsX2HFdtL7xDmg1Df618vbCCsftqe2atUBSXSn8MNxAkXtFg7-kDZUOLHbXFBC_sPurEdaYVuqDbUBXwg';


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