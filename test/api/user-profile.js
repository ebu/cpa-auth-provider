"use strict";

var generate = require('../../lib/generate');
var db = require('../../models');
var requestHelper = require('../request-helper');
var dbHelper = require('../db-helper');

var resetDatabase = function (done) {
    return dbHelper.clearDatabase(function (err) {
        return dbHelper.createFakeUser({id: 1337, email: USER_EMAIL, password: STRONG_PASSWORD}, done);
    });
};

// Test get profile after account creation
var recaptchaResponse = 'a dummy recaptcha response';
var USER_EMAIL = 'test@somewhe.re';
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
            expect(this.res.statusCode).to.equal(200);
            expect(this.res.body.success).to.equal(true);
            expect(this.res.body.user_profile.firstname).null;
            expect(this.res.body.user_profile.lastname).null;
            expect(this.res.body.user_profile.gender).null;
            expect(this.res.body.user_profile.date_of_birth).null;
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
                        date_of_birth: birth
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
    });

    context('When user checks the fields', function () {
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
                        date_of_birth: birth
                    },
                    accessToken: accessToken,
                    tokenType: 'JWT'
                }, done
            );
        });


        before(function (done) {
            requestHelper.sendRequest(this, '/api/local/profile?policy=FIRSTNAME_LASTNAME', {
                method: 'get',
                accessToken: accessToken,
                tokenType: 'JWT'
            }, done);
        });

        it('get profile should return a success ', function () {
            expect(this.res.statusCode).to.equal(200);
            expect(this.res.body.success).to.equal(true);
            expect(this.res.body.user_profile.firstname).to.equal('emile');
            expect(this.res.body.user_profile.lastname).to.equal('zola');
            expect(this.res.body.user_profile.gender).to.equal('male');
            expect(this.res.body.user_profile.date_of_birth).to.equals(birth);
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

        context('Bad date_of_birth (not a number)', function () {

            cleanDbAndRegisterUser();

            before(function (done) {
                var accessToken = this.res.body.token.substring(4, this.res.body.token.size);
                requestHelper.sendRequest(this, '/api/local/profile', {
                        method: 'put',
                        type: 'json',
                        data: {date_of_birth: 'not a number'},
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
                        data: {firstname: '42'},
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

        context('a complex name is set (successfully)', function () {
            before(resetDatabase);

            before(function (done) {
                requestHelper.sendRequest(this, '/api/local/authenticate/jwt', {
                    method: 'post',
                    cookie: this.cookie,
                    type: 'form',
                    data: {
                        email: USER_EMAIL,
                        password: STRONG_PASSWORD
                    }
                }, done);
            });

            before(function (done) {
                var accessToken = this.res.body.token.substring(4, this.res.body.token.size);
                requestHelper.sendRequest(this, '/api/local/profile', {
                        method: 'put',
                        type: 'json',
                        data: {
                            firstname: 'Adélè-Cëçilä',
                            lastname: "von Höheñlohé",
                            gender: 'other',
                            date_of_birth: 249782400000
                        },
                        accessToken: accessToken,
                        tokenType: 'Bearer'
                    }, done
                );
            });

            it('should accept the change', function () {
                expect(this.res.statusCode).equal(200);
                expect(this.res.body.success).equal(true);
            });
        });
    });

    context('When user request tries to save a profile', function () {
        var userHelper = require('../../lib/user-helper');
        var config = require('../../config');

        context('while gender and date of birth are required', function () {
            var preFields;
            before(function () {
                preFields = config.userProfiles.requiredFields;
                config.userProfiles.requiredFields = ['date_of_birth', 'gender'];
                userHelper.reloadConfig();
            });
            after(function () {
                config.userProfiles.requiredFields = preFields;
                userHelper.reloadConfig();
            });

            context('everything is correctly set at once (female)', function () {
                before(resetDatabase);

                before(function (done) {
                    requestHelper.sendRequest(this, '/api/local/authenticate/jwt', {
                        method: 'post',
                        cookie: this.cookie,
                        type: 'form',
                        data: {
                            email: USER_EMAIL,
                            password: STRONG_PASSWORD
                        }
                    }, done);
                });

                before(function (done) {
                    var accessToken = this.res.body.token.substring(4, this.res.body.token.size);
                    requestHelper.sendRequest(this, '/api/local/profile', {
                            method: 'put',
                            type: 'json',
                            data: {gender: 'female', date_of_birth: 249782400000},
                            accessToken: accessToken,
                            tokenType: 'Bearer'
                        }, done
                    );
                });

                it('should accept the change', function () {
                    expect(this.res.statusCode).equal(200);
                    expect(this.res.body.success).equal(true);
                });
            });

            context('everything is correctly set at once (male)', function () {
                before(resetDatabase);

                before(function (done) {
                    requestHelper.sendRequest(this, '/api/local/authenticate/jwt', {
                        method: 'post',
                        cookie: this.cookie,
                        type: 'form',
                        data: {
                            email: USER_EMAIL,
                            password: STRONG_PASSWORD
                        }
                    }, done);
                });

                before(function (done) {
                    var accessToken = this.res.body.token.substring(4, this.res.body.token.size);
                    requestHelper.sendRequest(this, '/api/local/profile', {
                            method: 'put',
                            type: 'json',
                            data: {gender: 'male', date_of_birth: 249782400000},
                            accessToken: accessToken,
                            tokenType: 'Bearer'
                        }, done
                    );
                });

                it('should accept the change', function () {
                    expect(this.res.statusCode).equal(200);
                    expect(this.res.body.success).equal(true);
                });
            });

            context('everything is correctly set at once (gender other)', function () {
                before(resetDatabase);

                before(function (done) {
                    requestHelper.sendRequest(this, '/api/local/authenticate/jwt', {
                        method: 'post',
                        cookie: this.cookie,
                        type: 'form',
                        data: {
                            email: USER_EMAIL,
                            password: STRONG_PASSWORD
                        }
                    }, done);
                });

                before(function (done) {
                    var accessToken = this.res.body.token.substring(4, this.res.body.token.size);
                    requestHelper.sendRequest(this, '/api/local/profile', {
                            method: 'put',
                            type: 'json',
                            data: {gender: 'other', date_of_birth: 249782400000},
                            accessToken: accessToken,
                            tokenType: 'Bearer'
                        }, done
                    );
                });

                it('should accept the change', function () {
                    expect(this.res.statusCode).equal(200);
                    expect(this.res.body.success).equal(true);
                });
            });

            context('a field is updated after required fields are set', function () {
                var accessToken;
                before(resetDatabase);

                before(function (done) {
                    requestHelper.sendRequest(this, '/api/local/authenticate/jwt', {
                        method: 'post',
                        cookie: this.cookie,
                        type: 'form',
                        data: {
                            email: USER_EMAIL,
                            password: STRONG_PASSWORD
                        }
                    }, done);
                });

                before(function (done) {
                    accessToken = this.res.body.token.substring(4, this.res.body.token.size);
                    requestHelper.sendRequest(this, '/api/local/profile', {
                            method: 'put',
                            type: 'json',
                            data: {gender: 'female', date_of_birth: '249782400000'},
                            accessToken: accessToken,
                            tokenType: 'Bearer'
                        }, done
                    );
                });

                before(function (done) {
                    requestHelper.sendRequest(this, '/api/local/profile', {
                            method: 'put',
                            type: 'json',
                            data: {gender: 'male'},
                            accessToken: accessToken,
                            tokenType: 'Bearer'
                        }, done
                    );
                });

                it('should accept the change', function () {
                    expect(this.res.statusCode).equal(200);
                    expect(this.res.body.success).equal(true);
                });
            });

            context('missing gender', function () {
                before(resetDatabase);

                before(function (done) {
                    requestHelper.sendRequest(this, '/api/local/authenticate/jwt', {
                        method: 'post',
                        cookie: this.cookie,
                        type: 'form',
                        data: {
                            email: USER_EMAIL,
                            password: STRONG_PASSWORD
                        }
                    }, done);
                });

                before(function (done) {
                    var accessToken = this.res.body.token.substring(4, this.res.body.token.size);
                    requestHelper.sendRequest(this, '/api/local/profile', {
                            method: 'put',
                            type: 'json',
                            data: {date_of_birth: 249782400000, firstname: 'benedict'},
                            accessToken: accessToken,
                            tokenType: 'Bearer'
                        }, done
                    );
                });

                it('should return bad parameters ', function () {
                    expect(this.res.statusCode).equal(400);
                    expect(this.res.body.success).equal(false);
                });

                it('should properly describe the missing field', function () {
                    expect(this.res.body.missingFields).members(['gender']);
                });
            });

            context('after first setting it badly, it can still be set properly', function () {
                var accessToken;
                before(resetDatabase);

                before(function (done) {
                    requestHelper.sendRequest(this, '/api/local/authenticate/jwt', {
                        method: 'post',
                        cookie: this.cookie,
                        type: 'form',
                        data: {
                            email: USER_EMAIL,
                            password: STRONG_PASSWORD
                        }
                    }, done);
                });

                before(function (done) {
                    accessToken = this.res.body.token.substring(4, this.res.body.token.size);
                    requestHelper.sendRequest(this, '/api/local/profile', {
                            method: 'put',
                            type: 'json',
                            data: {date_of_birth: 'not a number'},
                            accessToken: accessToken,
                            tokenType: 'Bearer'
                        }, done
                    );
                });

                before(function (done) {
                    requestHelper.sendRequest(this, '/api/local/profile', {
                            method: 'put',
                            type: 'json',
                            data: {gender: 'female', date_of_birth: '249782400000'},
                            accessToken: accessToken,
                            tokenType: 'Bearer'
                        }, done
                    );
                });

                it('should accept the second change', function () {
                    expect(this.res.statusCode).equal(200);
                    expect(this.res.body.success).equal(true);
                });
            });
        });
    });
});

describe('GET /api/local/profile/required-config', function () {
    var URL = '/api/local/profile/required-config';
    var userHelper = require('../../lib/user-helper');
    var config = require('../../config');

    context('for no required fields', function () {
        context('normal request', function () {
            before(doGet(URL));

            it('should return json object with all possible fields', function () {
                expect(this.res.statusCode).equal(200);
                expect(this.res.body).eql(
                    {
                        fields: {
                            "gender": false,
                            "date_of_birth": false,
                            "firstname": false,
                            "lastname": false,
                            "language": false
                        },
                        providers: [
                            "facebook",
                            "google",
                            "local"
                        ]
                    }
                );
            });
        });

        context('array request', function () {
            before(doGet(URL + '?array'));

            it('should return an empty json list', function () {
                expect(this.res.statusCode).equal(200);
                expect(this.res.body).empty;
            });
        });
    });

    context('for gender and date of birth as required fields', function () {
        var preReq;
        before(function () {
            preReq = config.userProfiles.requiredFields;
            config.userProfiles.requiredFields = ['date_of_birth', 'gender'];
            userHelper.reloadConfig();
        });
        after(function () {
            config.userProfiles.requiredFields = preReq;
            userHelper.reloadConfig();
        });
        context('normal request', function () {
            before(doGet(URL));

            it('should return json object with the fields gender and date_of_birth true', function () {
                expect(this.res.statusCode).equal(200);
                expect(this.res.body).eql(
                    {
                        fields: {
                            "gender": true,
                            "date_of_birth": true,
                            "firstname": false,
                            "lastname": false,
                            "language": false
                        },
                        providers: [
                            "facebook",
                            "google",
                            "local"
                        ]
                    }
                );
            });
        });

        context('array request', function () {
            before(doGet(URL + '?array'));

            it('should return an empty json list', function () {
                expect(this.res.statusCode).equal(200);
                expect(this.res.body).members(['date_of_birth', 'gender']);
            });
        });
    });


    function doGet(url) {
        return function (done) {
            requestHelper.sendRequest(this, url, {method: 'get'}, done);
        }
    }
});

describe('PUT /user/profile', function () {
    var URL = '/user/profile';
    var userHelper = require('../../lib/user-helper');
    var config = require('../../config');

    context('for required fields date_of_birth,firstname', function () {
        var preReq;
        before(function () {
            preReq = config.userProfiles.requiredFields;
            config.userProfiles.requiredFields = ['date_of_birth', 'gender'];
            userHelper.reloadConfig();
        });
        after(function () {
            config.userProfiles.requiredFields = preReq;
            userHelper.reloadConfig();
        });

        context('doing everything correctly', function () {
            before(resetDatabase);
            before(function (done) {
                requestHelper.loginCustom(USER_EMAIL, STRONG_PASSWORD, this, done);
            });

            before(function (done) {
                requestHelper.sendRequest(
                    this,
                    URL,
                    {
                        method: 'put',
                        cookie: this.cookie,
                        type: 'form',
                        data: {
                            date_of_birth: '12345',
                            gender: 'other',
                            firstname: 'Trûdì',
                        }
                    },
                    done
                );
            });

            it('should return a success', function () {
                expect(this.res.statusCode).equal(200);
                expect(this.res.body.msg).equal('Profile updated.');
            });
        });

        context('empty date_of_birth', function () {
            before(resetDatabase);
            before(function (done) {
                requestHelper.loginCustom(USER_EMAIL, STRONG_PASSWORD, this, done)
            });

            before(function (done) {
                requestHelper.sendRequest(
                    this,
                    URL,
                    {
                        method: 'put',
                        cookie: this.cookie,
                        type: 'form',
                        data: {
                            date_of_birth: '',
                            gender: 'other',
                            firstname: 'Trûdì',
                        }
                    },
                    done
                );
            });

            it('should fail with one error message', function () {
                expect(this.res.statusCode).equal(400);
                expect(this.res.body.errors).a('array');
                expect(this.res.body.errors.length).equal(1);
                expect(this.res.body.errors[0]).eql({
                    param: 'date_of_birth',
                    msg: '\'Date of birth\' is empty or invalid',
                    value: ''
                });
            });
        });
    });
});
