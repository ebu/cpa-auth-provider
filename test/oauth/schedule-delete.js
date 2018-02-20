"use strict";

let db = require('../../models');
let requestHelper = require('../request-helper');
let dbHelper = require('../db-helper');
let oauthHelper = require('../oauth-helper');

const CLIENT = {
    id: 1,
    client_id: "ClientA",
    client_secret: "ClientSecret",
    name: "OAuth 2.0 Client",
    redirect_uri: 'http://localhost'
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

function resetDatabase(done) {
    dbHelper.clearDatabase(
        function (err) {
            if (err) {
                return done(err);
            } else {
                oauthHelper.createOAuth2Clients([CLIENT]).then(
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

// test refresh token
describe('DELETE /oauth2/me', function () {
    let url = '/oauth2/me';

    context('correctly requesting a delete', function () {
        before(resetDatabase);
        before(oauthHelper.getAccessToken(USER.email, USER, CLIENT));

        before(function (done) {
            let token = this.res.body.access_token;
            this.access_token = token;
            requestHelper.sendRequest(
                this,
                url,
                {
                    method: 'delete',
                    cookie: this.cookie,
                    type: 'form',
                    accessToken: token,
                    data: {
                        password: USER.password
                    }
                },
                done
            );
        });

        it('should return a success', function () {
            expect(this.res.statusCode).equal(202);
            expect(this.res.body.success).equal(true);
        });

        it('should have properly set scheduled_for_deletion', function (done) {
            db.User.findOne({include: {model: db.LocalLogin, where: {login: USER.email}}}).then(
                function (u) {
                    expect(u).not.undefined;
                    expect(u.scheduled_for_deletion_at).not.null;
                    done();
                },
                done
            );
        });
    });

    context('using a wrong password', function () {
        before(resetDatabase);
        before(oauthHelper.getAccessToken(USER.email, USER, CLIENT));

        before(function (done) {
            let token = this.res.body.access_token;
            requestHelper.sendRequest(this, url, {
                method: 'delete',
                cookie: this.cookie,
                type: 'form',
                accessToken: token,
                data: {
                    password: USER.password + 'somethingextra',
                }
            }, done);
        });

        it('should reject with status', function () {
            expect(this.res.statusCode).equal(400);
            expect(this.res.body.success).equal(false);
            expect(this.res.body.msg).equal('WRONG_PASSWORD');
        });

        it('should not have set scheduled_for_deletion', function (done) {
            db.User.findOne({model: {model: db.LocalLogin, where: {login: USER.email}}}).then(
                function (u) {
                    expect(u).not.undefined;
                    expect(u.scheduled_for_deletion_at).null;
                    done();
                },
                done
            );
        });
    });

    context('missing the password', function () {
        before(resetDatabase);
        before(oauthHelper.getAccessToken(USER.email, USER, CLIENT));

        before(function (done) {
            let token = this.res.body.access_token;
            requestHelper.sendRequest(this, url, {
                method: 'delete',
                cookie: this.cookie,
                type: 'form',
                accessToken: token,
                data: {}
            }, done);
        });

        it('should reject with status', function () {
            expect(this.res.statusCode).equal(400);
            expect(this.res.body.success).equal(false);
            expect(this.res.body.msg).equal('PASSWORD_REQUIRED');
        });

        it('should not have set scheduled_for_deletion', function (done) {
            db.User.findOne({include: {model: db.LocalLogin, where: {login: USER.email}}}).then(
                function (u) {
                    expect(u).not.undefined;
                    expect(u.scheduled_for_deletion_at).null;
                    done();
                },
                done
            );
        });
    });

    context('correctly requesting a delete (for a 2nd user)', function () {
        before(resetDatabase);
        before(oauthHelper.getAccessToken(USER2.email, USER2, CLIENT));

        before(function (done) {
            let token = this.res.body.access_token;
            this.access_token = token;
            requestHelper.sendRequest(
                this,
                url,
                {
                    method: 'delete',
                    cookie: this.cookie,
                    type: 'form',
                    accessToken: token,
                    data: {
                        password: USER2.password
                    }
                },
                done
            );
        });

        it('should return a success', function () {
            expect(this.res.statusCode).equal(202);
            expect(this.res.body.success).equal(true);
        });

        it('should have properly set scheduled_for_deletion for 2nd User', function (done) {
            db.User.findOne({include: {model: db.LocalLogin, where: {login: USER2.email}}}).then(
                function (u) {
                    expect(u).not.undefined;
                    expect(u.scheduled_for_deletion_at).not.null;
                    done();
                },
                done
            );
        });

        it('should not have set scheduled_for_deletion for 1st User', function (done) {
            db.User.findOne({include: {model: db.LocalLogin, where: {login: USER.email}}}).then(
                function (u) {
                    expect(u).not.undefined;
                    expect(u.scheduled_for_deletion_at).null;
                    done();
                },
                done
            );
        });
    });
});
