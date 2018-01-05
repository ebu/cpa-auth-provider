"use strict";

const db = require('../../models');
const requestHelper = require('../request-helper');
const dbHelper = require('../db-helper');
const oauthHelper = require('../oauth-helper');

const CLIENT = {
    id: 1,
    client_id: "ClientA",
    client_secret: "ClientSecret",
    name: "OAuth 2.0 Client",
    redirect_uri: 'http://localhost'
};
const USER1 = {
    id: 123,
    email: 'test@test.com',
    account_uid: 'RandomUid',
    password: 'a'
};

const USER2 = {
    id: 234,
    email: 'some@one.else',
    account_uid: 'AnotherUid',
    password: 'b'
};

function resetDatabase(done) {
    return dbHelper.clearDatabase(
        function (err) {
            if (err) {
                return done(err);
            } else {
                oauthHelper.createOAuth2Clients([CLIENT]).then(
                    () => {
                        return oauthHelper.createUsers([USER1, USER2])
                    }
                ).then(
                    () => {
                        done();
                    }
                ).catch(
                    done
                )
            }
        }
    );
}

describe('POST /email/change', function () {
    const URL = '/email/change';

    context('with correct information', function () {
        before(resetDatabase);
        before(oauthHelper.getAccessToken(USER1.email, USER1, CLIENT));
        before(function (done) {
            this.accessToken = this.res.body.access_token;
            requestHelper.sendRequest(
                this,
                URL,
                {
                    method: 'post',
                    cookie: this.cookie,
                    accessToken: this.accessToken,
                    tokenType: 'Bearer',
                    data: {
                        new_email: 'new_email@second.org',
                        password: USER1.password,
                    },
                    type: 'form'
                },
                done
            );
        });

        it('should report a success', function () {
            expect(this.res.statusCode).equal(200);
            expect(this.res.body.success).equal(true);
        });

        it('should have generated a token', function (done) {
            db.UserEmailToken.findOne({where: {user_id: USER1.id, oauth2_client_id: CLIENT.id}}).then(
                function (token) {
                    expect(token).a('object');
                    expect(token.type).match(/^MOV\$/);
                    done();
                }
            ).catch(done);
        });
    });

    context('trying with a wrong password', function () {
        before(resetDatabase);
        before(oauthHelper.getAccessToken(USER1.email, USER1, CLIENT));
        before(function (done) {
            this.accessToken = this.res.body.access_token;
            requestHelper.sendRequest(
                this,
                URL,
                {
                    method: 'post',
                    cookie: this.cookie,
                    accessToken: this.accessToken,
                    tokenType: 'Bearer',
                    data: {
                        new_email: 'new_email@second.org',
                        password: USER1.password + 'madeWrong!',
                    },
                    type: 'form'
                },
                done
            );
        });

        it('should report a failure forbidden', function () {
            expect(this.res.statusCode).equal(403);
            expect(this.res.body.success).equal(false);
            expect(this.res.body.reason).equal('WRONG_PASSWORD');
        });

        it('should not have generated a token', function (done) {
            db.UserEmailToken.findOne({where: {user_id: USER1.id, oauth2_client_id: CLIENT.id}}).then(
                function (token) {
                    expect(token).equal(null);
                    done();
                }
            ).catch(done)
        });
    });

    context('trying to set an already chosen email', function () {
        before(resetDatabase);
        before(oauthHelper.getAccessToken(USER1.email, USER1, CLIENT));
        before(function (done) {
            this.accessToken = this.res.body.access_token;
            requestHelper.sendRequest(
                this,
                URL,
                {
                    method: 'post',
                    cookie: this.cookie,
                    accessToken: this.accessToken,
                    tokenType: 'Bearer',
                    data: {
                        new_email: USER2.email,
                        password: USER1.password,
                    },
                    type: 'form'
                },
                done
            );
        });

        it('should report a failure email token', function () {
            expect(this.res.statusCode).equal(400);
            expect(this.res.body.success).equal(false);
            expect(this.res.body.reason).equal('EMAIL_ALREADY_TAKEN');
        });

        it('should not have generated a token', function (done) {
            db.UserEmailToken.findOne({where: {user_id: USER1.id, oauth2_client_id: CLIENT.id}}).then(
                function (token) {
                    expect(token).equal(null);
                    done();
                }
            ).catch(done)
        });
    });

    context('trying five times', function () {
        before(resetDatabase);
        before(oauthHelper.getAccessToken(USER1.email, USER1, CLIENT));

        before(function () {
            this.accessToken = this.res.body.access_token;
        });
        before(requestNewEmail('n1@one.org'));
        before(requestNewEmail('n2@two.org'));
        before(requestNewEmail('n3@three.org'));
        before(requestNewEmail('n4@four.org'));
        before(requestNewEmail('n5@five.org'));

        it('should report a success', function () {
            expect(this.res.statusCode).equal(200);
            expect(this.res.body.success).equal(true);
        });

        it('should have five tokens', function (done) {
            db.UserEmailToken.count({where: {user_id: USER1.id, oauth2_client_id: CLIENT.id}}).then(
                function (count) {
                    expect(count).equal(5);
                    done();
                }
            ).catch(done)
        });
    });


    context('trying too often', function () {
        before(resetDatabase);
        before(oauthHelper.getAccessToken(USER1.email, USER1, CLIENT));

        before(function () {
            this.accessToken = this.res.body.access_token;
        });
        before(requestNewEmail('n1@one.org'));
        before(requestNewEmail('n2@two.org'));
        before(requestNewEmail('n3@three.org'));
        before(requestNewEmail('n4@four.org'));
        before(requestNewEmail('n5@five.org'));
        before(requestNewEmail('n6@six.org'));

        it('should report a failure', function () {
            expect(this.res.statusCode).equal(429);
            expect(this.res.body.success).equal(false);
        });

        it('should have five tokens', function (done) {
            db.UserEmailToken.count({where: {user_id: USER1.id, oauth2_client_id: CLIENT.id}}).then(
                function (count) {
                    expect(count).equal(5);
                    done();
                }
            ).catch(done)
        });
    });

    function requestNewEmail(email) {
        return function (done) {
            requestHelper.sendRequest(
                this,
                URL,
                {
                    method: 'post',
                    cookie: this.cookie,
                    accessToken: this.accessToken,
                    tokenType: 'Bearer',
                    data: {
                        new_email: email,
                        password: USER1.password,
                    },
                    type: 'form'
                },
                done
            );
        };
    }
});

describe('GET /email/move/:token', function () {
    const URL = '/email/move/{token}';
    const NEW_EMAIL = 'number2@second.org';

    context('with correct token', function () {
        before(resetDatabase);
        before(createToken('ABC', NEW_EMAIL, USER1, CLIENT));
        before(function (done) {
            requestHelper.sendRequest(
                this,
                URL.replace(/{token}/, 'ABC'),
                {
                    method: 'get',
                    cookie: this.cookie,
                    accessToken: this.accessToken,
                },
                done
            );
        });

        it('should send success status', function () {
            expect(this.res.statusCode).equal(200);
        });

        it('should change the email', function (done) {
            db.LocalLogin.findOne({where: {login: NEW_EMAIL}}).then(
                function (localLogin) {
                    expect(localLogin).a('object');
                    expect(localLogin.user_id).equal(USER1.id);
                    done();
                }
            ).catch(done);
        });
    });

    context('using a correct token twice', function () {
        before(resetDatabase);
        before(createToken('ABC', NEW_EMAIL, USER1, CLIENT));
        before(function (done) {
            requestHelper.sendRequest(
                this,
                URL.replace(/{token}/, 'ABC'),
                {
                    method: 'get',
                    cookie: this.cookie,
                    accessToken: this.accessToken,
                },
                done
            );
        });

        before(function (done) {
            requestHelper.sendRequest(
                this,
                URL.replace(/{token}/, 'ABC'),
                {
                    method: 'get',
                    cookie: this.cookie,
                    accessToken: this.accessToken,
                },
                done
            );
        });

        it('should send success status', function () {
            expect(this.res.statusCode).equal(200);
        });

        it('should have changed the email', function (done) {
            db.LocalLogin.findOne({where: {login: NEW_EMAIL}}).then(
                function (localLogin) {
                    expect(localLogin).a('object');
                    expect(localLogin.user_id).equal(USER1.id);
                    expect(localLogin.verified).equal(true);
                    done();
                }
            ).catch(done);
        });
    });

    context('using the wrong kind of token', function () {
        before(resetDatabase);
        before(createToken('ABC', NEW_EMAIL, USER1, CLIENT));
        before(function (done) {
            db.UserEmailToken.create(
                {
                    user_id: USER1.id,
                    oauth2_client_id: CLIENT.id,
                    key: 'f42',
                    type: 'DEL',
                    redirect_uri: CLIENT.redirect_uri
                }
            ).then(
                function () {
                    done();
                },
                done
            );
        });
        before(function (done) {
            requestHelper.sendRequest(
                this,
                URL.replace(/{token}/, 'f42'),
                {
                    method: 'get',
                    cookie: this.cookie,
                    accessToken: this.accessToken,
                },
                done
            );
        });

        it('should report a failure', function () {
            expect(this.res.statusCode).equal(200);
            expect(this.res.text.indexOf("Invalid token for authentication") > 0).equal(true);
        });

        it('should not have changed the email', function (done) {
            db.LocalLogin.findOne({where: {user_id: USER1.id}}).then(
                function (localLogin) {
                    expect(localLogin).a('object');
                    expect(localLogin.login).equal(USER1.email);
                    done();
                }
            ).catch(done);
        });
    });


    function createToken(key, address, user, client) {
        return function (done) {
            db.UserEmailToken.create(
                {
                    user_id: user.id,
                    oauth2_client_id: client.id,
                    key: key,
                    type: 'MOV$' + address,
                    redirect_uri: client.redirect_uri
                }
            ).then(
                function (t) {
                    done();
                },
                done
            );
        }
    }
});