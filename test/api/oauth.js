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
    verified: true,
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
            done();
        }
    ).catch(
        function (err) {
            return done(err);
        }
    );
}

function createUser(userTemplate) {
    return db.User.create(userTemplate).then(
        function (user) {
            return db.LocalLogin.create(
                {
                    user_id: user.id,
                    login: userTemplate.email,
                    verified: userTemplate.verified,
                });
        }
    ).then(function (localLogin) {
        return localLogin.setPassword(userTemplate.password);
    });
}

function createFakeUser(done) {
    createUser(USER).then(
        function () {
            return createUser(USER2);
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

// test resource owner password
describe('POST /oauth2/token', function () {
    var url = '/oauth2/token';
    context('without a client_id', function () {
        before(resetDatabase);

        before(function (done) {
            requestHelper.sendRequest(this, url, {
                method: 'post',
                cookie: this.cookie,
                type: 'form',
                data: {grant_type: 'password', username: USER.email, password: USER.password}
            }, done);
        });

        it('should reject the request', function () {
            expect(this.res.statusCode).equal(401);
        });
    });

    context(
        'with a bad client_id/client_secret',
        function () {
            before(resetDatabase);
            before(function (done) {
                requestHelper.sendRequest(this, url, {
                    method: 'post',
                    cookie: this.cookie,
                    type: 'form',
                    data: {
                        grant_type: 'password',
                        username: USER.email,
                        password: USER.password,
                        client_id: '_' + CLIENT.client_id,
                        client_secret: CLIENT.client_secret
                    }
                }, done);
            });

            it('should reject the request', function () {
                expect(this.res.statusCode).equal(401);
            });
        }
    );

    context('using grant_type: \'password\'', function () {
        before(resetDatabase);
        before(createFakeUser);

        before(function (done) {
            requestHelper.sendRequest(this, url, {
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
            }, done);
        });

        it('should return a success', function () {
            expect(this.res.statusCode).equal(200);
        });

        it('should have proper access token', function () {
            var decoded = jwtHelper.decode(this.res.body.access_token, CLIENT.jwt_code);
            expect(decoded.iss).equal('cpa');
            expect(decoded.aud).equal('cpa');
            expect(decoded.exp).match(/[0-9]+/);
            expect(decoded.cli).equal(CLIENT.id);
            expect(decoded.sub).equal(USER.id);
            expect(decoded.vfy).equal('1');
        });

        it('should have expires_in set correctly', function () {
            expect(this.res.body.expires_in).equal(36000);
        });

        it('should have token type Bearer', function () {
            expect(this.res.body.token_type).equal('Bearer');
        });

        it('should send a refresh token', function () {
            expect(this.res.body.refresh_token).match(/[a-zA-Z0-9-\.]+/);
        });
    });

    context('using grant_type: \'password\' with 2nd user', function () {
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

        it('should return a success', function () {
            expect(this.res.statusCode).equal(200);
        });

        it('should have proper access token', function () {
            var decoded = jwtHelper.decode(this.res.body.access_token, CLIENT.jwt_code);
            expect(decoded.iss).equal('cpa');
            expect(decoded.aud).equal('cpa');
            expect(decoded.exp).match(/[0-9]+/);
            expect(decoded.cli).equal(CLIENT.id);
            expect(decoded.sub).equal(USER2.id);
            expect(decoded.vfy).equal('0');
        });

        it('should have proper expires_in set', function () {
            expect(this.res.body.expires_in).equal(36000);
        });

        it('should have token type Bearer', function () {
            expect(this.res.body.token_type).equal('Bearer');
        });

        it('should send a refresh token', function () {
            expect(this.res.body.refresh_token).match(/[a-zA-Z0-9-\.]+/);
        });
    });

    context(
        'using grant_type \'password\' with bad user login',
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
                            grant_type: 'password',
                            username: 'abc+' + USER.email,
                            password: USER.password,
                            client_id: CLIENT.client_id,
                            client_secret: CLIENT.client_secret
                        }
                    },
                    done);
            });

            it('should reject with bad request', function () {
                expect(this.res.statusCode).equal(400);
            });
        }
    );
});

describe('GET /oauth2/dialog/authorize', function () {
    context('using response_type \'code\'', function () {
        var baseUrl = '/oauth2/dialog/authorize?response_type=code&state=a';
        context('without a client_id', function () {
            before(resetDatabase);

            before(function (done) {
                requestHelper.sendRequest(
                    this,
                    baseUrl,
                    {
                        method: 'get',
                        cookie: this.cookie,
                        type: 'form',
                        data: {response_type: 'code', state: 'a'}
                    },
                    done
                );
            });

            it('should reject the request', function () {
                expect(this.res.statusCode).equal(400);
            });
        });

        context('with wrong client_id', function () {
            before(resetDatabase);

            before(function (done) {
                requestHelper.sendRequest(
                    this,
                    baseUrl + '&client_id=' + encodeURIComponent('a' + CLIENT.client_id) + '&redirect_uri=' + encodeURIComponent('http://localhost'),
                    {},
                    done
                );
            });

            it('should reject the request', function () {
                expect(this.res.statusCode).equal(500);
            });
        });

        context('with proper client_id', function () {
            before(resetDatabase);

            before(function (done) {
                requestHelper.sendRequest(
                    this,
                    baseUrl + '&client_id=' + encodeURIComponent(CLIENT.client_id) + '&redirect_uri=' + encodeURIComponent(CLIENT.redirect_uri),
                    {},
                    done
                );
            });

            it('should redirect to login page', function () {
                expect(this.res.statusCode).equal(302);
            });

            it('should redirect to login page', function () {
                expect(this.res.headers.location).equal(URL_PREFIX + '/auth');
            });
        });
    });

    context('using response_type \'token\'', function () {
        var baseUrl = '/oauth2/dialog/authorize?response_type=token&state=a';
        context('without a client_id', function () {
            before(resetDatabase);

            before(function (done) {
                requestHelper.sendRequest(
                    this,
                    baseUrl,
                    {
                        method: 'get',
                        cookie: this.cookie,
                        type: 'form',
                        data: {response_type: 'code', state: 'a'}
                    },
                    done
                );
            });

            it('should reject the request', function () {
                expect(this.res.statusCode).equal(400);
            });
        });

        context('with wrong client_id', function () {
            before(resetDatabase);

            before(function (done) {
                requestHelper.sendRequest(
                    this,
                    baseUrl + '&client_id=' + encodeURIComponent('a' + CLIENT.client_id) + '&redirect_uri=' + encodeURIComponent('http://localhost'),
                    {},
                    done
                );
            });

            it('should reject the request', function () {
                expect(this.res.statusCode).equal(500);
            });
        });

        context('with proper client_id', function () {
            before(resetDatabase);

            before(function (done) {
                requestHelper.sendRequest(
                    this,
                    baseUrl + '&client_id=' + encodeURIComponent(CLIENT.client_id) + '&redirect_uri=' + encodeURIComponent(CLIENT.redirect_uri),
                    {},
                    done
                );
            });

            it('should redirect to login page', function () {
                expect(this.res.statusCode).equal(302);
            });

            it('should redirect to login page', function () {
                expect(this.res.headers.location).equal(URL_PREFIX + '/auth');
            });
        });
    });
});

// this test tries to have a complete oauth 2 implicit flow
describe('OAuth2 Implicit Flow', function () {
    context('with normal input', function () {
        var baseUrl = '/oauth2/dialog/authorize?response_type=token&state=a';
        var url = baseUrl + '&client_id=' + encodeURIComponent(CLIENT.client_id) + '&redirect_uri=' + encodeURIComponent(CLIENT.redirect_uri);

        before(resetDatabase);
        before(createFakeUser);

        before(function (done) {
            requestHelper.loginUser(this, USER.email, USER.password, done);
        });

        before(function (done) {
            requestHelper.sendRequest(
                this,
                url,
                {method: 'get', cookie: this.cookie},
                done);
        });

        before(function (done) {
            var match = /<input name="transaction_id" type="hidden" value="([A-Za-z0-9]+)">/.exec(this.res.text);
            requestHelper.sendRequest(
                this,
                "/oauth2/dialog/authorize/decision",
                {
                    method: 'post',
                    cookie: this.cookie,
                    type: 'form',
                    data: {
                        transaction_id: match[1]
                    }
                },
                done
            );
        });

        it('should redirect', function () {
            expect(this.res.statusCode).equal(302);
        });

        it('should redirect to provided uri', function () {
            expect(this.res.headers.location).match(new RegExp(CLIENT.redirect_uri + '.*'));
        });

        it('should have access_token in location', function () {
            expect(this.res.headers.location).match(new RegExp(CLIENT.redirect_uri + '/#access_token=[a-zA-Z0-9\\._-]+&expires_in=36000&token_type=Bearer&state=a'));
        });

        it('should have proper access_token content', function () {
            var match = new RegExp(CLIENT.redirect_uri + '/#access_token=([a-zA-Z0-9\\._-]+)&expires_in=36000&token_type=Bearer&state=a').exec(this.res.headers.location);
            var access_token = decodeURIComponent(match[1]);
            var decoded = jwtHelper.decode(access_token, CLIENT.jwt_code);
            expect(decoded.iss).equal('cpa');
            expect(decoded.aud).equal('cpa');
            expect(decoded.exp).match(/[0-9]+/);
            expect(decoded.cli).equal(CLIENT.id);
            expect(decoded.sub).equal(USER.id);
        });
    });
});

// this test tries to have a complete flow of the oauth 2 authorization code grant flow
describe('OAuth2 Authorization Code Flow', function () {
    context('with normal input', function () {
        var baseUrl = '/oauth2/dialog/authorize?response_type=code&state=a';
        var url = baseUrl + '&client_id=' + encodeURIComponent(CLIENT.client_id) + '&redirect_uri=' + encodeURIComponent(CLIENT.redirect_uri);

        before(resetDatabase);
        before(createFakeUser);

        before(function (done) {
            requestHelper.sendRequest(this, url, {}, done);
        });
        before(function (done) {
            requestHelper.loginUser(this, USER.email, USER.password, done);
        });

        before(function (done) {
            requestHelper.sendRequest(
                this,
                url,
                {method: 'get', cookie: this.cookie},
                done);
        });

        before(function (done) {
            var match = /<input name="transaction_id" type="hidden" value="([A-Za-z0-9]+)">/.exec(this.res.text);
            requestHelper.sendRequest(
                this,
                "/oauth2/dialog/authorize/decision",
                {
                    method: 'post',
                    cookie: this.cookie,
                    type: 'form',
                    data: {
                        transaction_id: match[1]
                    }
                },
                done
            );
        });

        before(function (done) {
            var match = new RegExp(CLIENT.redirect_uri + '/\\?code=([a-zA-Z0-9\\-]+)&state=a').exec(this.res.headers.location);
            requestHelper.sendRequest(
                this,
                "/oauth2/token",
                {
                    method: 'post',
                    type: 'form',
                    data: {
                        grant_type: 'authorization_code',
                        code: match[1],
                        redirect_uri: CLIENT.redirect_uri,
                        client_id: CLIENT.client_id,
                        client_secret: CLIENT.client_secret
                    }
                },
                done
            );
        });

        it('should return a success', function () {
            expect(this.res.statusCode).equal(200);
        });

        it('should have proper access token', function () {
            var decoded = jwtHelper.decode(this.res.body.access_token, CLIENT.jwt_code);
            expect(decoded.iss).equal('cpa');
            expect(decoded.aud).equal('cpa');
            expect(decoded.exp).match(/[0-9]+/);
            expect(decoded.cli).equal(CLIENT.id);
            expect(decoded.sub).equal(USER.id);
        });

        it('should have expires_in set properly', function () {
            expect(this.res.body.expires_in).equal(36000);
        });

        it('should have token type Bearer', function () {
            expect(this.res.body.token_type).equal('Bearer');
        });

        it('should send a refresh token', function () {
            expect(this.res.body.refresh_token).match(/[a-zA-Z0-9-\.]+/);
        });
    });
});

describe('OAuth2 requests from cross domain with access token', function () {

    before(resetDatabase);
    before(createFakeUser);

    before(function (done) {
        requestHelper.sendRequest(this, '/oauth2/login', {
            method: 'post',
            data: {
                grant_type: 'password',
                username: USER.email,
                password: USER.password,
                client_id: CLIENT.client_id
            }
        }, done);
    });

    before(function (done) {
        var self = this;
        self.cookie = null;
        requestHelper.sendRequest(this, '/oauth2/session/cookie/request', {
            method: 'post',
            data: {
                token: self.res.body.access_token
            }
        }, done);
    });

    before(function (done) {
        var self = this;
        requestHelper.sendRequest(this, '/user/profile/menu', {
            method: 'get',
            cookie: self.cookie
        }, done);
    });

    it('should return a success with appropriate display name and number of menu items', function () {
        expect(this.res.statusCode).equal(200);
        expect(this.res.body.display_name).to.equal('test@test.com');
        expect(this.res.body.menu.length).to.equal(2);
        expect(this.res.body.user_id).to.equal(USER.id);
    });

});

describe('OAuth2 requests from cross domain without access token', function () {

    before(resetDatabase);
    before(createFakeUser);

    before(function (done) {
        requestHelper.sendRequest(this, '/oauth2/login', {
            method: 'post',
            data: {
                grant_type: 'password',
                username: USER.email,
                password: USER.password,
                client_id: CLIENT.client_id
            }
        }, done);
    });

    before(function (done) {
        var self = this;
        requestHelper.sendRequest(this, '/oauth2/session/cookie/request', {
            method: 'post',
            data: {
                token: ''
            }
        }, done);
    });

    it('should return an error', function () {
        expect(this.res.statusCode).to.be.within(400, 401);
    });

});


