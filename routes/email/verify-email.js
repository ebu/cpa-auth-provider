"use strict";

var db = require('../../models/index');
var logger = require('../../lib/logger');

var APPEND_VERIFY = '?auth=account_created';
var APPEND_DELETE = '?auth=account_removed';

module.exports = routes;

function routes(router) {

	router.get(
		'/email/verify/:key',
		function (req, res, next) {
			getTokenAndClient(req.params.key).then(
				function (data) {
					var verifyToken = data.token;
					var client = data.client;
					var redirect_url = getEmailRedirectUrl(verifyToken, client);
					if (redirect_url) {
						logger.debug('[email verify][REDIRECT][url', redirect_url, ']');
						res.redirect(redirect_url + APPEND_VERIFY);
						return deleteToken(verifyToken);//req.params.key);
					} else {
						db.User.find({where: {id: verifyToken.user_id}}).then(
							function (user) {
								res.render('./email/verify.ejs', {
									user: user,
									forward_address: 'http://beta.mediathek.br.de'
								});
								return deleteToken(verifyToken);//req.params.key);
							},
							function (err) {
								logger.error('[email verify][RENDER][user_id', verifyToken.user_id, '][error', err, ']');
								return next(err);
							}
						);
					}
				},
				function (err) {
					return next(err);
				}
			)
		}
	);

	router.get(
		'/email/delete/:key',
		function (req, res, next) {
			getTokenAndClient(req.params.key).then(
				function (data) {
					var verifyToken = data.token;
					var client = data.client;
					getUser(verifyToken.user_id).then(
						function (user) {
							var redirect_url = getEmailRedirectUrl(verifyToken, client);
							if (redirect_url) {
								res.redirect(redirect_url + APPEND_DELETE);
							} else {
								res.render('./email/delete.ejs', {
									user: user,
									forward_address: 'http://beta.mediathek.br.de'
								});
							}
							deleteUser(user).then(
								function () {
									deleteToken(verifyToken);
								},
								function () {
								}
							);
						},
						next
					);


				},
				next
			);
		}
	);
}

/** extract and generate proper url for a redirect */
function getEmailRedirectUrl(verifyToken, client) {
	if (client) {
		var redirect_url = undefined;
		var sub = verifyToken.sub != undefined ? verifyToken.sub : '';
		var emailRedirects = client.getEmailRedirects();
		if (emailRedirects.hasOwnProperty(sub)) {
			redirect_url = emailRedirects[sub];
		} else {
			redirect_url = emailRedirects['default'];
			if (redirect_url) {
				redirect_url = redirect_url.replace(/\{\{SUB}}/g, sub);
			}
		}
		return redirect_url;
	} else {
		return undefined;
	}
}

/** retrieve the token for the key */
function getTokenAndClient(key) {
	return new Promise(
		function (resolve, reject) {
			db.UserEmailToken.find({where: {key: key}}).then(
				function (verifyToken) {
					if (!verifyToken) {
						return reject(new Error('invalid token'));
					}
					if (verifyToken.oauth2_client_id) {
						db.OAuth2Client.find({where: {id: verifyToken.oauth2_client_id}}).then(
							function (client) {
								resolve({token: verifyToken, client: client});
							},
							function (e) {
								resolve({token: verifyToken, client: undefined});
							}
						);
					} else {
						resolve({token: verifyToken, client: undefined});
					}
				},
				reject
			)
		}
	);
}

function getUser(user_id) {
	return new Promise(
		function (resolve, reject) {
			db.User.find({where: {id: user_id}}).then(
				function (user) {
					if (!user) {
						return reject(new Error('user does not exist'));
					} else {
						return resolve(user);
					}
				},
				reject
			)
		}
	);
}

/** remove user-verify-token */
function deleteToken(verifyToken) {//key) {
	verifyToken.destroy().then(
		function () {
			logger.debug('[verify token delete][SUCCESS][key', verifyToken.key, '][user_id', verifyToken.user_id, ']');
		},
		function (e) {
			logger.error('[verify token delete][FAIL][key', verifyToken.key, '][user_id', verifyToken.user_id, '][error', e, ']');
		}
	);
}

/** destroys an user */
function deleteUser(user) {
	return new Promise(
		function (resolve, reject) {
			user.destroy().then(
				function () {
					logger.debug('[user delete][SUCCESS][id', user.id, '][email', user.email,']');
					return resolve();
				},
				function (e) {
					logger.error('[user delete][FAIL][id', user.id, '][error', e, ']');
					return reject();
				}
			)
		}
	);
}