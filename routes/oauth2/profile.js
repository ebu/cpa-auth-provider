"use strict";

var passport = require('passport');
var cors = require('cors');

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

    // TODO move this to a standalone server as Profile Manager
    // TODO configure the restriction of origins on the CORS preflight call
    var cors_headers = cors({origin: true, methods: ['GET']});
    router.options('/oauth2/user_info', cors_headers);
    router.get('/oauth2/user_info', cors_headers, user_info);
};