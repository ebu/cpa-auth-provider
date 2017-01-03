"use strict";

var oauthToken = require('../../../lib/oauth2-token');

// Grant implicit authorization.  The callback takes the `client` requesting
// authorization, the authenticated `user` granting access, and
// their response, which contains approved scope, duration, etc. as parsed by
// the application.  The application issues a token, which is bound to these
// values.

exports.token = function (client, user, ares, done) {
	try {
		var accessToken = oauthToken.generateAccessToken(client, user);
		var refreshToken = oauthToken.generateRefreshToken(client, user, '*');
		var extras = oauthToken.generateTokenExtras(client, user);
		return done(null, accessToken, refreshToken, extras);
	} catch(e) {
		return done(e);
	}
};