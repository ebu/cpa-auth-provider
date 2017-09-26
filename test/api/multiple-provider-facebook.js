"use strict";

var requestHelper = require('../request-helper');
var db = require('../../models');
var dbHelper = require('../db-helper');
var recaptcha = require('express-recaptcha');
var config = require('../../config');

var nock = require('nock');

var EMAIL = 'someone@importa.nt';
var recaptchaResponse = 'a dummy recaptcha response';

// The following recaptcha key should always return ok
// See https://developers.google.com/recaptcha/docs/faq
var OK_RECATCHA_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
var OK_RECATCHA_SECRET = '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';


var STRONG_PASSWORD = 'correct horse battery staple';

var resetDatabase = function (done) {
    dbHelper.clearDatabase(function (err) {
        done(err);
    });
};

function mockFB() {
    nock('https://graph.facebook.com:443')
        .post('/oauth/access_token', "grant_type=authorization_code&redirect_uri=http%3A%2F%2Flocalhost%2Fap%2Fauth%2Ffacebook%2Fcallback&client_id=abc&client_secret=123&code=mycodeabc")
        .reply(200, {access_token: 'AccessTokenA', token_type: 'Bearer', expires_in: 3600});
    nock('https://graph.facebook.com')
        .get('/v2.5/me?fields=id%2Cemail%2Cname&access_token=AccessTokenA')
        .reply(200, {id: 'fffaaa-123', name: 'Cool Name', email: EMAIL});
}


describe('GET /auth/facebook', function () {

    describe('GET /auth/facebook', function () {
            before(function (done) {
                requestHelper.sendRequest(
                    this,
                    '/auth/facebook',
                    {
                        method: 'get',
                        cookie: this.cookie
                    },
                    done);
            });

            it('should redirect to facebook', function () {
                expect(this.res.statusCode).equal(302);
                expect(this.res.headers.location).match(/https:\/\/www\.facebook\.com\/dialog\/oauth\?response_type=code&redirect_uri=.*/);
            });
        }
    );


    describe('GET /auth/facebook/callback', function () {
        describe('When user is not in the system', function () {
            before(function (done) {
                mockFB();

                requestHelper.sendRequest(
                    this,
                    '/auth/facebook/callback?code=mycodeabc',
                    {
                        method: 'get',
                        cookie: this.cookie
                    },
                    done
                );
            });

            it('should redirect to /ap/', function () {
                    expect(this.res.statusCode).equal(302);
                    expect(this.res.text).equal('Found. Redirecting to /ap/');
                }
            );
        });
        describe('When user is in the system and hasn\'t validated his mail', function () {

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
                        email: EMAIL,
                        password: STRONG_PASSWORD,
                        gender: 'female',
                        date_of_birth: 249782400000,
                        'g-recaptcha-response': recaptchaResponse
                    }
                }, done)
            });

            before(function (done) {
                mockFB();

                requestHelper.sendRequest(
                    this,
                    '/auth/facebook/callback?code=mycodeabc',
                    {
                        method: 'get',
                        cookie: this.cookie
                    },
                    done
                );
            });

            it('should redirect to login with error LOGIN_INVALID_EMAIL_BECAUSE_NOT_VALIDATED_FB', function () {
                    expect(this.res.statusCode).equal(302);
                    expect(this.res.text).equal('Found. Redirecting to /auth?error=LOGIN_INVALID_EMAIL_BECAUSE_NOT_VALIDATED_FB');
                }
            );
        });

        describe('When user is in the system and has validated his mail', function () {

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
                        email: EMAIL,
                        password: STRONG_PASSWORD,
                        gender: 'female',
                        date_of_birth: 249782400000,
                        'g-recaptcha-response': recaptchaResponse
                    }
                }, done)
            });

            before(function (done) {
                db.User.findOne({where: {email: EMAIL}}).then(
                    function (user) {
                        user.updateAttributes({verified: true}).then(
                            function () {
                                done();
                            },
                            done
                        );
                    },
                    done
                );
            });

            before(function (done) {
                mockFB();

                requestHelper.sendRequest(
                    this,
                    '/auth/facebook/callback?code=mycodeabc',
                    {
                        method: 'get',
                        cookie: this.cookie
                    },
                    done
                );
            });

            it('should redirect to login with error LOGIN_INVALID_EMAIL_BECAUSE_NOT_VALIDATED_FB', function () {
                    expect(this.res.statusCode).equal(302);
                    expect(this.res.text).equal('Found. Redirecting to /ap/');
                }
            );
        });
    });
});
