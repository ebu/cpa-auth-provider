"use strict";

var db = require('../../models/index');

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
						return res.redirect(redirect_url + APPEND_VERIFY);
					} else {
						db.User.find({where: {id: verifyToken.user_id}}).then(
							function (user) {
								res.render('./email/verify.ejs', {
									user: user,
									forward_address: 'http://beta.mediathek.br.de'
								});
							},
							function (err) {
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
			getToken(req.params.key).then(
				function (verifyToken, client) {
					var redirect_url = getEmailRedirectUrl(verifyToken, client);
					if (redirect_url) {
						return res.redirect(redirect_url + APPEND_DELETE);
					} else {
						res.render('./email/delete.ejs', {user: user, forward_address: 'http://beta.mediathek.br.de'});
					}

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
			db.UserVerifyToken.find({where: {key: key}}).then(
				function(verifyToken) {
					if (!verifyToken) {
						return reject(new Error('invalid token'));
					}
					if (verifyToken.oauth2_client_id) {
						db.OAuth2Client.find({where: {id: verifyToken.oauth2_client_id}}).then(
							function (client) {
								resolve({ token: verifyToken, client: client});
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