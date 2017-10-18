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

    router.get(
        '/statistics',
        function (req, res) {
            calculateValues().then(
                values => {
                    return res.status(200).json({summary: 'ok', values});
                },
                error => {
                    return res.status(500).json({summary: 'error', message: error.message});
                }
            )
        }
    )
};

function calculateValues() {
    let db = require('../models');
    return new Promise((resolve, reject) => {
        let result = {accountsTotal: 0, accountsVerified: 0};
        db.User.count().then(
            c => {
                result.accountsTotal = c;
                return db.User.count({where: {'verified': true}});
            }
        ).then(
            c => {
                result.accountsVerified = c;
                return resolve(result);
            }
        ).catch(
            e => {
                return reject(e);
            }
        );
    });
}
