"use strict";

var db = require('../../../models');
var generate = require('../../../lib/generate');

// Grant authorization by resource owner (user) and password credentials.
// The user is authenticated and checked for validity - this strategy should
// only be available to a select few, highly trusted clients!
// The application issues a token, which is bound to these values.

exports.token = function (client, username, password, scope, done) {
	// TODO confirm this particular client actually may use this validation strategy!
	db.OAuth2Client.find(
		{where: {client_id: id}}
	).then(
		function (client) {
			return confirmUser(client, username, password, scope, done);
		}
	).catch(done);

};

function confirmUser(client, username, password, scope, done) {
	db.User.find(
		{ where: { provider_uid: username} }
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
		{ token: token, user_id: user.id, oauth2_client_id: client.id }
	).then(
		function() {
			done(null, token);
		}
	).catch(
		function(err) {
			return done(err);
		}
	);
}