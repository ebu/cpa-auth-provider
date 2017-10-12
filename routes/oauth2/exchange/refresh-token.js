"use strict";

var oauthTokenHelper = require('../../../lib/oauth2-token');
var TokenError = require('oauth2orize').TokenError;
var logger = require('../../../lib/logger');

exports.issueToken = issueToken;

function issueToken(client, token, scope, reqBody, done) {
    var access_duration = undefined;
    var refresh_duration = undefined;
    if (typeof reqBody === 'object') {
        access_duration = (reqBody['access_duration'] || 0) * 1000;
        refresh_duration = (reqBody['refresh_duration'] || 0) * 1000;
    }

    oauthTokenHelper.validateRefreshToken(token, client, scope)
        .then(
            function (user) {
                if (user) {
                    var accessToken, refreshToken;

                    oauthTokenHelper.generateAccessToken(client, user, access_duration).then(
                        function (_accessToken) {
                            accessToken = _accessToken;
                            return oauthTokenHelper.generateRefreshToken(client, user, scope, refresh_duration);
                        }
                    ).then(
                        function (_refreshToken) {
                            refreshToken = _refreshToken;
                            return oauthTokenHelper.generateTokenExtras(client, user, access_duration);
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
                if (logger && typeof(logger.error) === 'function') {
                    logger.error('[OAuth2][issueToken]', error);
                }
                return done(error);
            }
        );
}

