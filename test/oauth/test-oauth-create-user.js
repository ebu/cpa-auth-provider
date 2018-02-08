"use strict";

const db = require('../../models');
const requestHelper = require('../request-helper');
const dbHelper = require('../db-helper');
const oauthHelper = require('../oauth-helper');
const jwtHelper = require('../../lib/jwt-helper');

const CLIENT = {
    id: 1,
    client_id: "ClientA",
    client_secret: "ClientSecret",
    jwt_code: '01234567890abcdef',
    name: "OAuth 2.0 Client",
    redirect_uri: 'http://localhost'
};
const CLIENT2 = {
    id: 2,
    client_id: "ClientB",
    client_secret: "SomeOtherSecret!",
    jwt_code: 'ThisMustBeKeptExtraSafe!',
    name: "The Second OAuth 2.0 Client",
    redirect_uri: "http://localhost:3000",
};

const USER = {
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

const NEW_USER = {
    email: 'new@here.com',
    password: 'reallycomplexandlongpassword!',
};

function resetDatabase(done) {
    dbHelper.clearDatabase(
        function (err) {
            if (err) {
                return done(err);
            } else {
                oauthHelper.createOAuth2Clients([CLIENT, CLIENT2]).then(
                    () => {
                        return oauthHelper.createUsers([USER, USER2])
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

describe('POST /oauth2/create', function () {
    let url = '/oauth2/create';

    context('correctly creating a user', function () {
        before(resetDatabase);

        before(function (done) {
            requestHelper.sendRequest(
                this,
                url,
                {
                    method: 'post',
                    cookie: this.cookie,
                    type: 'form',
                    data: {
                        "client_id": CLIENT.client_id,
                        "grant_type": "create_user",
                        "username": NEW_USER.email,
                        "password": NEW_USER.password,
                    }
                },
                done
            );
        });

        it('should return a success', function () {
            expect(this.res.statusCode).equal(201);
            expect(this.res.body.refresh_token).match(/[a-zA-Z0-9-\.]+/);
            expect(this.res.body.token_type).equal('Bearer');
            expect(this.res.body.expires_in).equal(36000);
        });

        it('should have proper access token', function() {
            let decoded = jwtHelper.decode(this.res.body.access_token, CLIENT.jwt_code);
            expect(decoded.iss).equal('cpa');
            expect(decoded.aud).equal('cpa');
            expect(decoded.exp).match(/[0-9]+/);
            expect(decoded.cli).equal(CLIENT.id);
            expect(decoded.vfy).equal('0');
        });

        it('should have created the user', function(done) {
            db.User.findOne({include: {model: db.LocalLogin, where: {login: NEW_USER.email}}}).then(
                user => {
                    expect(user).a('Object');
                    expect(user.LocalLogin.login).equal(NEW_USER.email);
                    expect(user.LocalLogin.verified).equal(null);
                    done();
                }
            ).catch(done);
        });
    });

    context('using bad client_id', function () {
        before(resetDatabase);

        before(function (done) {
            requestHelper.sendRequest(
                this,
                url,
                {
                    method: 'post',
                    cookie: this.cookie,
                    type: 'form',
                    data: {
                        "client_id": CLIENT.client_id + 'SomethingExtra',
                        "grant_type": "create_user",
                        "username": NEW_USER.email,
                        "password": NEW_USER.password,
                    }
                },
                done
            );
        });

        it('should reject the request', function () {
            expect(this.res.statusCode).equal(400);
            expect(this.res.body.error).equal('invalid_client');
            expect(this.res.body.error_description).equal('client not found');
        });
    });

    context('already existing login', function () {
        before(resetDatabase);

        before(function (done) {
            requestHelper.sendRequest(
                this,
                url,
                {
                    method: 'post',
                    cookie: this.cookie,
                    type: 'form',
                    data: {
                        "client_id": CLIENT.client_id,
                        "grant_type": "create_user",
                        "username": USER.email,
                        "password": NEW_USER.password,
                    }
                },
                done
            );
        });

        it('should reject the request', function () {
            expect(this.res.statusCode).equal(400);
            expect(this.res.body.error).equal('invalid_request');
            expect(this.res.body.error_description).equal('USER_UNAVAILABLE');
        });
    });

    context('password not set', function () {
        before(resetDatabase);

        before(function (done) {
            requestHelper.sendRequest(
                this,
                url,
                {
                    method: 'post',
                    cookie: this.cookie,
                    type: 'form',
                    data: {
                        "client_id": CLIENT.client_id,
                        "grant_type": "create_user",
                        "username": NEW_USER.email,
                    }
                },
                done
            );
        });

        it('should reject the request', function () {
            expect(this.res.statusCode).equal(400);
            expect(this.res.body.error).equal('invalid_request');
            expect(this.res.body.error_description).equal('Missing fields. Please pass username and password.');
        });
    });

    context('username not set', function () {
        before(resetDatabase);

        before(function (done) {
            requestHelper.sendRequest(
                this,
                url,
                {
                    method: 'post',
                    cookie: this.cookie,
                    type: 'form',
                    data: {
                        "client_id": CLIENT.client_id,
                        "grant_type": "create_user",
                        "password": NEW_USER.password,
                    }
                },
                done
            );
        });

        it('should reject the request', function () {
            expect(this.res.statusCode).equal(400);
            expect(this.res.body.error).equal('invalid_request');
            expect(this.res.body.error_description).equal('Missing fields. Please pass username and password.');
        });
    });
});