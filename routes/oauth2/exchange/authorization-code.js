"use strict";

var db = require('../../../models');
var generate = require('../../../lib/generate');
var jwtHelper = require('../../../lib/jwt-helper');
var logger = require('../../../lib/logger');
var oauthTokenHelper = require('../../../lib/oauth2-token');

// Exchange authorization codes for access tokens.  The callback accepts the
// `client`, which is exchanging `code` and any `redirectURI` from the
// authorization request for verification.  If these values are validated, the
// application issues an access token on behalf of the user who authorized the
// code.

exports.authorization_code = function (client, code, redirectURI, done) {
    logger.debug('[AuthorizationCode][Exchange][client_id', client.id, '][code', code, '][redirectURI', redirectURI, ']');

    db.OAuth2AuthorizationCode.findOne({
        where: {
            authorization_code: code
        },
        include: [db.User]
    }).then(function (authorizationCode) {
        if (!authorizationCode) {
            logger.debug('[AuthorizationCode][Exchange][Code not found]');
            return done(null, false);
        }
        if (!client || client.id !== authorizationCode.oauth2_client_id) {
            logger.debug('[AuthorizationCode][Exchange][client_id', client ? client.id : null, '][expected', authorizationCode.oauth2_client_id, ']');
            return done(null, false);
        }
        if (redirectURI !== authorizationCode.redirect_uri) {
            logger.debug('[AuthorizationCode][Exchange][redirectURI', redirectURI, '][expected', authorizationCode.redirect_uri, ']');
            return done(null, false);
        }
        return provideAccessToken(client, authorizationCode.User, '', done);
        // var token = generate.accessToken();
        // db.AccessToken.create({
        //
        //     token: token,
        //     user_id: authorizationCode.user_id,
        //     oauth2_client_id: authorizationCode.oauth2_client_id
        //
        // }).then(function (token) {
        //     done(null, token.token);
        // }).catch(done);
    }).catch(function (err) {
        logger.debug('[AuthorizationCode][Exchange][error', err, ']');
        return done(err);
    });
};

function provideAccessToken(client, user, scope, done) {
    try {
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
            function (err) {
                logger.debug('[OAuth2][ResourceOwner][FAIL][err', err, ']');
            }
        );
    } catch (e) {
        return done(e);
    }
}