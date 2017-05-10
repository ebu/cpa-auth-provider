"use strict";

var oauthTokenHelper = require('../../../lib/oauth2-token');
var TokenError = require('oauth2orize').TokenError;
var logger = require('../../../lib/logger');

exports.issueToken = issueToken;

function issueToken(client, token, scope, done) {
    oauthTokenHelper.validateRefreshToken(token, client, scope)
        .then(
            function (user) {
                if (user) {
                    var accessToken, refreshToken;

                    oauthTokenHelper.generateAccessToken(client, user).then(
                        function (_accessToken) {
                            accessToken = _accessToken;
                            return oauthTokenHelper.generateRefreshToken(client, user, scope);
                        }
                    ).then(
                        function (_refreshToken) {
                            refreshToken = _refreshToken;
                            return oauthTokenHelper.generateTokenExtras(client, user);
                        }
                    ).then(
                        function (_extras) {
                            return done(null, accessToken, refreshToken, _extras);
                        }
                    ).catch(
                        done
                    );
                }
            }
        )
        .catch(
            function (error) {
                if (logger && typeof(logger.error) == 'function') {
                    logger.error('[OAuth2][issueToken]', error);
                }
                console.log(error);
                return done(error);
            }
        );
}

