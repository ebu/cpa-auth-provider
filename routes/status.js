"use strict";

module.exports = function (router) {

    /**
     * Server status endpoint
     */

    router.get('/status', function (req, res) {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.write("Authentication Provider up and running\n");
        res.end();
    });

    router.get(
        '/_lbhealth',
        function (req, res) {
            return res.status(200).json({summary: "ok"});
        }
    );
};
