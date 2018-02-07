"use strict";

var oauthHelper = require('../../lib/oauth2-token');
var db = require('../../models');
var logger = require('../../lib/logger');
var email = require('../../lib/email-util');
var cors = require('cors');
var passport = require('passport');

module.exports = setupRoutes;

var registeredRoutes = {};


function setupRoutes(router) {
	register('request-verify-email', requestVerifyEmail);

	var cors_headers = cors({origin: true, methods: ['POST']});
	router.options('/user/verify', cors_headers);
	router.post('/user/verify', cors_headers, handleVerify);
}

function register(name, func) {
	registeredRoutes[name] = func;
}

function handleVerify(req, res, next) {
	var requestType = req.body.request_type;
	logger.debug('[Verify][post /user/verify][requestType', requestType,']');

	if (registeredRoutes.hasOwnProperty(requestType)) {
		try {
			return registeredRoutes[requestType](req, res, next);
		} catch(err) {
			logger.error('[Verify][post /user/verify][err', err.message, ']', err);
		}
	}

	return res.status(400).json({success: false, reason: 'UNKNOWN_REQUEST_TYPE'});
}

function requestVerifyEmail(req, res, next) {
	var clientId = req.body.client_id;
	var requestType = req.body.request_type;
	var username = req.body.username;
	var redirectUri = req.body.redirect_uri;

	var user;

	if (requestType != 'request-verify-email') {
		res.status(400).json({success: false, reason: oauthHelper.ERRORS.BAD_REQUEST.message});
		logger.debug('[User][Verify][FAIL][type request-verify-email][username', username, '][clientId', clientId, '][err wrong request type]');
		return;
	}

	if (!clientId || !username) {
		return res.status(400).json({success: false, reason: 'MISSING_REQUEST_FIELDS'});
	}

	db.User.findOne({ include: {model: db.LocalLogin, where: { login: username }}}).then(
		function(user_res) {
			if (!user_res) {
				throw new Error(oauthHelper.ERRORS.USER_NOT_FOUND.message);
			}
			user = user_res;

			if (user.LocalLogin.verified) {
				throw new Error('ALREADY_CONFIRMED');
			}

			return db.OAuth2Client.find({where: {client_id: clientId}});
		}
	).then(
		function(client) {
			if (!client) {
				throw new Error(oauthHelper.ERRORS.CLIENT_ID_MISMATCH.message);
			}

			redirectUri = redirectUri || client.email_redirect_uri;

			if (!client.mayEmailRedirect(redirectUri)) {
				throw new Error(oauthHelper.ERRORS.BAD_REQUEST.message);
			}
			return email.sendVerifyEmail(user, req.host, client, redirectUri);
		}
	).then(
		function() {
			res.status(200).json({success: true})
		}
	).catch(
		function(err) {
			res.status(400).json({success: false, reason: err.message});
			logger.debug('[User][Verify][FAIL][type request-verify-email][username', username, '][clientId', clientId, '][err', err, ']');
		}
	);
}
