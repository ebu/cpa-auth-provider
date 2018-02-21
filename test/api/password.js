"use strict";

var db = require('../../models');
var requestHelper = require('../request-helper');
var dbHelper = require('../db-helper');


var CLIENT = {
    id: 1,
    client_id: "ClientA",
    client_secret: "ClientSecret",
    name: "OAuth 2.0 Client",
    redirect_uri: 'http://localhost'
};
var USER = {
    id: 123,
    email: 'test@test.com',
    verified: true,
    account_uid: 'RandomUid',
    password: 'a'
};

var USER2 = {
    id: 234,
    email: 'some@one.else',
    verified: true,
    account_uid: 'AnotherUid',
    password: 'b'
};

var UNVERIFIED_USER = {
    id: 345,
    email: 'unknown@no.where',
    verified: false,
    account_uid: 'YetAnotherUid',
    password: 'c'
};

function createOAuth2Client(done) {
    db.OAuth2Client.create(CLIENT).then(
        function () {
            return done();
        },
        function (err) {
            return done(err);
        }
    );
}

function createUser(userTemplate) {
    return new Promise(
        function (resolve, reject) {
            db.User.create(userTemplate).then(
                function (user) {
                    return db.LocalLogin.create(
                        {
                            user_id: user.id,
                            login: userTemplate.email,
                            verified: userTemplate.verified,
                        });
                }
            ).then(
                function (login) {
                    return login.setPassword(userTemplate.password);
                }
            ).then(
                () => {
                    resolve();
                }
            ).catch(reject);
        }
    );
}

function createFakeUser(done) {
    createUser(USER).then(
        function () {
            return createUser(USER2);
        }
    ).then(
        function () {
            return createUser(UNVERIFIED_USER);
        }
    ).then(
        function () {
            return done();
        }
    ).catch(done);
}

var resetDatabase = function (done) {
    dbHelper.clearDatabase(function (err) {
        if (err) {
            return done(err);
        } else {
            createOAuth2Client(
                function () {
                    done();
                }
            );
        }
    });
};

// test password
describe('POST /user/password', function () {
    var url = '/user/password';

    context('without a client_id', function () {
        before(resetDatabase);
        before(createFakeUser);

        before(function (done) {
            requestHelper.sendRequest(this, url, {
                method: 'post',
                cookie: this.cookie,
                type: 'form',
                data: {
                    request_type: 'set-password',
                    username: USER.email,
                    current_password: USER.password,
                    new_password: 'ComplexNewPassword'
                }
            }, done);
        });

        it('should reject the request', function () {
            expect(this.res.statusCode).equal(400);
        });
    });

    // ---------------------------------------------------------------------
    // -- SET-PASSWORD
    // ---------------------------------------------------------------------
    context('request_type \'set-password\'', function () {
        context('with wrong current password', function () {
            before(resetDatabase);
            before(createFakeUser);

            before(function (done) {
                requestHelper.sendRequest(this, url, {
                    method: 'post',
                    cookie: this.cookie,
                    type: 'form',
                    data: {
                        client_id: CLIENT.client_id,
                        request_type: 'set-password',
                        username: USER.email,
                        current_password: USER2.password,
                        new_password: 'ComplexNewPassword'
                    }
                }, done);
            });

            it('should reject the request', function () {
                expect(this.res.statusCode).equal(400);
            });
        });

        context('with unknown username', function () {
            before(resetDatabase);
            before(createFakeUser);

            before(function (done) {
                requestHelper.sendRequest(this, url, {
                    method: 'post',
                    cookie: this.cookie,
                    type: 'form',
                    data: {
                        client_id: CLIENT.client_id,
                        request_type: 'set-password',
                        username: 'somethingextra' + USER.email,
                        current_password: USER.password,
                        new_password: 'ComplexNewPassword'
                    }
                }, done);
            });

            it('should reject the request', function () {
                expect(this.res.statusCode).equal(400);
            });
        });

        context('with proper authentication', function () {
            before(resetDatabase);
            before(createFakeUser);

            before(function (done) {
                requestHelper.sendRequest(this, url, {
                    method: 'post',
                    cookie: this.cookie,
                    type: 'form',
                    data: {
                        client_id: CLIENT.client_id,
                        request_type: 'set-password',
                        username: USER.email,
                        current_password: USER.password,
                        new_password: 'ComplexNewPassword'
                    }
                }, done);
            });

            it('should return status 200', function () {
                expect(this.res.statusCode).equal(200);
            });

            it('should send success', function () {
                expect(this.res.body.success).equal(true);
            });
        });

        context('with proper authentication for 2nd user', function () {
            before(resetDatabase);
            before(createFakeUser);

            before(function (done) {
                requestHelper.sendRequest(this, url, {
                    method: 'post',
                    cookie: this.cookie,
                    type: 'form',
                    data: {
                        client_id: CLIENT.client_id,
                        request_type: 'set-password',
                        username: USER2.email,
                        current_password: USER2.password,
                        new_password: 'AnotherNewPassword'
                    }
                }, done);
            });

            it('should return status 200', function () {
                expect(this.res.statusCode).equal(200);
            });

            it('should send success', function () {
                expect(this.res.body.success).equal(true);
            });
        });

        context('with proper authentication for unverified user', function () {
            before(resetDatabase);
            before(createFakeUser);

            before(function (done) {
                requestHelper.sendRequest(this, url, {
                    method: 'post',
                    cookie: this.cookie,
                    type: 'form',
                    data: {
                        client_id: CLIENT.client_id,
                        request_type: 'set-password',
                        username: UNVERIFIED_USER.email,
                        current_password: UNVERIFIED_USER.password,
                        new_password: 'AnotherNewPassword'
                    }
                }, done);
            });

            it('should return status 200', function () {
                expect(this.res.statusCode).equal(200);
            });

            it('should send success', function () {
                expect(this.res.body.success).equal(true);
            });
        });
    });

    // ---------------------------------------------------------------------
    // -- REQUEST-PASSWORD-EMAIL
    // ---------------------------------------------------------------------
    context('request_type \'request-password-email\'', function () {
        context('with unknown username', function () {
            before(resetDatabase);
            before(createFakeUser);

            before(function (done) {
                requestHelper.sendRequest(this, url, {
                    method: 'post',
                    cookie: this.cookie,
                    type: 'form',
                    data: {
                        client_id: CLIENT.client_id,
                        request_type: 'request-password-email',
                        username: 'wrong' + USER.email
                    }
                }, done);
            });

            it('should reject the request', function () {
                expect(this.res.statusCode).equal(400);
            });

            it('should give USER_NOT_FOUND message', function () {
                expect(this.res.body.success).equal(false);
                expect(this.res.body.reason).equal('USER_NOT_FOUND');
            });
        });

        context('with proper username for verified user', function () {
            before(resetDatabase);
            before(createFakeUser);

            before(function (done) {
                requestHelper.sendRequest(this, url, {
                    method: 'post',
                    cookie: this.cookie,
                    type: 'form',
                    data: {
                        client_id: CLIENT.client_id,
                        request_type: 'request-password-email',
                        username: USER.email
                    }
                }, done);
            });

            it('should return status 200', function () {
                expect(this.res.statusCode).equal(200);
            });

            it('should send success', function () {
                expect(this.res.body.success).equal(true);
            });

            it('should have created a token', function (done) {
                db.UserEmailToken.findOne({where: {user_id: USER.id, oauth2_client_id: CLIENT.id}}).then(
                    function (token) {
                        expect(token).a('Object');
                        expect(token.type).equal('PWD');
                        done();
                    },
                    done
                )
            });
        });

        context('with proper username for 2nd user', function () {
            before(resetDatabase);
            before(createFakeUser);

            before(function (done) {
                requestHelper.sendRequest(this, url, {
                    method: 'post',
                    cookie: this.cookie,
                    type: 'form',
                    data: {
                        client_id: CLIENT.client_id,
                        request_type: 'request-password-email',
                        username: USER2.email
                    }
                }, done);
            });

            it('should return status 200', function () {
                expect(this.res.statusCode).equal(200);
            });

            it('should send success', function () {
                expect(this.res.body.success).equal(true);
            });
        });

        context('with proper username for unverified user', function () {
            before(resetDatabase);
            before(createFakeUser);

            before(function (done) {
                requestHelper.sendRequest(this, url, {
                    method: 'post',
                    cookie: this.cookie,
                    type: 'form',
                    data: {
                        client_id: CLIENT.client_id,
                        request_type: 'request-password-email',
                        username: UNVERIFIED_USER.email
                    }
                }, done);
            });

            it('should return status 200', function () {
                expect(this.res.statusCode).equal(200);
            });

            it('should send success true', function () {
                expect(this.res.body.success).equal(true);
            });
        });
    });


    // ---------------------------------------------------------------------
    // -- FORCE-PASSWORD
    // ---------------------------------------------------------------------
    context('request_type \'force-password\'', function () {
        context('with invalid token', function () {
            before(resetDatabase);
            before(createFakeUser);

            before(function (done) {
                requestHelper.sendRequest(this, url, {
                    method: 'post',
                    cookie: this.cookie,
                    type: 'form',
                    data: {
                        client_id: CLIENT.client_id,
                        token: 'JustGuessing!',
                        request_type: 'force-password',
                        new_password: 'FancyNewPasswordIsCreative!'
                    }
                }, done);
            });

            it('should reject the request', function () {
                expect(this.res.statusCode).equal(400);
            });

            it('should give USER_NOT_FOUND message', function () {
                expect(this.res.body.success).equal(false);
                expect(this.res.body.reason).equal('INVALID_TOKEN');
            });
        });

        context('with proper token for user', function () {
            const RANDOM_KEY = 'SuperRandomKeyForAToken';
            const NEW_PASSWORD = 'FancyNewPasswordIsCreative!';
            before(resetDatabase);
            before(createFakeUser);

            before(function (done) {
                db.UserEmailToken.create(
                    {
                        key: RANDOM_KEY,
                        type: 'PWD',
                        user_id: USER.id,
                        redirect_uri: CLIENT.redirect_uri,
                        oauth2_client_id: CLIENT.id
                    }
                ).then(
                    function () {
                        done();
                    },
                    done
                )
            });

            before(function (done) {
                requestHelper.sendRequest(this, url, {
                    method: 'post',
                    cookie: this.cookie,
                    type: 'form',
                    data: {
                        client_id: CLIENT.client_id,
                        token: RANDOM_KEY,
                        request_type: 'force-password',
                        new_password: NEW_PASSWORD
                    }
                }, done);
            });

            it('should return status 200', function () {
                expect(this.res.statusCode).equal(200);
            });

            it('should send success', function () {
                expect(this.res.body.success).equal(true);
            });

            it('should have changed the password', function (done) {
                db.LocalLogin.findOne({where: {user_id: USER.id}}).then(
                    function (localLogin) {
                        expect(localLogin).a('Object');
                        return localLogin.verifyPassword(NEW_PASSWORD);
                    }
                ).then(
                    function (success) {
                        expect(success).equal(true);
                        done();
                    }
                ).catch(done);
            });

            it('other users password should not have changed', function (done) {
                db.LocalLogin.findOne({where: {user_id: USER2.id}}).then(
                    function (localLogin) {
                        expect(localLogin).a('Object');
                        return localLogin.verifyPassword(USER2.password);
                    }
                ).then(
                    function (success) {
                        expect(success).equal(true);
                        done();
                    }
                ).catch(done);
            });
        });

        context('with proper token for second user', function () {
            const RANDOM_KEY = '1234567890abcdef';
            const NEW_PASSWORD = 'SuperElegant-And*Totally*N0nGuessablePassword';
            before(resetDatabase);
            before(createFakeUser);

            before(function (done) {
                db.UserEmailToken.create(
                    {
                        key: RANDOM_KEY,
                        type: 'PWD',
                        user_id: USER2.id,
                        redirect_uri: CLIENT.redirect_uri,
                        oauth2_client_id: CLIENT.id
                    }
                ).then(
                    function () {
                        done();
                    },
                    done
                )
            });

            before(function (done) {
                requestHelper.sendRequest(this, url, {
                    method: 'post',
                    cookie: this.cookie,
                    type: 'form',
                    data: {
                        client_id: CLIENT.client_id,
                        token: RANDOM_KEY,
                        request_type: 'force-password',
                        new_password: NEW_PASSWORD,
                    }
                }, done);
            });

            it('should return status 200', function () {
                expect(this.res.statusCode).equal(200);
            });

            it('should send success', function () {
                expect(this.res.body.success).equal(true);
            });

            it('should have changed the password', function (done) {
                db.LocalLogin.findOne({where: {user_id: USER2.id}}).then(
                    function (localLogin) {
                        expect(localLogin).a('Object');
                        return localLogin.verifyPassword(NEW_PASSWORD);
                    }
                ).then(
                    function (success) {
                        expect(success).equal(true);
                        done();
                    }
                ).catch(done);
            });

            it('other users password should not have changed', function (done) {
                db.LocalLogin.findOne({where: {user_id: USER.id}}).then(
                    function (localLogin) {
                        expect(localLogin).a('Object');
                        return localLogin.verifyPassword(USER.password);
                    }
                ).then(
                    function (success) {
                        expect(success).equal(true);
                        done();
                    }
                ).catch(done);
            });
        });
    });
});
