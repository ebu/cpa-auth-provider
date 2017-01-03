// check if a token is valid, from a different server

"use strict";

var db = require('../../models/index');
var passport = require('passport');
var jwtHelper = require('../../lib/jwt-helper');

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

			try {
				var data = jwtHelper.decode(token);
				// slightly slower solution: could check database here
				res.status(200).json({ success: true, user_id: data.sub });
			} catch(e) {
				res.status(500).json({ success: false, msg: err });
			}
		}
	);
};

