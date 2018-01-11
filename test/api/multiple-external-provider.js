"use strict";

var db = require('../../models');

var nock = require('nock');
var recaptcha = require('express-recaptcha');

var dbHelper = require('../db-helper');
var requestHelper = require('../request-helper');
var socialLoginHelper = require('../../lib/social-login-helper');
var googleHelper = require('../../lib/google-helper');

var GOOGLE_EMAIL = 'someone@gmail.com';
var GOOGLE_PROVIDER_UID = 'google:1234';
var GOOGLE_DISPLAY_NAME = 'Hans Wurst';

var recaptchaResponse = 'a dummy recaptcha response';

// The following recaptcha key should always return ok
// See https://developers.google.com/recaptcha/docs/faq
var OK_RECATCHA_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
var OK_RECATCHA_SECRET = '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';

var STRONG_PASSWORD = 'correct horse battery staple';

var USER_PROFILE = {
    first_name: 'Hans',
    last_name: 'Wurst',
    gender: 'male',
    birthday: '08/31/1978',
    birthday_ts: 273369600000
}
var USER_PROFILE2 = {
    first_name: 'Hans2',
    last_name: 'Wurst2',
    gender: 'female',
    birthday: '11/01/2017',
    birthday_ts: 1509494400000
}

var resetDatabase = function (done) {
    dbHelper.clearDatabase(function (err) {
        done(err);
    });
};

describe('Local login after', function () {
    describe('Facebook API login first', function () {
        before(resetDatabase);

        before(function (done) {
            facebookAPISignup.call(this, done);
        });

        before(function (done) {
            localSignup.call(this, done);
        });

        it('should return 400 OK', function () {
            expect(this.res.statusCode).equal(400);
            expect(this.res.error.text).equal('{"success":false,"msg":"email already exists"}');
        });
    });
    describe('Google API login first', function () {
        before(resetDatabase);

        before(function () {
            sinon.stub(googleHelper, "verifyGoogleIdToken").returns(
                mockVerifyGoogleIdToken()
            );
        });

        after(function () {
            googleHelper.verifyGoogleIdToken.restore();
        });

        before(function (done) {
            googleAPISignup.call(this, done);
        });

        before(function (done) {
            localSignup.call(this, done);
        });

        it('should return 400 OK', function () {
                expect(this.res.statusCode).equal(400);
                expect(this.res.error.text).equal('{"success":false,"msg":"email already exists"}');
            }
        );
    });
});

describe('Facebook', function () {

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

                before(resetDatabase);

                before(function (done) {
                    facebookUISignup.call(this, done);
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
                    localSignup.call(this, done);
                });

                before(function (done) {
                    facebookUISignup.call(this, done);
                });

                it('should redirect to login with error LOGIN_INVALID_EMAIL_BECAUSE_NOT_VALIDATED_FB', function () {
                        expect(this.res.statusCode).equal(302);
                        expect(this.res.text).equal('Found. Redirecting to /ap/auth?error=LOGIN_INVALID_EMAIL_BECAUSE_NOT_VALIDATED_FB');
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
                    localSignup.call(this, done);
                });

                before(function (done) {
                    markEmailAsVerified(done);
                });

                before(function (done) {
                    facebookUISignup.call(this, done);
                });

                it('should redirect to / without error', function () {
                        expect(this.res.statusCode).equal(302);
                        expect(this.res.text).equal('Found. Redirecting to /ap/');
                    }
                );
            });

            describe('When user is in the system and log with facebook', function () {
                var self = this;
                before(function (done) {
                    recaptcha.init(OK_RECATCHA_KEY, OK_RECATCHA_SECRET);
                    done();
                });

                before(resetDatabase);

                before(function (done) {
                    localSignup.call(this, done);
                });

                before(function (done) {
                    markEmailAsVerified(done);
                });

                before(function (done) {
                    facebookUISignup.call(this, done);
                });

                before(function (done) {
                    db.User.findOne().then(function (user) {
                        self.user = user;
                    }).then(function () {
                        done();
                    });
                });

                it('Profile should be completed', function () {
                        expect(USER_PROFILE.gender).equal(self.user.gender);
                        expect(USER_PROFILE.first_name).equal(self.user.firstname);
                        expect(USER_PROFILE.last_name).equal(self.user.lastname);
                        expect(USER_PROFILE.birthday_ts).equal(self.user.date_of_birth);
                    }
                );
            });
            describe('When user is in the system with a full profile and log with facebook', function () {
                var self = this;
                before(function (done) {
                    recaptcha.init(OK_RECATCHA_KEY, OK_RECATCHA_SECRET);
                    done();
                });

                before(resetDatabase);

                before(function (done) {
                    localSignup.call(this, done);
                });

                before(function (done) {
                    markEmailAsVerified(done);
                });

                before(function (done) {
                    db.User.findOne().then(function (user) {
                        user.gender = USER_PROFILE2.gender;
                        user.firstname = USER_PROFILE2.first_name;
                        user.lastname = USER_PROFILE2.last_name;
                        user.date_of_birth = USER_PROFILE2.birthday_ts;
                        user.save().then(function () {
                            done();
                        });
                    });
                });

                before(function (done) {
                    facebookUISignup.call(this, done);
                });

                before(function (done) {
                    db.User.findOne().then(function (user) {
                        self.user = user;
                    }).then(function () {
                        done();
                    });
                });

                it('Profile should no be updated completed', function () {
                        expect(USER_PROFILE2.gender).equal(self.user.gender);
                        expect(USER_PROFILE2.first_name).equal(self.user.firstname);
                        expect(USER_PROFILE2.last_name).equal(self.user.lastname);
                        expect(USER_PROFILE2.birthday_ts).equal(self.user.date_of_birth);
                    }
                );
            });
        });
    });


    describe('POST /api/facebook/signup', function () {

        describe('When user is not in the system', function () {

            before(resetDatabase);

            before(function (done) {
                facebookAPISignup.call(this, done);
            });

            it('should return 200 OK', function () {
                    expect(this.res.body.success).equal(true);
                    expect(this.res.body.user.email).equal(GOOGLE_EMAIL);
                    expect(this.res.statusCode).equal(200);
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
                localSignup.call(this, done);
            });

            before(function (done) {
                facebookAPISignup.call(this, done);
            });

            it('should return 400 OK', function () {
                    expect(this.res.statusCode).equal(400);
                    expect(this.res.error.text).equal('{"error":"You must validate your email before connecting with Facebook"}');

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
                localSignup.call(this, done);
            });

            before(function (done) {
                markEmailAsVerified(done);
            });

            before(function (done) {
                facebookAPISignup.call(this, done);
            });

            it('should return 200 OK', function () {
                    expect(this.res.body.success).equal(true);
                    expect(this.res.body.user.email).equal(GOOGLE_EMAIL);
                    expect(this.res.statusCode).equal(200);
                }
            );
        });
        describe('When user is in the system and log with facebook', function () {
            var self = this;
            before(function (done) {
                recaptcha.init(OK_RECATCHA_KEY, OK_RECATCHA_SECRET);
                done();
            });

            before(resetDatabase);

            before(function (done) {
                localSignup.call(this, done);
            });

            before(function (done) {
                markEmailAsVerified(done);
            });

            before(function (done) {
                facebookAPISignup.call(this, done);
            });


            before(function (done) {
                db.SocialLogin.findOne({where: {email: GOOGLE_EMAIL}, include: [db.User]}).then(function (localLogin) {
                    self.user = localLogin.User;
                }).then(function () {
                    done();
                });
            });

            it('Profile should be completed', function () {
                    expect(USER_PROFILE.gender).equal(self.user.gender);
                    expect(USER_PROFILE.first_name).equal(self.user.firstname);
                    expect(USER_PROFILE.last_name).equal(self.user.lastname);
                    expect(USER_PROFILE.birthday_ts).equal(self.user.date_of_birth);
                }
            );
        });
        describe('When user is in the system with a full profile and log with facebook', function () {
            var self = this;
            before(function (done) {
                recaptcha.init(OK_RECATCHA_KEY, OK_RECATCHA_SECRET);
                done();
            });

            before(resetDatabase);

            before(function (done) {
                localSignup.call(this, done);
            });

            before(function (done) {
                markEmailAsVerified(done);
            });

            before(function (done) {
                db.User.findOne().then(function (user) {
                    user.gender = USER_PROFILE2.gender;
                    user.firstname = USER_PROFILE2.first_name;
                    user.lastname = USER_PROFILE2.last_name;
                    user.date_of_birth = USER_PROFILE2.birthday_ts;
                    user.save().then(function () {
                        done();
                    });
                });
            });

            before(function (done) {
                facebookAPISignup.call(this, done);
            });

            before(function (done) {
                db.User.findOne().then(function (user) {
                    self.user = user;
                }).then(function () {
                    done();
                });
            });

            it('Profile should no be updated completed', function () {
                    expect(USER_PROFILE2.gender).equal(self.user.gender);
                    expect(USER_PROFILE2.first_name).equal(self.user.firstname);
                    expect(USER_PROFILE2.last_name).equal(self.user.lastname);
                    expect(USER_PROFILE2.birthday_ts).equal(self.user.date_of_birth);
                }
            );
        });


    });

});

describe('Google', function () {

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

            before(resetDatabase);

            before(function (done) {
                googleUISignup.call(this, done);
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
                localSignup.call(this, done);
            });

            before(function (done) {
                googleUISignup.call(this, done);
            });

            it('should redirect to login with error LOGIN_INVALID_EMAIL_BECAUSE_NOT_VALIDATED_GOOGLE', function () {
                    expect(this.res.statusCode).equal(302);
                    expect(this.res.text).equal('Found. Redirecting to /ap/auth?error=LOGIN_INVALID_EMAIL_BECAUSE_NOT_VALIDATED_GOOGLE');
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
                localSignup.call(this, done);
            });

            before(function (done) {
                markEmailAsVerified(done);
            });

            before(function (done) {
                googleUISignup.call(this, done);
            });

            it('should redirect to / with no error', function () {
                    expect(this.res.statusCode).equal(302);
                    expect(this.res.text).equal('Found. Redirecting to /ap/');
                }
            );
        });

        describe('When user is in the system and log with google', function () {
            var self = this;
            before(function (done) {
                recaptcha.init(OK_RECATCHA_KEY, OK_RECATCHA_SECRET);
                done();
            });

            before(resetDatabase);

            before(function (done) {
                localSignup.call(this, done);
            });

            before(function (done) {
                markEmailAsVerified(done);
            });

            before(function (done) {
                googleUISignup.call(this, done);
            });

            before(function (done) {
                db.User.findOne().then(function (user) {
                    self.user = user;
                }).then(function () {
                    done();
                });
            });

            it('Profile should be completed', function () {
                    expect(USER_PROFILE.gender).equal(self.user.gender);
                    expect(USER_PROFILE.first_name).equal(self.user.firstname);
                    expect(USER_PROFILE.last_name).equal(self.user.lastname);
                }
            );
        });
        describe('When user is in the system with a full profile and log with google', function () {
            var self = this;
            before(function (done) {
                recaptcha.init(OK_RECATCHA_KEY, OK_RECATCHA_SECRET);
                done();
            });

            before(resetDatabase);

            before(function (done) {
                localSignup.call(this, done);
            });

            before(function (done) {
                markEmailAsVerified(done);
            });

            before(function (done) {
                db.User.findOne().then(function (user) {
                    user.gender = USER_PROFILE2.gender;
                    user.firstname = USER_PROFILE2.first_name;
                    user.lastname = USER_PROFILE2.last_name;
                    user.date_of_birth = USER_PROFILE2.birthday_ts;
                    user.save().then(function () {
                        done();
                    });
                });
            });

            before(function (done) {
                googleUISignup.call(this, done);
            });

            before(function (done) {
                db.User.findOne().then(function (user) {
                    self.user = user;
                }).then(function () {
                    done();
                });
            });

            it('Profile should no be updated completed', function () {
                    expect(USER_PROFILE2.gender).equal(self.user.gender);
                    expect(USER_PROFILE2.first_name).equal(self.user.firstname);
                    expect(USER_PROFILE2.last_name).equal(self.user.lastname);
                }
            );
        });

    });

    describe('POST /api/google/signup', function () {
        describe('When user is not in the system', function () {

            before(resetDatabase);

            before(function () {
                sinon.stub(googleHelper, "verifyGoogleIdToken").returns(
                    mockVerifyGoogleIdToken()
                );
            });

            after(function () {
                googleHelper.verifyGoogleIdToken.restore();
            });

            before(function (done) {
                googleAPISignup.call(this, done);
            });

            it('should return 200 OK', function () {
                    expect(this.res.statusCode).equal(200);
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
                localSignup.call(this, done);
            });

            before(function () {
                sinon.stub(googleHelper, "verifyGoogleIdToken").returns(
                    mockVerifyGoogleIdToken()
                );
            });

            after(function () {
                googleHelper.verifyGoogleIdToken.restore();
            });

            before(function (done) {
                googleAPISignup.call(this, done);

            });

            it('should return 400 OK', function () {
                    expect(this.res.statusCode).equal(400);
                    expect(this.res.error.text).equal('{"error":"You must validate your email before connecting with Google"}');
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
                localSignup.call(this, done);
            });

            before(function (done) {
                markEmailAsVerified(done);
            });

            before(function () {
                sinon.stub(googleHelper, "verifyGoogleIdToken").returns(
                    mockVerifyGoogleIdToken()
                );
            });

            after(function () {
                googleHelper.verifyGoogleIdToken.restore();
            });

            before(function (done) {
                googleAPISignup.call(this, done);

            });

            it('should return 200 OK', function () {
                    expect(this.res.body.success).equal(true);
                    expect(this.res.body.user.email).equal(GOOGLE_EMAIL);
                    expect(this.res.statusCode).equal(200);
                }
            );
        });

        describe('When user is in the system and log with google', function () {
            var self = this;
            before(function (done) {
                recaptcha.init(OK_RECATCHA_KEY, OK_RECATCHA_SECRET);
                done();
            });

            before(resetDatabase);

            before(function () {
                sinon.stub(googleHelper, "verifyGoogleIdToken").returns(
                    mockVerifyGoogleIdToken()
                );
            });

            after(function () {
                googleHelper.verifyGoogleIdToken.restore();
            });

            before(function (done) {
                localSignup.call(this, done);
            });

            before(function (done) {
                markEmailAsVerified(done);
            });

            before(function (done) {
                googleAPISignup.call(this, done);
            });


            before(function (done) {
                db.SocialLogin.findOne({where: {email: GOOGLE_EMAIL}, include: [db.User]}).then(function (localLogin) {
                    self.user = localLogin.User;
                }).then(function () {
                    done();
                });
            });

            it('Profile should be completed', function () {
                    expect(USER_PROFILE.gender).equal(self.user.gender);
                    expect(USER_PROFILE.first_name).equal(self.user.firstname);
                    expect(USER_PROFILE.last_name).equal(self.user.lastname);
                }
            );
        });
        describe('When user is in the system with a full profile and log with google', function () {
            var self = this;
            before(function (done) {
                recaptcha.init(OK_RECATCHA_KEY, OK_RECATCHA_SECRET);
                done();
            });

            before(resetDatabase);

            before(function () {
                sinon.stub(googleHelper, "verifyGoogleIdToken").returns(
                    mockVerifyGoogleIdToken()
                );
            });

            after(function () {
                googleHelper.verifyGoogleIdToken.restore();
            });

            before(function (done) {
                localSignup.call(this, done);
            });

            before(function (done) {
                markEmailAsVerified(done);
            });

            before(function (done) {
                db.User.findOne().then(function (user) {
                    user.gender = USER_PROFILE2.gender;
                    user.firstname = USER_PROFILE2.first_name;
                    user.lastname = USER_PROFILE2.last_name;
                    user.date_of_birth = USER_PROFILE2.birthday_ts;
                    user.save().then(function () {
                        done();
                    });
                });
            });

            before(function (done) {
                googleAPISignup.call(this, done);
            });

            before(function (done) {
                db.User.findOne().then(function (user) {
                    self.user = user;
                }).then(function () {
                    done();
                });
            });

            it('Profile should no be updated completed', function () {
                    expect(USER_PROFILE2.gender).equal(self.user.gender);
                    expect(USER_PROFILE2.first_name).equal(self.user.firstname);
                    expect(USER_PROFILE2.last_name).equal(self.user.lastname);
                }
            );
        });
    });

});

describe('Facebook and Google', function () {
    describe('using UI', function () {
        describe('When user is in the system and has validated his mail and add facebook and google', function () {

            var providersInDb;

            before(function (done) {
                recaptcha.init(OK_RECATCHA_KEY, OK_RECATCHA_SECRET);
                done();
            });

            before(resetDatabase);

            before(function (done) {
                localSignup.call(this, done);
            });

            before(function (done) {
                markEmailAsVerified(done);
            });

            before(function (done) {
                googleUISignup.call(this, done);

            });
            before(function (done) {
                facebookUISignup.call(this, done);

            });

            before(function (done) {
                db.SocialLogin.findOne({where: {email: GOOGLE_EMAIL}, include: [db.User]}).then(function (socialLogin) {
                    socialLoginHelper.getSocialLogins(socialLogin.User).then(function (providers) {
                        providersInDb = providers;
                        done();
                    });
                });
            });

            it('it should return 2 entries in oAuthProvider', function () {
                    expect(providersInDb.length).equal(2);
                }
            );
        });
        describe('When user is not in the system and log via google then facebook', function () {

            var providersInDb;

            before(function (done) {
                recaptcha.init(OK_RECATCHA_KEY, OK_RECATCHA_SECRET);
                done();
            });

            before(resetDatabase);


            before(function (done) {
                googleUISignup.call(this, done);

            });
            before(function (done) {
                facebookUISignup.call(this, done);

            });

            before(function (done) {
                db.SocialLogin.findOne({where: {email: GOOGLE_EMAIL}, include: [db.User]}).then(function (socialLogin) {
                    socialLoginHelper.getSocialLogins(socialLogin.User).then(function (providers) {
                        providersInDb = providers;
                        done();
                    });
                });
            });

            it('it should return 2 entries in oAuthProvider', function () {
                    expect(providersInDb.length).equal(2);
                }
            );
        });


    });
    describe('using API', function () {
        describe('When user is in the system and has validated his mail and add facebook and google', function () {

            var providersInDb;

            before(function (done) {
                recaptcha.init(OK_RECATCHA_KEY, OK_RECATCHA_SECRET);
                done();
            });

            before(resetDatabase);

            before(function (done) {
                localSignup.call(this, done);
            });

            before(function (done) {
                markEmailAsVerified(done);
            });

            before(function () {
                sinon.stub(googleHelper, "verifyGoogleIdToken").returns(
                    mockVerifyGoogleIdToken()
                );
            });

            after(function () {
                googleHelper.verifyGoogleIdToken.restore();
            });

            before(function (done) {
                googleAPISignup.call(this, done);
            });
            before(function (done) {
                facebookAPISignup.call(this, done);
            });

            before(function (done) {
                db.SocialLogin.findOne({where: {email: GOOGLE_EMAIL}, include: [db.User]}).then(function (localLogin) {
                    socialLoginHelper.getSocialLogins(localLogin.User).then(function (providers) {
                        providersInDb = providers;
                        done();
                    });
                });
            });

            it('it should return 2 entries in oAuthProvider', function () {
                    expect(providersInDb.length).equal(2);
                }
            );
        });
        describe('When user is not in the system and log via google then facebook', function () {

            var providersInDb;

            before(function (done) {
                recaptcha.init(OK_RECATCHA_KEY, OK_RECATCHA_SECRET);
                done();
            });

            before(resetDatabase);

            before(function () {
                sinon.stub(googleHelper, "verifyGoogleIdToken").returns(
                    mockVerifyGoogleIdToken()
                );
            });

            after(function () {
                googleHelper.verifyGoogleIdToken.restore();
            });

            before(function (done) {
                googleAPISignup.call(this, done);
            });
            before(function (done) {
                facebookAPISignup.call(this, done);
            });

            before(function (done) {
                db.SocialLogin.findOne({where: {email: GOOGLE_EMAIL}, include: [db.User]}).then(function (localLogin) {
                    socialLoginHelper.getSocialLogins(localLogin.User).then(function (providers) {
                        providersInDb = providers;
                        done();
                    });
                });
            });

            it('it should return 2 entries in oAuthProvider', function () {
                    expect(providersInDb.length).equal(2);
                }
            );
        });


    });
});


describe('Social login without email', function () {
    before(resetDatabase);

    before(function (done) {
        facebookUISignupNoMail.call(this, done);
    });

    it('should redirect to /ap/ 200 OK', function () {
        expect(this.res.statusCode).equal(302);
        expect(this.res.text).equal("Found. Redirecting to /ap/");
    });
});


function localSignup(done) {
    requestHelper.sendRequest(this, '/api/local/signup', {
        method: 'post',
        cookie: this.cookie,
        type: 'form',
        data: {
            email: GOOGLE_EMAIL,
            password: STRONG_PASSWORD,
            'g-recaptcha-response': recaptchaResponse
        }
    }, done);
}


function markEmailAsVerified(done) {
    db.LocalLogin.findOne({where: {login: GOOGLE_EMAIL}}).then(
        function (localLogin) {
            localLogin.updateAttributes({verified: true}).then(
                function () {
                    done();
                },
                done
            );
        },
        done
    );
}

///////////////// FB utilities

function mockFB() {
    nock('https://graph.facebook.com:443')
        .post('/oauth/access_token', "grant_type=authorization_code&redirect_uri=http%3A%2F%2Flocalhost%2Fap%2Fauth%2Ffacebook%2Fcallback&client_id=abc&client_secret=123&code=mycodeabc")
        .reply(200, {access_token: 'AccessTokenA', token_type: 'Bearer', expires_in: 3600});
    nock('https://graph.facebook.com')
        .get('/v2.5/me?fields=id%2Cemail%2Cname%2Cfirst_name%2Clast_name%2Cgender%2Cbirthday&access_token=AccessTokenA')
        .reply(200, {
            id: 'fffaaa-123',
            name: 'Cool Name',
            email: GOOGLE_EMAIL,
            first_name: USER_PROFILE.first_name,
            last_name: USER_PROFILE.last_name,
            gender: USER_PROFILE.gender,
            birthday: USER_PROFILE.birthday
        });
    nock('https://graph.facebook.com')
        .get('/me?fields=id,email,name,first_name,last_name,gender,birthday&access_token=AccessTokenA')
        .reply(200, {
            id: 'fffaaa-123',
            name: 'Cool Name',
            email: GOOGLE_EMAIL,
            first_name: USER_PROFILE.first_name,
            last_name: USER_PROFILE.last_name,
            gender: USER_PROFILE.gender,
            birthday: USER_PROFILE.birthday
        });
}


function mockFBNoMail() {
    nock('https://graph.facebook.com:443')
        .post('/oauth/access_token', "grant_type=authorization_code&redirect_uri=http%3A%2F%2Flocalhost%2Fap%2Fauth%2Ffacebook%2Fcallback&client_id=abc&client_secret=123&code=mycodeabc")
        .reply(200, {access_token: 'AccessTokenA', token_type: 'Bearer', expires_in: 3600});
    nock('https://graph.facebook.com')
        .get('/v2.5/me?fields=id%2Cemail%2Cname%2Cfirst_name%2Clast_name%2Cgender%2Cbirthday&access_token=AccessTokenA')
        .reply(200, {
            id: 'fffaaa-123',
            name: 'Cool Name',
            first_name: USER_PROFILE.first_name,
            last_name: USER_PROFILE.last_name,
            gender: USER_PROFILE.gender,
            birthday: USER_PROFILE.birthday
        });
    nock('https://graph.facebook.com')
        .get('/me?fields=id,email,name,first_name,last_name,gender,birthday&access_token=AccessTokenA')
        .reply(200, {
            id: 'fffaaa-123',
            name: 'Cool Name',
            first_name: USER_PROFILE.first_name,
            last_name: USER_PROFILE.last_name,
            gender: USER_PROFILE.gender,
            birthday: USER_PROFILE.birthday
        });
}


function facebookAPISignup(done) {
    mockFB();
    requestHelper.sendRequest(this, '/api/facebook/signup', {
        method: 'post',
        type: 'form',
        data: {
            fbToken: 'AccessTokenA'
        }
    }, done);
}

function facebookUISignup(done) {
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
}

function facebookUISignupNoMail(done) {
    mockFBNoMail();
    requestHelper.sendRequest(
        this,
        '/auth/facebook/callback?code=mycodeabc',
        {
            method: 'get',
            cookie: this.cookie
        },
        done
    );
}


///////////////// Google utilities

function mockGoogle() {
    nock('https://accounts.google.com/')
        .get('o/oauth2/v2/auth?response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fgoogle%2Fcallback&scope=profile%20email&client_id=621117323323-j048lcbv5khh6lhr1lok4vv17mekijvm.apps.googleusercontent.com')
        .reply(302);
    nock('https://www.googleapis.com')
        .post('/oauth2/v4/token').reply(200,
        {
            access_token: 'access-token-g1',
        }
    );
    nock('https://www.googleapis.com')
        .get('/plus/v1/people/me?access_token=access-token-g1').reply(200,
        {
            id: 'aa123',
            name: {familyName: USER_PROFILE.last_name, givenName: USER_PROFILE.first_name},
            gender: USER_PROFILE.gender,
            emails: [{value: GOOGLE_EMAIL, type: 'main'}]
        }
    );
    nock('https://www.googleapis.com')
        .get('/oauth2/v1/certs').reply(200,
        {
            id: 'aa123',
            name: {familyName: USER_PROFILE.last_name, givenName: USER_PROFILE.first_name},
            gender: USER_PROFILE.gender,
            emails: [{value: GOOGLE_EMAIL, type: 'main'}]
        }
    );
}

function mockVerifyGoogleIdToken() {
    return new Promise(function (resolve, reject) {
        resolve({
            provider_uid: GOOGLE_PROVIDER_UID,
            display_name: GOOGLE_DISPLAY_NAME,
            email: GOOGLE_EMAIL,
            name: {
                givenName: USER_PROFILE.first_name,
                familyName: USER_PROFILE.last_name
            },
            gender: USER_PROFILE.gender,
            birthday: null
        });
    });
}


function googleUISignup(done) {
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
}


function googleAPISignup(done) {
    mockGoogle();

    requestHelper.sendRequest(this, '/api/google/signup', {
        method: 'post',
        type: 'form',
        data: {
            idToken: 'blabla'
        }
    }, done);
}