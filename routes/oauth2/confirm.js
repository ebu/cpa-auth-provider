// check if a token is valid, from a different server

"use strict";

var db = require('../../models/index');
var passport = require('passport');

module.exports = function(app, options) {
	app.post(
		'/oauth2/confirm',
		function(req, res) {
			// TODO limit confirmation calls to certain origin hosts
			var token = req.body.token;

			if (!token) {
				res.status(400).json({success: false, msg: 'token-missing'});
				return;
			}

			db.AccessToken.find(
				{where: {token: token}}
			).then(
				function(accessToken) {
					if (accessToken) {
						res.status(200).json({success: true, user_id: accessToken.user_id});
					} else {
						res.status(400).json({success: false, msg: 'not-found'});
					}
				}
			).catch(
				function(err) {
					res.status(500).json({success: false, msg: err});
				}
			)
		}
	);
};

