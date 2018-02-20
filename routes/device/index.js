"use strict";

var trackingCookie = require('../../lib/tracking-cookie');

module.exports = function (router) {
    router.post('/device/request_uid', function (req, res) {
        // confirm X-TP-Origin is valid source?
        res.json({uid: trackingCookie.requestClientId(req, res)});
    });
};
