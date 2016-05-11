"use strict";

var passport = require('passport');

var user_info = [
    passport.authenticate('bearer', {session: false}),
    function (req, res) {
        res.json({
            user: {
                id: req.user.id,
                name: req.user.display_name
            },
            scope: req.authInfo.scope
        });
    }];

module.exports = function (router) {
    router.get('/oauth2/user_info', user_info);
};