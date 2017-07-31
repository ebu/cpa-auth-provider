"use strict";

var passport = require('passport');
var cors = require('cors');
var logger = require('../../lib/logger');

var user_info = [
    passport.authenticate('bearer', {session: false}),
    function (req, res) {
        logger.debug('[OAuth2][Profile][user_id', req.user.id, ']');
        res.json({
            user: {
                id: req.user.id,
                email: req.user.email,
                email_verified: req.user.verified,
                display_name: req.user.display_name,
                name: req.user.display_name || req.user.email
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