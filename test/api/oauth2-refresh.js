"use strict";

var generate = require('../../lib/generate');
var db = require('../../models');
var jwtHelper = require('../../lib/jwt-helper');

var requestHelper = require('../request-helper');
var dbHelper = require('../db-helper');

var config = require('../../config');

var bcrypt = require('bcrypt');

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
    account_uid: 'RandomUid',
    password: 'a'
};

var USER2 = {
    id: 234,
    email: 'some@one.else',
    account_uid: 'AnotherUid',
    password: 'b'
};

var URL_PREFIX = config.urlPrefix;

function createOAuth2Client(done) {
    db.OAuth2Client.create(CLIENT).then(
        function (client) {
            return client.updateAttributes({client_secret: bcrypt.hashSync(CLIENT.client_secret, 5)});
        }
    ).then(
        function () {
            return done();
        }
    ).catch(
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
                    db.LocalLogin.create({user_id: user.id, login: userTemplate.email}).then(function (localLogin) {
                        localLogin.setPassword(userTemplate.password).then(resolve, reject);
                    });
                },
                reject);
        }
    );
}

function createFakeUser(done) {
    createUser(USER).then(
        function () {
            return createUser(USER2);
        }).then(
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

// test refresh token
describe('POST /oauth2/token (REFRESH)', function () {
    var url = '/oauth2/token';

    context('using grant_type: \'refresh_token\'', function () {
        before(resetDatabase);
        before(createFakeUser);

        before(function (done) {
            requestHelper.sendRequest(
                this,
                url,
                {
                    method: 'post',
                    cookie: this.cookie,
                    type: 'form',
                    data: {
                        grant_type: 'password',
                        username: USER.email,
                        password: USER.password,
                        client_id: CLIENT.client_id,
                        client_secret: CLIENT.client_secret
                    }
                },
                done);
        });

        before(function (done) {
            var token = this.res.body.refresh_token;
            this.refresh_token = token;
            requestHelper.sendRequest(
                this,
                url,
                {
                    method: 'post',
                    cookie: this.cookie,
                    type: 'form',
                    data: {
                        client_id: CLIENT.client_id,
                        client_secret: CLIENT.client_secret,
                        grant_type: 'refresh_token',
                        refresh_token: token
                    }
                },
                done
            );
        });

        it('should use a refresh token', function () {
            expect(this.refresh_token).match(/[a-zA-Z0-9-]+/);
        });

        it('should return a success', function () {
            expect(this.res.statusCode).equal(200);
        });

        it('should have proper access token', function () {
            var decoded = jwtHelper.decode(this.res.body.access_token, CLIENT.jwt_code);
            expect(decoded.iss).equal('cpa');
            expect(decoded.aud).equal('cpa');
            expect(decoded.cli).equal(CLIENT.id);
            expect(decoded.sub).equal(USER.id);
        });

        it('should have token type Bearer', function () {
            expect(this.res.body.token_type).equal('Bearer');
        });

        it('should have a refresh token', function () {
            expect(this.res.body.refresh_token).match(/[a-zA-Z0-9-=]+/);
        });
    });

    context('using grant_type: \'refresh_token\' with 2nd user', function () {
        before(resetDatabase);
        before(createFakeUser);

        before(function (done) {
            requestHelper.sendRequest(this, url, {
                method: 'post',
                cookie: this.cookie,
                type: 'form',
                data: {
                    grant_type: 'password',
                    username: USER2.email,
                    password: USER2.password,
                    client_id: CLIENT.client_id,
                    client_secret: CLIENT.client_secret
                }
            }, done);
        });

        before(function (done) {
            var token = this.res.body.refresh_token;
            this.refresh_token = token;
            requestHelper.sendRequest(
                this,
                url,
                {
                    method: 'post',
                    cookie: this.cookie,
                    type: 'form',
                    data: {
                        client_id: CLIENT.client_id,
                        client_secret: CLIENT.client_secret,
                        grant_type: 'refresh_token',
                        refresh_token: token
                    }
                },
                done
            );
        });

        it('should use a refresh token', function () {
            expect(this.refresh_token).match(/[a-zA-Z0-9-]+/);
        });

        it('should return a success', function () {
            expect(this.res.statusCode).equal(200);
        });

        it('should have proper access token', function () {
            var decoded = jwtHelper.decode(this.res.body.access_token, CLIENT.jwt_code);
            expect(decoded.iss).equal('cpa');
            expect(decoded.aud).equal('cpa');
            expect(decoded.cli).equal(CLIENT.id);
            expect(decoded.sub).equal(USER2.id);
        });

        it('should have token type Bearer', function () {
            expect(this.res.body.token_type).equal('Bearer');
        });

        it('should have a refresh token', function () {
            expect(this.res.body.refresh_token).match(/[a-zA-Z0-9-=]+/);
        });
    });

    context(
        'using grant_type \'refresh_token\' with random refresh token',
        function () {
            before(resetDatabase);
            before(createFakeUser);

            before(function (done) {
                requestHelper.sendRequest(
                    this,
                    url,
                    {
                        method: 'post',
                        cookie: this.cookie,
                        type: 'form',
                        data: {
                            grant_type: 'refresh_token',
                            refresh_token: 'abc-1234-abc-1234-567',
                            client_id: CLIENT.client_id,
                            client_secret: CLIENT.client_secret
                        }
                    },
                    done);
            });

            it('should reject with bad request', function () {
                expect(this.res.statusCode).equal(400);
            });

            it('should deliver error invalid refresh token', function () {
                expect(this.res.body.error_description).equal('INVALID_REFRESH_TOKEN');
            });
        }
    );

    context(
        'using grant_type \'refresh_token\' with invalid client id',
        function () {
            before(resetDatabase);
            before(createFakeUser);

            before(function (done) {
                requestHelper.sendRequest(this, url, {
                    method: 'post',
                    cookie: this.cookie,
                    type: 'form',
                    data: {
                        grant_type: 'password',
                        username: USER2.email,
                        password: USER2.password,
                        client_id: CLIENT.client_id,
                        client_secret: CLIENT.client_secret
                    }
                }, done);
            });

            before(function (done) {
                var token = this.res.body.refresh_token;
                this.refresh_token = token;
                requestHelper.sendRequest(
                    this,
                    url,
                    {
                        method: 'post',
                        cookie: this.cookie,
                        type: 'form',
                        data: {
                            grant_type: 'refresh_token',
                            refresh_token: token,
                            client_id: CLIENT.client_id + 'MakesThisInvalid',
                            client_secret: CLIENT.client_secret
                        }
                    },
                    done);
            });

            it('should reject with unauthorized', function () {
                expect(this.res.statusCode).equal(401);
            });
        }
    );

    context(
        'using grant_type \'refresh_token\' with bad client secret',
        function () {
            before(resetDatabase);
            before(createFakeUser);

            before(function (done) {
                requestHelper.sendRequest(this, url, {
                    method: 'post',
                    cookie: this.cookie,
                    type: 'form',
                    data: {
                        grant_type: 'password',
                        username: USER2.email,
                        password: USER2.password,
                        client_id: CLIENT.client_id,
                        client_secret: CLIENT.client_secret
                    }
                }, done);
            });

            before(function (done) {
                var token = this.res.body.refresh_token;
                this.refresh_token = token;
                requestHelper.sendRequest(
                    this,
                    url,
                    {
                        method: 'post',
                        cookie: this.cookie,
                        type: 'form',
                        data: {
                            grant_type: 'refresh_token',
                            refresh_token: token,
                            client_id: CLIENT.client_id,
                            client_secret: CLIENT.client_secret + 'MakesThisInvalid'
                        }
                    },
                    done);
            });

            it('should reject with unauthorized', function () {
                expect(this.res.statusCode).equal(401);
            });
        }
    );
});

