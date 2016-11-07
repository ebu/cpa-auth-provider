"use strict";

var db = require('../../../models');
var generate = require('../../../lib/generate');

// Grant authorization by resource owner (user) and password credentials.
// The user is authenticated and checked for validity - this strategy should
// only be available to a select few, highly trusted clients!
// The application issues a token, which is bound to these values.

exports.token = function (client, username, password, scope, done) {
	// resource owner password does not have a client, so no checking for valid client!
	return confirmUser(client, username, password, scope, done);
};

function confirmUser(client, username, password, scope, done) {
	db.User.find(
		{ where: { email: username} }
	).then(
		function(user) {
			if (!user) {
				done('user not found');
				return;
			}

			user.verifyPassword(password).then(function(isMatch) {
					if (isMatch) {
						provideAccessToken(client, user, done);
					} else {
						done('password does not match');
					}
				},
				function(err) {
					done(err);
				});
		},
		function(error) {
			done(error);
		}
	);
}

/**
 * provides an access token for user/client combination
 *
 * @param client
 * @param user
 * @param done function(err, token)
 */
function provideAccessToken(client, user, done) {
	var token = generate.accessToken();

	db.AccessToken.create(
		{ token: token, user_id: user.id, oauth2_client_id: client ? client.id : 0}
	).then(
		function(accessToken) {
			done(null, token);
		},
		function(err) {
			done(err);
		}
	).catch(
		function(err) {
			return done(err);
		}
	);
}