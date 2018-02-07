"use strict";

var db = require('../../../models');
var oauthTokenHelper = require('../../../lib/oauth2-token');
var TokenError = require('oauth2orize').TokenError;
var logger = require('../../../lib/logger');
var userDeletion = require('../../../lib/user-deletion');

var INCORRECT_LOGIN_OR_PASS = 'INCORRECT_LOGIN_OR_PASS';
var INVALID_REQUEST = 'invalid_request';


// Grant authorization by resource owner (user) and password credentials.
// The user is authenticated and checked for validity - this strategy should
// only be available to a select few, highly trusted clients!
// The application issues a token, which is bound to these values.

exports.token = function (client, username, password, scope, reqBody, done) {
    // TODO confirm this particular client actually may use this validation strategy?!
    return confirmUser(client, username, password, scope, reqBody, done);
};

function confirmUser(client, username, password, scope, extraArgs, done) {
    var user;
    db.LocalLogin.findOne(
        {where: {login: username}, include: {model: db.User}}
    ).then(
        function (localLogin) {
            if (!localLogin) {
                throw new TokenError(INCORRECT_LOGIN_OR_PASS, INVALID_REQUEST);
            }
            user = localLogin.User;
            return localLogin.verifyPassword(password);
        }
    ).then(
        function (isMatch) {
            if (isMatch) {
                provideAccessToken(client, user, scope, extraArgs, done);
            } else {
                throw new TokenError(INCORRECT_LOGIN_OR_PASS, INVALID_REQUEST);
            }
        }
    ).catch(
        function (err) {
            logger.error('[OAuth2][ResourceOwner][FAIL][username', username, '][err', err, ']');
            return done(err);
        }
    );
}

function provideAccessToken(client, user, scope, extraArgs, done) {
    var access_duration = undefined;
    var refresh_duration = undefined;
    if (typeof extraArgs === 'object') {
        access_duration = extraArgs['access_duration'] * 1000;
        refresh_duration = extraArgs['refresh_duration'] * 1000;
    }

    var accessToken, refreshToken, extras;
    oauthTokenHelper.generateAccessToken(client, user, access_duration).then(
        function (_token) {
            accessToken = _token;
            return oauthTokenHelper.generateRefreshToken(client, user, scope, refresh_duration);
        }
    ).then(
        function (_token) {
            refreshToken = _token;
            return oauthTokenHelper.generateTokenExtras(client, user, access_duration);
        }
    ).then(
        function (_extras) {
            extras = _extras;
            return userDeletion.cancelDeletion(user, client);
        }
    ).then(
        function (deletionCancelled) {
            if (deletionCancelled) {
                extras['deletion_cancelled'] = true;
            }
            return done(null, accessToken, refreshToken, extras);
        }
    ).catch(
        done
    )
}
