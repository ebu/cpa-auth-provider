"use strict";

var requestHelper = require('../request-helper');
var db = require('../../models');
var dbHelper = require('../db-helper');
var recaptcha = require('express-recaptcha');

var nock = require('nock');

var EMAIL = 'someone@importa.nt';
var recaptchaResponse = 'a dummy recaptcha response';

// The following recaptcha key should always return ok
// See https://developers.google.com/recaptcha/docs/faq
var OK_RECATCHA_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
var OK_RECATCHA_SECRET = '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';


var STRONG_PASSWORD = 'correct horse battery staple';

var resetDatabase = function (done) {
    dbHelper.clearDatabase(function (err) {
        done(err);
    });
};

//curl 'https://accounts.google.com/o/oauth2/v2/auth?response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fgoogle%2Fcallback&scope=profile%20email&client_id=621117323323-j048lcbv5khh6lhr1lok4vv17mekijvm.apps.googleusercontent.com' -H 'pragma: no-cache' -H 'accept-encoding: gzip, deflate, br' -H 'accept-language: fr-FR,fr;q=0.8,en-US;q=0.6,en;q=0.4' -H 'upgrade-insecure-requests: 1' -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36' -H 'accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8' -H 'cache-control: no-cache' -H 'authority: accounts.google.com' -H 'cookie: OCAK=2CB_sg-xnOi1aGGsjGI9niUIlsflt8qRpUBBl5Bs8cs; SID=NQX6LuPLNeJbXRrpLyBQ-YxdzQro6P6b5lJpoAZqd3sIYCbo7lOdGPGXAewRSVsZrvBUtQ.; LSID=NQX6LqNU__s-u67l7_cBeVlaCcD4K77IfldHCLlNk7d1yzqF9Uv8vpGIoghR60T-3tblXg.; HSID=AHeiN3Pq2pFsmkNdD; SSID=AoLMIBCaaAkp0CNPd; APISID=pprdC2snmCa2bAOG/A3ERkz5hQh01bRPZo; SAPISID=uoxdVmyyfzKyCKg-/AYtYQwRxE5a9o7ysW; ACCOUNT_CHOOSER=AFx_qI4P5B9fHGJXuOKgKieuueQfCovVJ1cTjzL6P30LknAMnhUu6f4NO0A7RYD9xJHk6hqWBHZDAj3Sfm9LSylljqcm-_l6sVnnXyGXCx1_1QkfvL_596yMLcTIwPj4e1B7fAJDHGiXb29LeTAo8xPRHujdqHuYbA; GAPS=1:iKqQmgwLoSq_WL7pl8wdPiE0F_o1LCWD5fs3tvpSjm4PT4XXb_rkD8tzxZjdgZftPwTfyZeonQ5i1qNqQmVid010i6Mejw:QVaaaWsfy044qylq; NID=112=z7antRO_rtjdnCgpRl9OPcwXyvkp97r5LDNVkER4WA8nk9Qk8_iNeh_HNb0Bp-Pp5wUAj1jKWJ7OiwbTSBsYUn6boKT2ya92L3ePC5VF_-EYzDSGhKfmnxAv1aD3CP19XwCVbKPtJNYMi7HFqq7MDKuBgub4D1vsTY-Ohsz4jljOkvUSr_DigLmkpAZo; CONSENT=YES+CH.fr+20150705-15-0; SIDCC=AE4kn7_1tT1JsKefTkHtuKdwxrOHZQuMUEl7IGgmJsHjok2caxrsB1t9pkcxiei_F0_w255OnPi9OfkmoKkw' -H 'referer: http://localhost.ecedev.rts.ch:3000/auth/local' --compressed

function mockGoogle() {
    nock('https://accounts.google.com/')
        .get('o/oauth2/v2/auth?response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fgoogle%2Fcallback&scope=profile%20email&client_id=621117323323-j048lcbv5khh6lhr1lok4vv17mekijvm.apps.googleusercontent.com')
        .reply(302);
    nock('https://www.googleapis.com').post('/oauth2/v4/token').reply(
        200,
        {
            access_token: 'access-token-g1',
        }
    );
    nock('https://www.googleapis.com').get('/plus/v1/people/me?access_token=access-token-g1').reply(
        200,
        {
            id: 'aa123',
            name: {familyName: 'Wurst', givenName: 'Hans'},
            gender: 'slug',
            emails: [{value: 'someone@gmail.com', type: 'main'}]
        }
    );

    // nock('https://graph.facebook.com:443')
    //     .post('/oauth/access_token', "grant_type=authorization_code&redirect_uri=http%3A%2F%2Flocalhost%2Fap%2Fauth%2Ffacebook%2Fcallback&client_id=abc&client_secret=123&code=mycodeabc")
    //     .reply(200, {access_token: 'AccessTokenA', token_type: 'Bearer', expires_in: 3600});
    // nock('https://graph.facebook.com')
    //     .get('/v2.5/me?fields=id%2Cemail%2Cname&access_token=AccessTokenA')
    //     .reply(200, {id: 'fffaaa-123', name: 'Cool Name', email: EMAIL});
}

describe('GET /auth/google', function () {
        before(function (done) {
            requestHelper.sendRequest(
                this,
                '/auth/google',
                {
                    method: 'get',
                    cookie: this.cookie
                },
                done);
        });

        it('should redirect to google', function () {
            expect(this.res.statusCode).equal(302);
            expect(this.res.headers.location).equal("https://accounts.google.com/o/oauth2/v2/auth?response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fap%2Fauth%2Fgoogle%2Fcallback&scope=profile%20email&client_id=abc");
        });
    }
);


describe('GET /auth/google/callback', function () {
    describe('When user is not in the system', function () {
        before(function (done) {

            mockGoogle();

            requestHelper.sendRequest(
                this,
                '/auth/google/callback?code=mycodeabc',
                {
                    method: 'get',
                    cookie: this.cookie
                },
                done
            );
        });

        it('should redirect ?', function () {
                expect(this.res.statusCode).equal(302);
                expect(this.res.text).equal('Found. Redirecting to /ap/');
            }
        );
    });
//     describe('When user is in the system and hasn\'t validated his mail', function () {
//
//         before(function (done) {
//             recaptcha.init(OK_RECATCHA_KEY, OK_RECATCHA_SECRET);
//             done();
//         });
//
//         before(resetDatabase);
//
//         before(function (done) {
//             requestHelper.sendRequest(this, '/api/local/signup', {
//                 method: 'post',
//                 cookie: this.cookie,
//                 type: 'form',
//                 data: {
//                     email: EMAIL,
//                     password: STRONG_PASSWORD,
//                     gender: 'female',
//                     date_of_birth: 249782400000,
//                     'g-recaptcha-response': recaptchaResponse
//                 }
//             }, done)
//         });
//
//         before(function (done) {
//             mockFB();
//
//             requestHelper.sendRequest(
//                 this,
//                 '/auth/facebook/callback?code=mycodeabc',
//                 {
//                     method: 'get',
//                     cookie: this.cookie
//                 },
//                 done
//             );
//         });
//
//         it('should redirect to login with error LOGIN_INVALID_EMAIL_BECAUSE_NOT_VALIDATED_FB', function () {
//                 expect(this.res.statusCode).equal(302);
//                 expect(this.res.text).equal('Found. Redirecting to /auth?error=LOGIN_INVALID_EMAIL_BECAUSE_NOT_VALIDATED_FB');
//             }
//         );
//     });
//
//     describe('When user is in the system and has validated his mail', function () {
//
//         before(function (done) {
//             recaptcha.init(OK_RECATCHA_KEY, OK_RECATCHA_SECRET);
//             done();
//         });
//
//         before(resetDatabase);
//
//         before(function (done) {
//             requestHelper.sendRequest(this, '/api/local/signup', {
//                 method: 'post',
//                 cookie: this.cookie,
//                 type: 'form',
//                 data: {
//                     email: EMAIL,
//                     password: STRONG_PASSWORD,
//                     gender: 'female',
//                     date_of_birth: 249782400000,
//                     'g-recaptcha-response': recaptchaResponse
//                 }
//             }, done)
//         });
//
//         before(function (done) {
//             db.User.findOne({where: {email: EMAIL}}).then(
//                 function (user) {
//                     user.updateAttributes({verified: true}).then(
//                         function () {
//                             done();
//                         },
//                         done
//                     );
//                 },
//                 done
//             );
//         });
//
//         before(function (done) {
//             mockFB();
//
//             requestHelper.sendRequest(
//                 this,
//                 '/auth/facebook/callback?code=mycodeabc',
//                 {
//                     method: 'get',
//                     cookie: this.cookie
//                 },
//                 done
//             );
//         });
//
//         it('should redirect to login with error LOGIN_INVALID_EMAIL_BECAUSE_NOT_VALIDATED_FB', function () {
//                 expect(this.res.statusCode).equal(302);
//                 expect(this.res.text).equal('Found. Redirecting to /ap/');
//             }
//         );
//     });
});
