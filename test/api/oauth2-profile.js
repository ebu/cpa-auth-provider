"use strict";

var generate = require('../../lib/generate');
var db = require('../../models');

var requestHelper = require('../request-helper');
var dbHelper = require('../db-helper');

var config = require('../../config');

var promise = require('bluebird');
var bcrypt = promise.promisifyAll(require('bcrypt'));

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
var PROFILE = {
    firstname: 'John',
    lastname: 'Doe',
    gender: 'M',
    date_of_birth: 273369600000,
    language: 'FR'
};

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
    return db.User.create(userTemplate).then(function (user) {
        return db.LocalLogin.create({user_id: user.id, login: userTemplate.email}).then(function (localLogin) {
            return localLogin.setPassword(userTemplate.password).then(function () {
                return user.updateAttributes(PROFILE);
            });
        });
    });
}

function createFakeUser(done) {
    createUser(USER).then(
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
describe('GET profile', function () {

    context('GET : /oauth2/user_info', function () {
        before(resetDatabase);
        before(createFakeUser);

        before(function (done) {
            requestHelper.sendRequest(this, '/oauth2/token', {
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

        before(function (done) {
            requestHelper.sendRequest(
                this,
                "/oauth2/user_info",
                {
                    accessToken: this.res.body.access_token
                },
                done
            );
        });

        it('should return a success', function () {
            expect(this.res.statusCode).equal(200);
            expect(this.res.body.user.name).equal(PROFILE.firstname + " " + PROFILE.lastname);
        });
    });

    context('GET : /oauth2/user_profile', function () {
        before(resetDatabase);
        before(createFakeUser);

        before(function (done) {
            requestHelper.sendRequest(this, '/oauth2/token', {
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

        before(function (done) {
            requestHelper.sendRequest(
                this,
                "/oauth2/user_profile",
                {
                    accessToken: this.res.body.access_token
                },
                done
            );
        });

        it('should return a success', function () {
            expect(this.res.statusCode).equal(200);
            expect(this.res.body.user.firstname).equal(PROFILE.firstname);
            expect(this.res.body.user.lastname).equal(PROFILE.lastname);
            expect(this.res.body.user.gender).equal(PROFILE.gender);
            expect(this.res.body.user.date_of_birth).equal(PROFILE.date_of_birth);
        });
    });


    context('GET : /oauth2/user_id', function () {
        before(resetDatabase);
        before(createFakeUser);

        context('with good access token', function () {

            before(function (done) {
                requestHelper.sendRequest(this, '/oauth2/token', {
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

            before(function (done) {
                requestHelper.sendRequest(
                    this,
                    "/oauth2/user_id",
                    {
                        accessToken: this.res.body.access_token
                    },
                    done
                );
            });

            it('should return a success', function () {
                expect(this.res.statusCode).equal(200);
                expect(this.res.body.id).equal(123);
            });
        });
        context('with bad access token', function () {

            before(function (done) {
                requestHelper.sendRequest(
                    this,
                    "/oauth2/user_id",
                    {
                        accessToken: 'realy bad and wrong access token'
                    },
                    done
                );
            });

            it('should return a 400', function () {
                expect(this.res.statusCode).equal(400);
            });
        });
    });


});





