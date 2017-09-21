"use strict";

var requestHelper = require('../request-helper');

var nock = require('nock');


describe(
    'GET /auth/facebook',
    function () {
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

describe(
    'GET /auth/facebook/callback',
    function () {
        // before(function () {
        //     nock.disableNetConnect();
        //     nock.enableNetConnect('127.0.0.1');
        // });
        // after(function () {
        //     nock.cleanAll();
        //     nock.enableNetConnect();
        // });

        // before(function () {
        //     nock.recorder.rec();
        // });

        before(function (done) {
            nock('https://graph.facebook.com:443')
                .post('/oauth/access_token', "grant_type=authorization_code&redirect_uri=http%3A%2F%2Flocalhost%2Fap%2Fauth%2Ffacebook%2Fcallback&client_id=abc&client_secret=123&code=mycodeabc")
                .reply(200, {access_token: 'AccessTokenA', token_type: 'Bearer', expires_in: 3600});
            nock('https://graph.facebook.com')
                .get('/v2.5/me?fields=id%2Cemail%2Cname&access_token=AccessTokenA')
                .reply(200, {id: 'fffaaa-123', name: 'Cool Name', email: 'someone@importa.nt'});

            requestHelper.sendRequest(
                this,
                '/auth/facebook/callback?code=mycodeabc',
                {
                    method: 'get',
                    cookie: this.cookie
                },
                done
            );
        });

        it(
            'should redirect ?',
            function () {
                expect(this.res.statusCode).equal(302);
            }
        );
    }
);
