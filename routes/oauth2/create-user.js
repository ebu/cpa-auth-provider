"use strict";

var config = require('../../config');
var db = require('../../models');
var oauth2Token = require('../../lib/oauth2-token');
var generate = require('../../lib/generate');
var emailUtil = require('../../lib/email-util');

exports.createUser = createUser;

function createUser(req, res) {
	if (req.body.grant_type != 'create_user') {
		return res.status(400).json({ error: oauth2Token.ERRORS.BAD_REQUEST.code, error_description: oauth2Token.ERRORS.BAD_REQUEST.message });
	}

	if (!req.body.client_id) {
		return res.status(400).json({error: oauth2Token.ERRORS.BAD_REQUEST.code, error_description: 'Missing fields. Please pass client_id.'});
	}

	if (!req.body.username || !req.body.password) {
		return res.status(400).json({error: oauth2Token.ERRORS.BAD_REQUEST.code, error_description: 'Missing fields. Please pass username and password.'});
	}

	db.User.find({ where: { email: req.body.username} })
		.then (function (user){
			if (user){
				return res.status(400).json({error: oauth2Token.ERRORS.USER_UNAVAILABLE.code, error_description: oauth2Token.ERRORS.USER_UNAVAILABLE.message });
			} else {
				db.sequelize.sync().then(function() {
					var user = db.User.create({
						email: req.body.username,
						account_uid: generate.accountId()
					}).then(function (user) {
							user.setPassword(req.body.password).done(function(result) {
								return sendSuccess(user, req, res);
							});
						},
						function(err){
							res.status(500).json({error: 'Internal Error', error_description: err.message });
						});
				});
			}
		}, function(error) {
			res.status(500).json({error: 'Internal Error', error_description: error.message });
		});
}

function sendSuccess(user, req, res) {
	db.OAuth2Client.find({where: {client_id: req.body.client_id}})
		.then(
			function (client) {
				var redirectUri = req.body.redirect_uri || client.email_redirect_uri;
				if(!client.mayEmailRedirect(redirectUri)) {
					redirectUri = undefined;
				}
				emailUtil.sendVerifyEmail(user, req.host, client, redirectUri).then(
					function() {
					},
					function(e) {
					}
				);

                var access_duration = undefined;
                var refresh_duration = undefined;
                var extras = req.body;
                if (typeof extras === 'object') {
                    access_duration = extras['access_duration'] * 1000;
                    refresh_duration = extras['refresh_duration'] * 1000;
                }
				var access_token = oauth2Token.generateAccessToken(client, user, access_duration);
				var refresh_token = oauth2Token.generateRefreshToken(client, user, undefined, refresh_duration);
				var extras = oauth2Token.generateTokenExtras(client, user, access_duration);

				return res.status(201).json(
					{
						access_token: access_token,
						refresh_token: refresh_token,
						expires_in: extras.expires_in,
						token_type: 'Bearer'
					});
			},
			function(err) {
				return res.status(500).json({error: 'Internal Error', error_description: err.message });
			})
		.catch(function(e) {
			return res.status(500).json({ error: 'Internal Error', error_description: e.message });
		});
}
