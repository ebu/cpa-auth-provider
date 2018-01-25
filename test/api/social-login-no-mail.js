"use strict";

var db = require('../../models');

var nock = require('nock');

var dbHelper = require('../db-helper');
var requestHelper = require('../request-helper');

var USER_PROFILE = {
    first_name: 'Hans',
    last_name: 'Wurst',
    gender: 'male',
    birthday: '08/31/1978',
    birthday_ts: 273369600000
}


var resetDatabase = function (done) {
    return dbHelper.clearDatabase(function (err) {
        done(err);
    });
};


describe('Social login without email', function () {
    describe('1 Social login without email', function () {
        before(resetDatabase);

        before(function (done) {
            facebookUISignupNoMail.call(this, 'fffaaa-123', done);
        });

        it('should redirect to /ap/ 200 OK', function () {
            expect(this.res.statusCode).equal(302);
            expect(this.res.text).equal("Found. Redirecting to /ap/");
        });
    });

    describe('2 Social login without email', function () {
        var loginCount = 0;

        before(resetDatabase);

        before(function (done) {
            facebookUISignupNoMail.call(this, 'fffaaa-123', done);
        });

        before(function (done) {
            facebookUISignupNoMail.call(this, 'fffaaa-1234', done);
        });

        before(function (done) {
            db.SocialLogin.count().then(function (count) {
                loginCount = count;
                done();
            });
        });

        it('should redirect to /ap/ 200 OK', function () {
            expect(loginCount).equal(2);
            expect(this.res.statusCode).equal(302);
            expect(this.res.text).equal("Found. Redirecting to /ap/");
        });
    });
});


///////////////// FB utilities

function mockFBNoMail(fbId) {
    nock.cleanAll();
    nock('https://graph.facebook.com:443')
        .post('/oauth/access_token', "grant_type=authorization_code&redirect_uri=http%3A%2F%2Flocalhost%2Fap%2Fauth%2Ffacebook%2Fcallback&client_id=abc&client_secret=123&code=mycodeabc")
        .reply(200, {access_token: 'AccessTokenA', token_type: 'Bearer', expires_in: 3600});
    nock('https://graph.facebook.com')
        .get('/v2.5/me?fields=id%2Cemail%2Cname%2Cfirst_name%2Clast_name%2Cgender%2Cbirthday&access_token=AccessTokenA')
        .reply(200, {
            id: fbId,
            name: 'Cool Name',
            first_name: USER_PROFILE.first_name,
            last_name: USER_PROFILE.last_name,
            gender: USER_PROFILE.gender,
            birthday: USER_PROFILE.birthday
        });
    nock('https://graph.facebook.com')
        .get('/me?fields=id,email,name,first_name,last_name,gender,birthday&access_token=AccessTokenA')
        .reply(200, {
            id: fbId,
            name: 'Cool Name',
            first_name: USER_PROFILE.first_name,
            last_name: USER_PROFILE.last_name,
            gender: USER_PROFILE.gender,
            birthday: USER_PROFILE.birthday
        });
}

function facebookUISignupNoMail(fbId, done) {
    mockFBNoMail(fbId);
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

