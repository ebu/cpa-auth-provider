"use strict";

module.exports = setup;

var passport = require('passport');
var OAuth2Strategy = require('passport-oauth2');
var request = require('request');

// id->user map for serialization/deserialization
var users = {};

// oauth 2 configuration for the passport strategy
var server = process.env.OAUTH2_SERVER || 'http://192.168.99.100:3000';
var serverInternal = process.env.OAUTH2_INTERNAL_SERVER;
var callbackServer = process.env.OAUTH2_CALLBACK || 'http://192.168.99.100:3001';

var oauth2_config = {
	passReqToCallback: true,
	requestTokenURL: serverInternal + '/oauth2/request_token',
	tokenURL: serverInternal + '/oauth2/token',
	authorizationURL: server + '/oauth2/dialog/authorize',
	clientID: process.env.OAUTH2_CLIENT_ID,
	clientSecret: process.env.OAUTH2_CLIENT_SECRET,
	profileURL: serverInternal + '/oauth2/user_info',
	callbackURL: callbackServer + '/auth_code/callback'
};

OAuth2Strategy.prototype.userProfile = function (accessToken, done) {
	var options = {
		url: oauth2_config.profileURL,
		headers: {
			'User-Agent': 'request',
			'Authorization': 'Bearer ' + accessToken,
		}
	};

	function callback(error, response, body) {
		if (error || response.statusCode !== 200) {
			done(error);
		}
		var info = JSON.parse(body);

		done(null, info.user);

	}

	request(options, callback);
};

passport.serializeUser(function (user, done) {
	//console.log('user', user);
	done(null, user.id);
});

passport.deserializeUser(function (id, done) {
	done(null, users[id]);
});

passport.use('oauth2', new OAuth2Strategy(oauth2_config,
	function (req, token, refreshToken, params, profile, done) {
		updateSession(req.session, refreshToken, params.expires_in);
		users[profile.id] = profile;
		done(null, profile);
	}
));

function updateSession(session, refreshToken, expiresIn) {
	if (expiresIn) {
		session.expiresAt = Date.now() + expiresIn * 1000;
	}
	session.refreshToken = refreshToken;
}

function clearSession(session) {
	delete session.expiresAt;
	delete session.refreshToken;
}

function setup(router) {
	// display a button to start the login process
	router.get(
		'/auth_code',
		function (req, res) {
			var loginUrl = "/auth_code/oauth";
			var expiresAt = req.session.expiresAt ? new Date(new Date().getTime(req.session.expiresAt)) : '';
			res.render('auth_code', {
				loginUrl: loginUrl,
				user: req.user,
				expiresAt: expiresAt,
				refreshToken: req.session.refreshToken,
			});
		}
	);

	// start the login process using passport-oauth2 strategy
	router.get(
		'/auth_code/oauth',
		passport.authenticate('oauth2')
	);

	// callback when the authorization server (idp) provided an authorization code
	router.get(
		'/auth_code/callback',
		function (req, res, next) {
			console.log('[/auth_code/callback/][User', req.user, ']');
			return next();
		},
		passport.authenticate('oauth2', {failureRedirect: '/auth_code/error'}),
		function (req, res) {
			res.redirect('/auth_code');
		}
	);

	// error page, when user rejects permission, simply redirects to start page
	router.get(
		'/auth_code/error',
		function (req, res) {
			console.log('[/auth_code/error/]');
			res.redirect('/auth_code');
		}
	);

	// logout
	router.get(
		'/auth_code/logout',
		function (req, res) {
			req.logout();
			clearSession(req.session);
			res.redirect('/auth_code');
		}
	);

	// use an existing refresh token to renew access token
	router.get(
		'/auth_code/refresh',
		function (req, res) {
			request.post(
				{
					url: oauth2_config.tokenURL,
					form: {
						client_id: oauth2_config.clientID,
						client_secret: oauth2_config.clientSecret,
						grant_type: 'refresh_token',
						refresh_token: req.session.refreshToken,
					}
				},
				function (error, response, body) {
					if (!error) {
						try {
							body = JSON.parse(body);
						} catch (e) {
						}
						updateSession(req.session, body.refresh_token, body.expires_in);
					}
					res.redirect('/auth_code');
				}
			)
		}
	);
}