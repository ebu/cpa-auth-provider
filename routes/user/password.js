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

	register('request-password-email', requestPasswordEmail);
	register('set-password', setPassword);
	register('force-password', forcePassword);
	register('check-force-token', checkForceToken);

	var cors_headers = cors({origin: true, methods: ['POST']});
	router.options('/user/password', cors_headers);
	router.post('/user/password', cors_headers, handlePassword);

	// router.post('/user/request-password-email', requestPasswordEmail);
	// router.post('/user/set-password', authHelper.authenticateFirst, setPassword);
	// router.post('/user/force-password', forcePassword);
}

function register(name, func) {
	registeredRoutes[name] = func;
}

function handlePassword(req, res, next) {
	var requestType = req.body.request_type;
	logger.debug('[Password][post /user/password][requestType', requestType,']');

	if (registeredRoutes.hasOwnProperty(requestType)) {
		try {
			return registeredRoutes[requestType](req, res, next);
		} catch(err) {
			logger.error('[Password][post /user/password][err', err.message, ']', err);
		}
	}

	return res.status(400).json({success: false, reason: 'UNKNOWN_REQUEST_TYPE'});
	// return next();
}

function requestPasswordEmail(req, res, next) {
	var clientId = req.body.client_id;
	var requestType = req.body.request_type;
	var username = req.body.username;
	var redirectUri = req.body.redirect_uri;

	var user;

	if (requestType !== 'request-password-email') {
		res.status(400).json({success: false, reason: oauthHelper.ERRORS.BAD_REQUEST.message});
		logger.debug('[User][Password][FAIL][type password-email][username', username, '][clientId', clientId, '][err wrong request type]');
		return;
	}

	if (!clientId || !username) {
		return res.status(400).json({success: false, reason: 'MISSING_REQUEST_FIELDS'});
	}

	db.User.find({
        include: [{model: db.LocalLogin, where: { login: username }}]
	}).then(
		function(user_res) {
			if (!user_res) {
				throw new Error(oauthHelper.ERRORS.USER_NOT_FOUND.message);
			}
			user = user_res;
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
			return email.sendForcePasswordEmail(user, req.host, client, redirectUri);
		}
	).then(
		function() {
			res.status(200).json({success: true});
		}
	).catch(
		function(err) {
			res.status(400).json({success: false, reason: err.message});
			logger.debug('[User][Password][FAIL][type password-email][username', username, '][clientId', clientId, '][err', err, ']');
		}
	);
}

function setPassword(req, res, next) {
	setPasswordIntern(req, res, next);
}

function setPasswordIntern(req, res, next) {
	// var user = authHelper.getAuthenticatedUser(req);
	// if (!user) {
	// 	res.status(400).json({success: false, reason: oauthHelper.ERRORS.USER_NOT_FOUND.message});
	// 	return;
	// }

	var clientId = req.body.client_id;
	var requestType = req.body.request_type;
	var username = req.body.username;
	var currentPassword = req.body.current_password;
	var newPassword = req.body.new_password;

	if (requestType !== 'set-password') {
		res.status(400).json({success: false, reason: oauthHelper.ERRORS.BAD_REQUEST.message});
		logger.debug('[User][Password][FAIL][type set-password][username', username, '][clientId', clientId, '][err bad request type]');
		return;
	}

	if (!clientId || !username || !currentPassword || !newPassword) {
		return res.status(400).json({success: false, reason: 'MISSING_REQUEST_FIELDS'});
	}

	// if (username != user.email) {
	// 	res.status(400).json({success: false, reason: oauthHelper.ERRORS.USER_NOT_FOUND.message});
	// 	logger.debug('[User][Password][FAIL][type set-password][username', username, '][clientId', clientId, '][userId', user.id, '][err user not matched]');
	// 	return;
	// }
	var user;

	db.OAuth2Client.find({where: {client_id: clientId}}).then(
		function(client) {
			if (!client) {
				throw new Error(oauthHelper.ERRORS.CLIENT_ID_MISMATCH.message);
			}
			return db.LocalLogin.find({where: {login: username}});
			// return db.User.find({where: {email: username}});
		}
	).then(
		function(user_res) {
			user = user_res;
			if (!user) {
				throw new Error(oauthHelper.ERRORS.USER_NOT_FOUND.message);
			}
			return user.verifyPassword(currentPassword);
		}
	).then(
		function(correct) {
			if (!correct) {
				throw new Error(oauthHelper.ERRORS.WRONG_PASSWORD.message);
			}
			return user.setPassword(newPassword);
		}
	).then(
		function() {
			res.status(200).json({success: true});
		}
	).catch(
		function(err) {
			res.status(400).json({success: false, reason: err.message});
			logger.debug('[User][Password][FAIL][type set-password][username', username, '][clientId', clientId, '][err', err,']');
		}
	);
}

function forcePassword(req, res) {
	var clientId = req.body.client_id;
	var requestType = req.body.request_type;

	var tokenKey = req.body.token;
	var newPassword = req.body.new_password;

	if (requestType !== 'force-password') {
		res.status(400).json({success: false, reason: oauthHelper.ERRORS.BAD_REQUEST.message});
		logger.debug('[User][Password][FAIL][type force-password][token', tokenKey, '][clientId', clientId, '][err bad request type]');
		return;
	}

	if (!clientId || !tokenKey|| !newPassword) {
		return res.status(400).json({success: false, reason: 'MISSING_REQUEST_FIELDS'});
	}

	var token;
	db.UserEmailToken.find({where: {key: tokenKey}, include: [db.User, db.OAuth2Client]}).then(
		function(_token) {
			token = _token;
			if (!token || token.type !== 'PWD') {
				throw new Error('INVALID_TOKEN');
			}
			if (clientId && clientId != token.OAuth2Client.client_id) {
				throw new Error(oauthHelper.ERRORS.CLIENT_ID_MISMATCH.message);
			}
			if (!token.User) {
				throw new Error(oauthHelper.ERRORS.USER_NOT_FOUND.message);
			}
            if (!token.isAvailable()) {
                throw new Error('TOKEN_ALREADY_USED');
            }

			return token.User.setPassword(newPassword);
		}
	).then(
		function() {
			return token.consume();
		}
	).then(
		function() {
			res.status(200).json({success: true});
			logger.debug('[User][Password][SUCCESS][type force-password][token', tokenKey, '][clientId', clientId, ']');
		}
	).catch(
		function(err) {
			res.status(400).json({success: false, reason: err.message});
			logger.debug('[User][Password][FAIL][type force-password][token', tokenKey, '][clientId', clientId, '][err', err, ']');
		}
	);
}

function checkForceToken(req, res) {
    var clientId = req.body.client_id;
    var requestType = req.body.request_type;

    var tokenKey = req.body.token;

    if (requestType !== 'check-force-token') {
        res.status(400).json({success: false, reason: oauthHelper.ERRORS.BAD_REQUEST.message});
        logger.debug('[User][Password][FAIL][type check-force-token][token', tokenKey, '][clientId', clientId, '][err bad request type]');
        return;
    }

    if (!clientId || !tokenKey) {
        return res.status(400).json({success: false, reason: 'MISSING_REQUEST_FIELDS'});
    }

    var token;
    db.UserEmailToken.find({where: {key: tokenKey}, include: [db.User, db.OAuth2Client]}).then(
        function (_token) {
            token = _token;
            if (!token) {
                throw new Error('INVALID_TOKEN');
            }
            if (clientId && clientId != token.OAuth2Client.client_id) {
                throw new Error(oauthHelper.ERRORS.CLIENT_ID_MISMATCH.message);
            }
            if (!token.User) {
                throw new Error(oauthHelper.ERRORS.USER_NOT_FOUND.message);
            }
            if (!token.isAvailable()) {
            	throw new Error('TOKEN_ALREADY_USED');
			}

            res.status(200).json({success: true});
        }
    ).catch(
        function (err) {
            res.status(200).json({success: false, reason: err.message});
        }
    );
}
