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

// Test get profile after account creation
var recaptchaResponse = 'a dummy recaptcha response';

var STRONG_PASSWORD = 'correct horse battery staple';

describe('GET /api/local/profile', function () {

    function cleanDbAndRegisterUser() {
        before(resetDatabase);

        // register a first user
        // The purpose of this user is to push the user used for test at the second position in the db.
        // That should detect possible bug if a developer return the first item of the table instead of the user by it's key.
        // That's happen when "where" is missing in db.user.find({where: {id: <id>}})...
        before(function (done) {
            requestHelper.sendRequest(this, '/api/local/signup', {
                method: 'post',
                cookie: this.cookie,
                type: 'form',
                data: {
                    email: 'test@db.fr',
                    password: STRONG_PASSWORD,
                    'g-recaptcha-response': recaptchaResponse
                }
            }, done);
        });

        it('should return a success false', function () {
            expect(this.res.body.msg).to.not.equal("msg:Something went wrong with the reCAPTCHA");
        });

        before(function (done) {
            requestHelper.sendRequest(this, '/api/local/signup', {
                method: 'post',
                cookie: this.cookie,
                type: 'form',
                data: {
                    email: 'qsdf@qsdf.fr',
                    password: STRONG_PASSWORD,
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
                    password: STRONG_PASSWORD
                }
            }, done);
        });
    }

    context('When user request his profile after account creation', function () {

        cleanDbAndRegisterUser();

        before(function (done) {
            var accessToken = this.res.body.token;
            requestHelper.sendRequest(this, '/api/local/profile', {
                method: 'get',
                accessToken: accessToken.substring(4, accessToken.size),
                tokenType: 'JWT'
            }, done);
        });

        it('should return a success ', function () {
            //console.log('success:' + this.res.body.success);
            //console.log('status:' + this.res.statusCode);
            expect(this.res.statusCode).to.equal(200);
            expect(this.res.body.success).to.equal(true);
            expect(this.res.body.user_profile.firstname).null;
            expect(this.res.body.user_profile.lastname).null;
            expect(this.res.body.user_profile.gender).null;
            expect(this.res.body.user_profile.birthdate).null;
            expect(this.res.body.user_profile.email).to.equals('qsdf@qsdf.fr');
            expect(this.res.body.user_profile.display_name).to.equals('qsdf@qsdf.fr');
        });

    });

    context('When user update his profile after account creation', function () {
        var accessToken;

        cleanDbAndRegisterUser();

        var birth = new Date(Date.UTC(2012, 11, 31, 0, 0, 0)).getTime();

        before(function (done) {
            accessToken = this.res.body.token.substring(4, this.res.body.token.size);

            requestHelper.sendRequest(this, '/api/local/profile', {
                    method: 'put',
                    type: 'json',
                    data: {
                        firstname: 'emile',
                        lastname: 'zola',
                        gender: 'male',
                        birthdate: birth
                    },
                    accessToken: accessToken,
                    tokenType: 'JWT'
                }, done
            );
        });


        it('update profile should return a success ', function () {
            //console.log('update success:' + this.res.body.success);
            //console.log('update status:' + this.res.statusCode);
            expect(this.res.statusCode).to.equal(200);
            expect(this.res.body.success).to.equal(true);
        });

        before(function (done) {
            //var accessToken = this.res.body.token;

            //console.log('accessToken : ' + accessToken);

            requestHelper.sendRequest(this, '/api/local/profile?policy=FIRSTNAME_LASTNAME', {
                method: 'get',
                accessToken: accessToken,
                tokenType: 'JWT'
            }, done);
        });

        it('get profile should return a success ', function () {
            //console.log('get profile success:' + this.res.body.success);
            //console.log('get profile status:' + this.res.statusCode);
            expect(this.res.statusCode).to.equal(200);
            expect(this.res.body.success).to.equal(true);
            expect(this.res.body.user_profile.firstname).to.equal('emile');
            expect(this.res.body.user_profile.lastname).to.equal('zola');
            expect(this.res.body.user_profile.gender).to.equal('male');
            expect(this.res.body.user_profile.birthdate).to.equals(birth);
            expect(this.res.body.user_profile.email).to.equals('qsdf@qsdf.fr');
            expect(this.res.body.user_profile.display_name).to.equals('emile zola');
        });

    });


    context('When user request tries to save a profile with bad parameter', function () {

        context('Bad gender (not male or female)', function () {

            cleanDbAndRegisterUser();

            before(function (done) {
                var accessToken = this.res.body.token.substring(4, this.res.body.token.size);
                requestHelper.sendRequest(this, '/api/local/profile', {
                        method: 'put',
                        type: 'json',
                        data: {gender: 'bad gender'},
                        accessToken: accessToken,
                        tokenType: 'JWT'
                    }, done
                );
            });

            it('should return bad parameters ', function () {
                expect(this.res.statusCode).to.equal(400);
                expect(this.res.body.success).to.equal(false);
            });
        });

        context('Bad birthdate (not a number)', function () {

            cleanDbAndRegisterUser();

            before(function (done) {
                var accessToken = this.res.body.token.substring(4, this.res.body.token.size);
                requestHelper.sendRequest(this, '/api/local/profile', {
                        method: 'put',
                        type: 'json',
                        data: {birthdate: 'not a number'},
                        accessToken: accessToken,
                        tokenType: 'JWT'
                    }, done
                );
            });

            it('should return bad parameters ', function () {
                expect(this.res.statusCode).to.equal(400);
                expect(this.res.body.success).to.equal(false);
            });
        });

        context('Bad firstname (not a string)', function () {

            cleanDbAndRegisterUser();

            before(function (done) {
                var accessToken = this.res.body.token.substring(4, this.res.body.token.size);
                requestHelper.sendRequest(this, '/api/local/profile', {
                        method: 'put',
                        type: 'json',
                        data: {firstname: 42},
                        accessToken: accessToken,
                        tokenType: 'JWT'
                    }, done
                );
            });

            it('should return bad parameters ', function () {
                expect(this.res.statusCode).to.equal(400);
                expect(this.res.body.success).to.equal(false);
            });
        });


        context('Bad lastname (not a string)', function () {

            cleanDbAndRegisterUser();

            before(function (done) {
                var accessToken = this.res.body.token.substring(4, this.res.body.token.size);
                requestHelper.sendRequest(this, '/api/local/profile', {
                        method: 'put',
                        type: 'json',
                        data: {lastname: 42},
                        accessToken: accessToken,
                        tokenType: 'JWT'
                    }, done
                );
            });

            it('should return bad parameters ', function () {
                expect(this.res.statusCode).to.equal(400);
                expect(this.res.body.success).to.equal(false);
            });
        });

    });


});