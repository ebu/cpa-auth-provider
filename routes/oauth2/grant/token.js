"use strict";

// var db = require('../../../models');
// var generate = require('../../../lib/generate');
// var jwtHelper = require('../../../lib/jwt-helper');
var oauthToken = require('../../../lib/oauth2-token');

// Grant implicit authorization.  The callback takes the `client` requesting
// authorization, the authenticated `user` granting access, and
// their response, which contains approved scope, duration, etc. as parsed by
// the application.  The application issues a token, which is bound to these
// values.

exports.token = function (client, user, ares, done) {
    var accessToken = oauthToken.generateAccessToken(client, user);
    var refreshToken = oauthToken.generateRefreshToken(client, user, '*');
    if (refreshToken) {
		return done(null, accessToken, refreshToken);
	} else {
        return done(null, accessToken);
    }

    // var token = generate.accessToken();
	//
    // db.AccessToken.create({ token: token, user_id: user.id, oauth2_client_id: client.id })
    //     .then(function() {
    //         done(null, token);
    //     }).catch(function(err) {
    //         return done(err);
    //     });
};