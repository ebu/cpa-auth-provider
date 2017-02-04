"use strict";

var db = require('../../models');
var logger = require('../../lib/logger');
var authHelper = require('../../lib/auth-helper');

module.exports = setupClientControlRoute;

function setupClientControlRoute(router) {
	router.get('/oauth2/clients', authHelper.ensureAuthenticated, showClientList);
	router.get('/oauth2/client/add', authHelper.ensureAuthenticated, showAddClient);
	router.get('/oauth2/client/edit/:id', authHelper.ensureAuthenticated, showEditClient);

	router.post('/oauth2/client_control', authHelper.ensureAuthenticated, createClientRoute);
	router.post('/oauth2/client_update', authHelper.ensureAuthenticated, updateClientRoute);
}

function showClientList(req, res, next) {
	db.OAuth2Client.findAll().then(
		function (clients) {
			res.render('./oauth2/oauth_clients', {clients: clients});
		},
		function (err) {
			res.send(500);
		}
	)

}

function showAddClient(req, res, next) {
	res.render('./oauth2/add_oauth_client.ejs');
}

function showEditClient(req, res, next) {
	db.OAuth2Client.findById(req.params.id).then(
		function (client) {
			res.render('./oauth2/edit_oauth_client.ejs', {client: client});
		},
		function (err) {
			res.send(500);
		}
	)
}

function createClientRoute(req, res, next) {
	var id = req.body.id;
	var name = req.body.name;
	var emailRedirectUri = req.body.email_redirect_uri;
	var redirectUri = req.body.redirect_uri;
	var clientId = req.body.client_id;
	var clientSecret = req.body.client_secret;

	db.OAuth2Client.findOrCreate({
		where: {
			id: id,
			name: name,
			client_id: clientId,
			client_secret: clientSecret,
			redirect_uri: redirectUri,
			email_redirect_uri: emailRedirectUri,
		}
	}).spread(
		function (client) {
			if (!client) {
				return res.status(400).json({success: false});
			} else {
				return res.status(200).json({
					id: client.id,
					client_id: client.client_id,
					client_secret: client.client_secret
				});
			}
		},
		function (err) {
			return res.status(400).json({success: false, reason: err.message});
		}
	);
}

function updateClientRoute(req, res, next) {
	var id = req.body.id;
	var name = req.body.name;
	var emailRedirectUri = req.body.email_redirect_uri;
	var redirectUri = req.body.redirect_uri;
	var clientId = req.body.client_id;
	var clientSecret = req.body.client_secret;

	db.OAuth2Client.findById(id).then(
		function (client) {
			client.name = name;
			client.redirect_uri = redirectUri;
			client.email_redirect_uri = emailRedirectUri;
			client.client_id = clientId;
			client.client_secret = clientSecret;

			return client.save();
		}
	).then(
		function () {
			return res.status(200).json({
				id: client.id,
				client_id: client.client_id,
				client_secret: client.client_secret
			});
		}
	).catch(
		function () {
			return res.status(500);
		}
	);
}