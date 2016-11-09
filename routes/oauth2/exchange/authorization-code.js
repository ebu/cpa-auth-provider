"use strict";

var db = require('../../../models');
var generate = require('../../../lib/generate');
var jwtHelper = require('../../../lib/jwt-helper');

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
        var token = jwtHelper.generate(authorizationCode.user_id, 10 * 60 * 60, { cli: authorizationCode.oauth2_client_id });
        return done(null, token);
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