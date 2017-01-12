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
    console.log('[AuthorizationCode][Exchange][client_id', client.id, '][code', code, '][redirectURI', redirectURI, ']');

    db.OAuth2AuthorizationCode.find({
        where: {
            authorization_code: code
        }
    }).then(function (authorizationCode) {
        if (!authorizationCode) {
			console.log('[AuthorizationCode][Exchange][Code not found]');
            return done(null, false);
        }
        if (!client || client.id !== authorizationCode.oauth2_client_id) {
			console.log('[AuthorizationCode][Exchange][client_id', client? client.id : null, '][expected', authorizationCode.oauth2_client_id, ']');
            return done(null, false);
        }
        if (redirectURI !== authorizationCode.redirect_uri) {
			console.log('[AuthorizationCode][Exchange][redirectURI',redirectURI,'][expected', authorizationCode.redirect_uri, ']');
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
    }).catch(function(err) {
        console.log('[AuthorizationCode][Exchange][error', err, ']');
        return done(err);
	});
};