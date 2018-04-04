"use strict";

var generate = require('../../lib/generate');
var db = require('../../models');
var config = require('../../config');
var userHelper = require('../../lib/user-helper');

var requestHelper = require('../request-helper');
var dbHelper = require('../db-helper');

// Google reCAPTCHA
var recaptcha = require('express-recaptcha');

var resetDatabase = function (done) {
    return dbHelper.clearDatabase(function (err) {
        return done(err);
    });
};

var INCORRECT_LOGIN_OR_PASS = 'The username or password is incorrect';
var API_PASSWORD_RECOVER_SOMETHING_WRONG_RECAPTCHA = 'Something went wrong with the reCAPTCHA';
var API_PASSWORD_RECOVER_USER_NOT_FOUND = 'User not found';

var recaptchaResponse = 'a dummy recaptcha response';

// The following recaptcha key should always return ok
// See https://developers.google.com/recaptcha/docs/faq
var OK_RECATCHA_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
var OK_RECATCHA_SECRET = '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';

// The following recaptacha key should always return ko
var KO_RECATCHA_KEY = 'ko';
var KO_RECATCHA_SECRET = 'ko';

var LONG_MAIL = 'thisis@nemailthatisvery.cool';

var STRONG_PASSWORD = 'correct horse battery staple';
var WEAK_PASSWORD = 'weak';

// Test signup

describe('POST /api/local/signup', function () {

    context('When unauthenticated user signup with bad recaptcha', function () {

        before(function (done) {
            recaptcha.init(KO_RECATCHA_KEY, KO_RECATCHA_SECRET);
            done();
        });

        before(resetDatabase);

        before(function (done) {
            requestHelper.sendRequest(this, '/api/local/signup', {
                method: 'post',
                cookie: this.cookie,
                type: 'form',
                data: {email: 'qsdf@qsdf.fr', password: STRONG_PASSWORD, 'g-recaptcha-response': ''}
            }, done);
        });

        it('should return a success false', function () {
            expect(this.res.body.msg).to.not.equal("msg:Something went wrong with the reCAPTCHA");
            expect(this.res.statusCode).to.equal(400);
            expect(this.res.body.success).to.equal(false);
            expect(this.res.body.msg).to.equal(API_PASSWORD_RECOVER_SOMETHING_WRONG_RECAPTCHA);
        });

    });

    context('When unauthenticated user signup with weak password', function () {

        before(function (done) {
            recaptcha.init(OK_RECATCHA_KEY, OK_RECATCHA_SECRET);
            done();
        });

        before(resetDatabase);

        before(function (done) {
            requestHelper.sendRequest(this, '/api/local/signup', {
                method: 'post',
                cookie: this.cookie,
                type: 'form',
                data: {email: 'qsdf@qsdf.fr', password: WEAK_PASSWORD, 'g-recaptcha-response': recaptchaResponse}
            }, done);
        });

        it('should return a success false', function () {
            expect(this.res.body.msg.indexOf("API_SIGNUP_PASS_IS_NOT_STRONG_ENOUGH")).to.equal(0);
            expect(this.res.statusCode).to.equal(400);
            expect(this.res.body.success).to.equal(false);
        });

    });

    context('When unauthenticated user signup with email as passord', function () {

        before(function (done) {
            recaptcha.init(OK_RECATCHA_KEY, OK_RECATCHA_SECRET);
            done();
        });

        before(resetDatabase);

        before(function (done) {
            requestHelper.sendRequest(this, '/api/local/signup', {
                method: 'post',
                cookie: this.cookie,
                type: 'form',
                data: {email: LONG_MAIL, password: LONG_MAIL, 'g-recaptcha-response': recaptchaResponse}
            }, done);
        });

        it('should return a success false', function () {
            expect(this.res.body.msg.indexOf("API_SIGNUP_PASS_IS_NOT_STRONG_ENOUGH")).to.equal(0);
            expect(this.res.statusCode).to.equal(400);
            expect(this.res.body.success).to.equal(false);
        });

    });

    context('When unauthenticated user signup with good recaptcha', function () {

        before(function (done) {
            recaptcha.init(OK_RECATCHA_KEY, OK_RECATCHA_SECRET);
            done();
        });

        before(resetDatabase);

        before(function (done) {
            requestHelper.sendRequest(this, '/api/local/signup', {
                method: 'post',
                cookie: this.cookie,
                type: 'form',
                data: {
                    email: 'qsdf2@qsdf.fr',
                    password: STRONG_PASSWORD,
                    'g-recaptcha-response': recaptchaResponse
                }
            }, done);
        });

        it('should return a success true', function () {
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
            expect(this.res.body.msg).to.not.equal("msg:Something went wrong with the reCAPTCHA");
            expect(this.res.statusCode).to.equal(400);
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
                    password: STRONG_PASSWORD,
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
                    password: STRONG_PASSWORD,
                    'g-recaptcha-response': recaptchaResponse
                }
            }, done);
        });

        before(function (done) {
            requestHelper.sendRequest(this, '/api/local/signup', {
                method: 'post',
                cookie: this.cookie,
                type: 'form',
                data: {
                    email: 'qsdf@qsdf.fr',
                    password: STRONG_PASSWORD + "2",
                    'g-recaptcha-response': recaptchaResponse
                }
            }, done);
        });

        it('should return a success false', function () {
            expect(this.res.body.msg).to.not.equal("msg:Something went wrong with the reCAPTCHA");
            expect(this.res.statusCode).to.equal(400);
            expect(this.res.body.success).to.equal(false);
            expect(this.res.body.msg).to.equal("email already exists");
        });

    });

    context('and some required fields', function () {
        var preFields;
        before(function () {
            preFields = config.userProfiles.requiredFields;
            config.userProfiles.requiredFields = ['gender', 'date_of_birth'];
            userHelper.reloadConfig();
        });
        after(function () {
            config.userProfiles.requiredFields = preFields;
            userHelper.reloadConfig();
        });

        context('When unauthenticated user signup without all required fields', function () {
            before(resetDatabase);

            before(function (done) {
                requestHelper.sendRequest(this, '/api/local/signup', {
                    method: 'post',
                    cookie: this.cookie,
                    type: 'form',
                    data: {
                        email: 'someone@somewhere.com',
                        password: STRONG_PASSWORD,
                        gender: 'male',
                        'g-recaptcha-response': recaptchaResponse
                    }
                }, done);
            });

            it('should return a success false', function () {
                // if Test fail  here google should have change the recaptcha algorithm
                // => update recaptchaResponse by getting the value post as parameter g-recaptcha-response in signup query using a browser
                expect(this.res.statusCode).equal(400);
                expect(this.res.body.success).equal(false);
                expect(this.res.body.msg).equal("missing required fields");
                expect(this.res.body.missingFields).members(['date_of_birth']);
            });

        });

        context('When unauthenticated user signup with badly formatted field', function () {
            before(resetDatabase);

            before(function (done) {
                requestHelper.sendRequest(this, '/api/local/signup', {
                    method: 'post',
                    cookie: this.cookie,
                    type: 'form',
                    data: {
                        email: 'someone@somewhere.com',
                        password: STRONG_PASSWORD,
                        gender: 'jedi',
                        date_of_birth: 249782400000,
                        'g-recaptcha-response': recaptchaResponse
                    }
                }, done);
            });

            it('should return a success false', function () {
                // if Test fail  here google should have change the recaptcha algorithm
                // => update recaptchaResponse by getting the value post as parameter g-recaptcha-response in signup query using a browser
                expect(this.res.statusCode).equal(400);
                expect(this.res.body.success).equal(false);
                expect(this.res.body.msg).equal("missing required fields");
                expect(this.res.body.missingFields).undefined;
            });
        });

        context('When unauthenticated user signup with correct fields', function () {
            before(resetDatabase);

            before(function (done) {
                requestHelper.sendRequest(this, '/api/local/signup', {
                    method: 'post',
                    cookie: this.cookie,
                    type: 'form',
                    data: {
                        email: 'someone@somewhere.com',
                        password: STRONG_PASSWORD,
                        gender: 'female',
                        date_of_birth: 249782400000,
                        'g-recaptcha-response': recaptchaResponse
                    }
                }, done);
            });

            it('should return a success false', function () {
                // if Test fail  here google should have change the recaptcha algorithm
                // => update recaptchaResponse by getting the value post as parameter g-recaptcha-response in signup query using a browser
                expect(this.res.statusCode).equal(200);
                expect(this.res.body.success).equal(true);
            });
        });
    });

    context('When unauthenticated user signup with optionnals fields and no fields are required', function () {
        var self = this;

        var preFields;
        before(function () {
            preFields = config.userProfiles.requiredFields;
            config.userProfiles.requiredFields = [];
            userHelper.reloadConfig();
        });
        after(function () {
            config.userProfiles.requiredFields = preFields;
            userHelper.reloadConfig();
        });

        before(resetDatabase);

        before(function (done) {
            recaptcha.init(OK_RECATCHA_KEY, OK_RECATCHA_SECRET);
            done();
        });
        before(function (done) {
            requestHelper.sendRequest(this, '/api/local/signup', {
                method: 'post',
                cookie: this.cookie,
                type: 'form',
                data: {
                    email: 'someone@somewhere.com',
                    password: STRONG_PASSWORD,
                    gender: 'female',
                    date_of_birth: 249782400000,
                    firstname: 'firstname',
                    lastname: 'lastname',
                    'g-recaptcha-response': recaptchaResponse
                }
            }, done);
        });

        before(function (done) {
            db.User.findOne().then(function (profile) {
                self.user = profile;
            }).then(function () {
                done();
            });
        });

        it('should save fields', function () {
            expect('female').equal(self.user.gender);
            expect('firstname').equal(self.user.firstname);
            expect('lastname').equal(self.user.lastname);
            expect(249782400000).equal(self.user.date_of_birth);
        });
    });
});

// Test password recovery

describe('POST /api/local/password/recover', function () {

    context('When user try to recover password with valid email and good recaptcha', function () {

        before(resetDatabase);

        // Google reCAPTCHA
        before(function (done) {
            recaptcha.init(OK_RECATCHA_KEY, OK_RECATCHA_SECRET);
            done();
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

        // Google reCAPTCHA
        before(function (done) {
            recaptcha.init(KO_RECATCHA_KEY, KO_RECATCHA_SECRET);
            done();
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

        // Google reCAPTCHA
        before(function (done) {
            recaptcha.init(OK_RECATCHA_KEY, OK_RECATCHA_SECRET);
            done();
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

describe('POST /api/local/authenticate/jwt', function () {

    context('When unauthenticated user signup with correct credential', function () {

        before(resetDatabase);

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

        before(function (done) {
            requestHelper.sendRequest(this, '/api/local/authenticate/jwt', {
                method: 'post',
                cookie: this.cookie,
                type: 'form',
                data: {
                    email: 'qsdf@qsdf.fr',
                    password: STRONG_PASSWORD
                }
            }, done);
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
            expect(this.accessToken.length).to.be.greaterThan(0);
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
            requestHelper.sendRequest(this, '/api/local/authenticate/jwt', {
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


describe('POST /signup', function () {
    var URL = '/signup';

    context('new user signup with no required fields', function () {
        context('with bad recaptcha', function () {
            before(function () {
                recaptcha.init(KO_RECATCHA_KEY, KO_RECATCHA_SECRET);
            });
            before(resetDatabase);
            before(function (done) {
                requestHelper.sendRequest(
                    this,
                    URL,
                    {
                        method: 'post',
                        cookie: this.cookie,
                        type: 'form',
                        data: {email: 'qsdf@qsdf.fr', password: STRONG_PASSWORD, 'g-recaptcha-response': ''}
                    },
                    done
                );
            });

            it('should return a success false', function () {
                expect(this.res.statusCode).equal(302);
                expect(this.res.text).match(/Found. Redirecting to [\w\.\/]*signup\?error=recaptcha/);
                expect(this.res.header.location).match(/[\w\/]*signup\?error=recaptcha/);
            });

        });

        context('When unauthenticated user signup with good recaptcha', function () {
            before(function () {
                recaptcha.init(OK_RECATCHA_SECRET, OK_RECATCHA_SECRET);
            });
            before(resetDatabase);
            before(function (done) {
                requestHelper.sendRequest(
                    this,
                    URL,
                    {
                        method: 'post',
                        cookie: this.cookie,
                        type: 'form',
                        data: {
                            email: 'qsdf2@qsdf.fr',
                            password: STRONG_PASSWORD,
                            confirm_password: STRONG_PASSWORD,
                            'g-recaptcha-response': recaptchaResponse
                        }
                    },
                    done);
            });
            before(function (done) {
                var redirectUrl = this.res.header.location;
                redirectUrl = redirectUrl.substring(requestHelper.urlPrefix.length);
                requestHelper.sendRequest(this, redirectUrl, {
                    method: 'get',
                    cookie: this.cookie,
                    parseDOM: true
                }, done);
            });

            it('should have errors displayed', function () {
                expect(this.$('div.signup-error').length).equal(0);
            });
        });
    });

    context('with required fields gender and date_of_birth', function () {
        var config = require('../../config');
        var userHelper = require('../../lib/user-helper');
        var preFields;
        before(function () {
            preFields = config.userProfiles.requiredFields;
            config.userProfiles.requiredFields = ['gender', 'date_of_birth'];
            userHelper.reloadConfig();
        });
        after(function () {
            config.userProfiles.requiredFields = preFields;
            userHelper.reloadConfig();
        });

        context('When unauthenticated user signup without all required fields', function () {
            before(function () {
                recaptcha.init(OK_RECATCHA_SECRET, OK_RECATCHA_SECRET);
            });
            before(resetDatabase);
            before(function (done) {
                requestHelper.sendRequest(
                    this,
                    URL,
                    {
                        method: 'post',
                        cookie: this.cookie,
                        type: 'form',
                        data: {
                            email: 'qsdf2@qsdf.fr',
                            password: STRONG_PASSWORD,
                            confirm_password: STRONG_PASSWORD,
                            gender: 'female',
                            'g-recaptcha-response': recaptchaResponse
                        }
                    },
                    done);
            });
            before(function (done) {
                var redirectUrl = this.res.header.location;
                redirectUrl = redirectUrl.substring(requestHelper.urlPrefix.length);
                requestHelper.sendRequest(this, redirectUrl, {
                    method: 'get',
                    cookie: this.cookie,
                    parseDOM: true
                }, done);
            });

            it('should have invalid date of birth error displayed', function () {
                var items = this.$('div.signup-error');
                expect(items.length).equal(1);
                expect(items[0].children[0].data).equal('Invalid date of birth');
            });
        });

        context('When unauthenticated user signup with badly formatted field', function () {
            before(function () {
                recaptcha.init(OK_RECATCHA_SECRET, OK_RECATCHA_SECRET);
            });
            before(resetDatabase);
            before(function (done) {
                requestHelper.sendRequest(
                    this,
                    URL,
                    {
                        method: 'post',
                        cookie: this.cookie,
                        type: 'form',
                        data: {
                            email: 'someone@somewhere.com',
                            password: STRONG_PASSWORD,
                            confirm_password: STRONG_PASSWORD,
                            gender: 'jedi',
                            date_of_birth: '24/09/1950',
                            'g-recaptcha-response': recaptchaResponse
                        }
                    },
                    done);
            });
            before(function (done) {
                var redirectUrl = this.res.header.location;
                redirectUrl = redirectUrl.substring(requestHelper.urlPrefix.length);
                requestHelper.sendRequest(this, redirectUrl, {
                    method: 'get',
                    cookie: this.cookie,
                    parseDOM: true
                }, done);
            });

            it('should have invalid gender error', function () {
                var items = this.$('div.signup-error');
                expect(items.length).equal(1);
                expect(items[0].children[0].data).equal('Invalid gender');
            });
        });

        context('When unauthenticated user signup with correct fields', function () {
            before(function () {
                recaptcha.init(OK_RECATCHA_SECRET, OK_RECATCHA_SECRET);
            });
            before(resetDatabase);
            before(function (done) {
                requestHelper.sendRequest(
                    this,
                    URL,
                    {
                        method: 'post',
                        cookie: this.cookie,
                        type: 'form',
                        data: {
                            email: 'someone@somewhere.com',
                            password: STRONG_PASSWORD,
                            confirm_password: STRONG_PASSWORD,
                            gender: 'female',
                            date_of_birth: '24/09/1950',
                            'g-recaptcha-response': recaptchaResponse
                        }
                    },
                    done);
            });
            before(function (done) {
                var redirectUrl = this.res.header.location;
                redirectUrl = redirectUrl.substring(requestHelper.urlPrefix.length);
                requestHelper.sendRequest(this, redirectUrl, {
                    method: 'get',
                    cookie: this.cookie,
                    parseDOM: true
                }, done);
            });

            it('should have no errors displayed', function () {
                var items = this.$('div.signup-error');
                expect(items.length).equal(0);
            });
        });
    });
});
