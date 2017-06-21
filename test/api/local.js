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

var INCORRECT_LOGIN_OR_PASS = 'The username or password is incorrect';
var API_PASSWORD_RECOVER_SOMETHING_WRONG_RECAPTCHA = 'Something went wrong with the reCAPTCHA';
var API_PASSWORD_RECOVER_USER_NOT_FOUND = 'User not found';

var recaptchaResponse = '03AOPBWq_bRoWT6-2e5P8PGK0FTDErW3gd1miP-brDdfAxj9x_RtZaTit6RSm0VhYmYFQt1MWT7uF77CC0kn0vKP5DwohN8B23zOhAWVHFshz9Bmobd8zCrPWEw2jgUJHXoqCLjbwrcaRq0c2OAuYYfa_j6sd3Vr6Vh9LX9V-Htd7rtkV9hznhXJIyXTXWCPlftGVeJNXC1l85YvAtomvjKBZmRriG0z68NdxujrqHjoWEYV-tysP2tw4-LSdffQCGP_t-hJ-N7W6yqIEmyrqntKOd7_iqfksoc8f_MUQ2te_MNI8mO6hRp2a0fa_qeOqBRHiwKCBxXOFbfnVyw7fmSjK3xd9z5UwbVXdIyVW19HUgrTEwMGlY2DoXc-N8MQe9sCk1Bw3leguREOHZoO8jGnZt0T1xnTNMro488ILkBA1wPO4XP73GPbwsG3h8-vTjAc2c2LtB9nSx';

// Test signup

describe('POST /api/local/signup', function () {

    context('When unauthenticated user signup with bad recaptcha', function () {

        before(resetDatabase);

        before(function (done) {
            requestHelper.sendRequest(this, '/api/local/signup', {
                method: 'post',
                cookie: this.cookie,
                type: 'form',
                data: {email: 'qsdf@qsdf.fr', password: 'qsdf', 'g-recaptcha-response': ''}
            }, done);
        });

        it('should return a success false', function () {
            // if Test fail  here google should have change the recaptcha algorithm
            // => update recaptchaResponse by getting the value post as parameter g-recaptcha-response in signup query using a browser
            expect(this.res.body.msg).to.not.equal("msg:Something went wrong with the reCAPTCHA");
            expect(this.res.statusCode).to.equal(200);
            expect(this.res.body.success).to.equal(false);
            expect(this.res.body.msg).to.equal(API_PASSWORD_RECOVER_SOMETHING_WRONG_RECAPTCHA);
        });

    });

    context('When unauthenticated user signup with good recaptcha', function () {

        before(resetDatabase);

        before(function (done) {
            requestHelper.sendRequest(this, '/api/local/signup', {
                method: 'post',
                cookie: this.cookie,
                type: 'form',
                data: {
                    email: 'qsdf2@qsdf.fr',
                    password: 'qsdf',
                    'g-recaptcha-response': recaptchaResponse
                }
            }, done);
        });

        it('should return a success true', function () {
            console.log("ERROR", this.res.body.msg);
            // if Test fail  here google should have change the recaptcha algorithm
            // => update recaptchaResponse by getting the value post as parameter g-recaptcha-response in signup query using a browser
            expect(this.res.body.msg).to.not.equal("msg:Something went wrong with the reCAPTCHA");
            expect(this.res.statusCode).to.equal(200);
            expect(this.res.body.success).to.equal(true);
            expect(this.res.body.msg).to.equal("Successfully created new user");
            expect(this.res.body.token).to.not.equal('');
        });

    });

    context('When unauthenticated user signup without password', function () {

        before(resetDatabase);

        before(function (done) {
            requestHelper.sendRequest(this, '/api/local/signup', {
                method: 'post',
                cookie: this.cookie,
                type: 'form',
                data: {
                    email: 'qsdf2@qsdf.fr',
                    'g-recaptcha-response': recaptchaResponse
                }
            }, done);
        });

        it('should return a success false', function () {
            // if Test fail  here google should have change the recaptcha algorithm
            // => update recaptchaResponse by getting the value post as parameter g-recaptcha-response in signup query using a browser
            expect(this.res.body.msg).to.not.equal("msg:Something went wrong with the reCAPTCHA");
            expect(this.res.statusCode).to.equal(200);
            expect(this.res.body.success).to.equal(false);
            expect(this.res.body.msg).to.equal("Please pass email and password");
        });

    });

    context('When unauthenticated user signup without mail', function () {

        before(resetDatabase);

        before(function (done) {
            requestHelper.sendRequest(this, '/api/local/signup', {
                method: 'post',
                cookie: this.cookie,
                type: 'form',
                data: {
                    password: 'qsdf',
                    'g-recaptcha-response': recaptchaResponse
                }
            }, done);
        });

        it('should return a success false', function () {
            // if Test fail  here google should have change the recaptcha algorithm
            // => update recaptchaResponse by getting the value post as parameter g-recaptcha-response in signup query using a browser
            expect(this.res.body.msg).to.not.equal("msg:Something went wrong with the reCAPTCHA");
            expect(this.res.statusCode).to.equal(200);
            expect(this.res.body.success).to.equal(false);
            expect(this.res.body.msg).to.equal("Please pass email and password");
        });

    });

    context('When 2 users register with same mail', function () {

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
            expect(this.res.statusCode).to.equal(400);
            expect(this.res.body.success).to.equal(false);
            expect(this.res.body.msg).to.equal("email already exists");
        });

    });

});

// Test password recovery

describe('POST /api/local/password/recover', function () {

    context('When user try to recover password with valid email and good recaptcha', function () {
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
            requestHelper.sendRequest(this, '/api/local/password/recover', {
                method: 'post',
                cookie: this.cookie,
                type: 'form',
                data: {
                    email: 'qsdf@qsdf.fr',
                    'g-recaptcha-response': recaptchaResponse
                }
            }, done);
        });

        it('should return a success ', function () {
            expect(this.res.statusCode).to.equal(200);
        });
    });

    context('When user try to recover password with valid email and bad recaptcha', function () {
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
            requestHelper.sendRequest(this, '/api/local/password/recover', {
                method: 'post',
                cookie: this.cookie,
                type: 'form',
                data: {
                    email: 'qsdf@qsdf.fr',
                    'g-recaptcha-response': 'dewdew'
                }
            }, done);
        });

        it('should return a 400 error', function () {
            expect(this.res.statusCode).to.equal(400);
            expect(this.res.body.msg).to.equal(API_PASSWORD_RECOVER_SOMETHING_WRONG_RECAPTCHA);
        });
    });

    context('When user try to recover password with valid email and bad recaptcha', function () {
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
            requestHelper.sendRequest(this, '/api/local/password/recover', {
                method: 'post',
                cookie: this.cookie,
                type: 'form',
                data: {
                    email: 'qsdfcewhfuwehweih@qsdf.fr',
                    'g-recaptcha-response': recaptchaResponse
                }
            }, done);
        });

        it('should return a 400 error', function () {
            expect(this.res.statusCode).to.equal(400);
            expect(this.res.body.msg).to.equal(API_PASSWORD_RECOVER_USER_NOT_FOUND);
        });
    });

});


// Test authenticate

describe('POST /api/local/authenticate', function () {

    context('When unauthenticated user signup with correct credential', function () {

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

        it('should return a success ', function () {
            // console.log('success:' + this.res.body.success);
            // console.log('token:' + this.res.body.token);
            expect(this.res.statusCode).to.equal(200);
            expect(this.res.body.success).to.equal(true);
        });

        // Test get user info
        before(function (done) {
            this.accessToken = this.res.body.token.substring(4, this.res.body.token.size);
            requestHelper.sendRequest(this, '/api/local/info', {
                    method: 'get',
                    accessToken: this.accessToken,
                    tokenType: 'JWT'
                }, done
            );
        });

        it('/api/local/info should return a success ', function () {
            expect(this.res.statusCode).to.equal(200);
            expect(this.res.body.success).to.equal(true);
            expect(this.res.body.user.email).to.equal('qsdf@qsdf.fr');
            expect(this.res.body.user.display_name).to.equal('qsdf@qsdf.fr');

        });
    });

    context('When unauthenticated user signup with bad credential', function () {

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
                    password: 'badpass'
                }
            }, done);
        });

        it('should return a 401 ', function () {
            //console.log('success:' + this.res.body.success);
            expect(this.res.statusCode).to.equal(401);
            expect(this.res.body.success).to.equal(false);
            expect(this.res.body.msg).to.equal(INCORRECT_LOGIN_OR_PASS);
        });
    });


});