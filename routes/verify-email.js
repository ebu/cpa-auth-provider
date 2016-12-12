"use strict";

var db = require('../models');

module.exports = routes;

function routes(router) {

	router.get(
		'/email/verify/:key',
		function(req, res, next) {
			db.UserVerifyTokens.find({where: {key: req.params.key}}).then(
				function(verifyToken) {

					db.User.find({where: {id: verifyToken.user_id}}).then(
						function(user) {
							res.render('./email/verify.ejs', { user: user, forward_address: 'http://br.de' });
						},
						function(err) {
							return next(err);
						}
					);

				},
				function(err) {
					return next(err);
				}
			)
		}
	);
}