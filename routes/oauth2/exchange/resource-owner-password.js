"use strict";

var db = require('../../../models');
var oauthToken = require('../../../lib/oauth2-token');
var TokenError = require('oauth2orize').TokenError;

var USER_NOT_FOUND = oauthToken.ERRORS.USER_NOT_FOUND;
var WRONG_PASSWORD = oauthToken.ERRORS.WRONG_PASSWORD;

// Grant authorization by resource owner (user) and password credentials.
// The user is authenticated and checked for validity - this strategy should
// only be available to a select few, highly trusted clients!
// The application issues a token, which is bound to these values.

exports.token = function (client, username, password, scope, reqBody, done) {
    // TODO confirm this particular client actually may use this validation strategy?!
    return confirmUser(client, username, password, scope, reqBody, done);
};

function confirmUser(client, username, password, scope, extraArgs, done) {
    db.User.findOne(
        {where: {email: username}}
    ).then(
        function (user) {
            if (!user) {
                done(new TokenError(USER_NOT_FOUND.message, USER_NOT_FOUND.code));
                return;
            }

            user.verifyPassword(password).then(function (isMatch) {
                    if (isMatch) {
                        return provideTokens(client, user, extraArgs, done);
                    } else {
                        return done(new TokenError(WRONG_PASSWORD.message, WRONG_PASSWORD.code));
                    }
                },
                function (err) {
                    done(err);
                });
        },
        function (error) {
            done(error);
        }
    );
}

function provideTokens(client, user, extras, done) {
    try {
        var access_duration = undefined;
        var refresh_duration = undefined;
        if (typeof extras === 'object') {
            access_duration = extras['access_duration'] * 1000;
            refresh_duration = extras['refresh_duration'] * 1000;
        }
        var accessToken = oauthToken.generateAccessToken(client, user, access_duration);
        var refreshToken = oauthToken.generateRefreshToken(client, user, undefined, refresh_duration);
        var extras = oauthToken.generateTokenExtras(client, user, access_duration);
        return done(null, accessToken, refreshToken, extras);
    } catch (e) {
        return done(e);
    }
}
