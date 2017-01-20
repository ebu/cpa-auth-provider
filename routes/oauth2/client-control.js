"use strict";

var db = require('../../models');
var logger = require('../../lib/logger');

module.exports = setupClientControlRoute;

function setupClientControlRoute(router) {
	router.post('/oauth2/client_control', createClientRoute);
}

function createClientRoute(req, res, next) {
	var id = req.body.id;
	var name = req.body.name;
	var emailRedirectUri = req.body.email_redirect_uri;
	var redirectUri = req.body.redirect_uri;
	var clientId = req.body.client_id;
	var clientSecret = req.body.client_secret;

	db.OAuth2Client.findOrCreate({
		id: id,
		name: name,
		client_id: clientId,
		client_secret: clientSecret,
		redirect_uri: redirectUri,
		email_redirect_uri: emailRedirectUri,
	}).spread(
		function(client) {
			if (!client) {
				return res.status(400).json({success: false});
			} else {
				return res.status(200).json({id: client.id, client_id: client.client_id, client_secret: client.client_secret});
			}
		},
		function(err) {
			return res.status(400).json({success: false, reason: err.message});
		}
	);
}