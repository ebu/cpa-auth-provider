'use strict';

module.exports = {
    up: function (queryInterface, Sequelize) {
        return new Promise(function (resolve, reject) {
            if (process.env.DB_TYPE === "postgres") {
                // max from table User:
                return queryInterface.sequelize.query("ALTER SEQUENCE public.\"Users_id_seq\" RESTART").then(function () {
                    return queryInterface.sequelize.query("ALTER SEQUENCE \"LocalLogins_id_seq\" RESTART");
                }).then(function () {
                    resolve();
                }).catch(reject);
            } else {
                resolve();
            }
        });
    },

    down: function (queryInterface, Sequelize) {
        return new Promise(function (resolve, reject) {
            resolve();
        });
    }
}
