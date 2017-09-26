"use strict";

var requestHelper = require('../request-helper');
var db = require('../../models');
var dbHelper = require('../db-helper');
var recaptcha = require('express-recaptcha');

var nock = require('nock');

var EMAIL = 'someone@gmail.com';
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

function mockGoogle() {
    nock('https://accounts.google.com/')
        .get('o/oauth2/v2/auth?response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fgoogle%2Fcallback&scope=profile%20email&client_id=621117323323-j048lcbv5khh6lhr1lok4vv17mekijvm.apps.googleusercontent.com')
        .reply(302);
    nock('https://www.googleapis.com').post('/oauth2/v4/token').reply(
        200,
        {
            access_token: 'access-token-g1',
        }
    );
    nock('https://www.googleapis.com').get('/plus/v1/people/me?access_token=access-token-g1').reply(
        200,
        {
            id: 'aa123',
            name: {familyName: 'Wurst', givenName: 'Hans'},
            gender: 'slug',
            emails: [{value: 'someone@gmail.com', type: 'main'}]
        }
    );
}

describe('GET /auth/google', function () {
        before(function (done) {
            requestHelper.sendRequest(
                this,
                '/auth/google',
                {
                    method: 'get',
                    cookie: this.cookie
                },
                done);
        });

        it('should redirect to google', function () {
            expect(this.res.statusCode).equal(302);
            expect(this.res.headers.location).equal('https://accounts.google.com/o/oauth2/v2/auth?response_type=code&redirect_uri=http%3A%2F%2Flocalhost%2Fap%2Fauth%2Fgoogle%2Fcallback&scope=profile%20email&client_id=abc');
        });
    }
);


describe('GET /auth/google/callback', function () {
    describe('When user is not in the system', function () {
        before(function (done) {

            mockGoogle();

            requestHelper.sendRequest(
                this,
                '/auth/google/callback?code=mycodeabc',
                {
                    method: 'get',
                    cookie: this.cookie
                },
                done
            );
        });

        it('should redirect ?', function () {
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
            mockGoogle();

            requestHelper.sendRequest(
                this,
                '/auth/google/callback?code=mycodeabc',
                {
                    method: 'get',
                    cookie: this.cookie
                },
                done
            );
        });

        it('should redirect to login with error LOGIN_INVALID_EMAIL_BECAUSE_NOT_VALIDATED_GOOGLE', function () {
                expect(this.res.statusCode).equal(302);
                expect(this.res.text).equal('Found. Redirecting to /auth?error=LOGIN_INVALID_EMAIL_BECAUSE_NOT_VALIDATED_GOOGLE');
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
            mockGoogle();

            requestHelper.sendRequest(
                this,
                '/auth/google/callback?code=mycodeabc',
                {
                    method: 'get',
                    cookie: this.cookie
                },
                done
            );
        });

        it('should redirect to login with error LOGIN_INVALID_EMAIL_BECAUSE_NOT_VALIDATED_GOOGLE', function () {
                expect(this.res.statusCode).equal(302);
                expect(this.res.text).equal('Found. Redirecting to /ap/');
            }
        );
    });
});
