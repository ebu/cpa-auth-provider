"use strict";

var db = require('../../../models');
var oauthToken = require('../../../lib/oauth2-token');
var TokenError = require('oauth2orize').TokenError;
var logger = require('../../../lib/logger');

var USER_NOT_FOUND = oauthToken.ERRORS.USER_NOT_FOUND;
var WRONG_PASSWORD = oauthToken.ERRORS.WRONG_PASSWORD;

// Grant authorization by resource owner (user) and password credentials.
// The user is authenticated and checked for validity - this strategy should
// only be available to a select few, highly trusted clients!
// The application issues a token, which is bound to these values.

exports.token = function (client, username, password, scope, done) {
	// resource owner password does not have a client, so no checking for valid client!
	return confirmUser(client, username, password, scope, done);
};

function confirmUser(client, username, password, scope, done) {
    var user;
    db.User.findOne(
        {where: {email: username}}
    ).then(
        function (user_) {
            user = user_;
            if (!user) {
                throw new TokenError(USER_NOT_FOUND.message, USER_NOT_FOUND.code);
            }

            return user.verifyPassword(password);
        }
    ).then(
        function (isMatch) {
            if (isMatch) {
                provideAccessToken(client, user, scope, done);
            } else {
                throw new TokenError(WRONG_PASSWORD.message, WRONG_PASSWORD.code);
            }
        }
    ).catch(
        function (err) {
            logger.error('[OAuth2][ResourceOwner][FAIL][username', username, '][err', err, ']');
            return done(err);
        }
    );
}

function provideAccessToken(client, user, scope, done) {
	var accessToken, refreshToken, extras;
	oauthToken.generateAccessToken(client, user).then(
		function (_token) {
			accessToken = _token;
			return oauthToken.generateRefreshToken(client, user, undefined);
		}
	).then(
		function (_token) {
			refreshToken = _token;
			return oauthToken.generateTokenExtras(client, user);
		}
	).then(
		function (_extras) {
			extras = _extras;
			return done(null, accessToken, refreshToken, extras);
		}
	).catch(
		done
	)
}
