"use strict";

var db = require('../../../models');
var generate = require('../../../lib/generate');
var jwtHelper = require('../../../lib/jwt-helper');
var oauthToken = require('../../../lib/oauth2-token');

// Exchange authorization codes for access tokens.  The callback accepts the
// `client`, which is exchanging `code` and any `redirectURI` from the
// authorization request for verification.  If these values are validated, the
// application issues an access token on behalf of the user who authorized the
// code.

exports.authorization_code = function (client, code, redirectURI, done) {
    console.log('exchange code:', client, code, redirectURI);

    db.OAuth2AuthorizationCode.find({
        where: {
            authorization_code: code
        }
    }).then(function (authorizationCode) {
        if (!authorizationCode) {
            return done(null, false);
        }
        if (!client || client.id !== authorizationCode.oauth2_client_id) {
            return done(null, false);
        }
        if (redirectURI !== authorizationCode.redirect_uri) {
            return done(null, false);
        }

        db.User.find({ where: {id: authorizationCode.user_id }}).then(
            function(user) {
                if (user) {
					var accessToken = oauthToken.generateAccessToken(client, user);
					var refreshToken = oauthToken.generateRefreshToken(client, user, '*');
					if (refreshToken) {
						return done(null, accessToken, refreshToken);
					} else {
						return done(null, accessToken);
					}
				} else {
                    return done('user not found');
                }
            },
            function(e) {
                return done(e);
            }
        ).catch(done);
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
    }).catch(done);
};