'use strict';

module.exports = {
    up: function (queryInterface, Sequelize) {
        return new Promise(function (resolve, reject) {
            if (process.env.DB_TYPE === "postgres") {
                // max from table User:
                return queryInterface.sequelize.query("select max(id) from public.\"Users\"").then(function (maxUserIdRes) {
                    // udpate sequence:
                    let max = maxUserIdRes[0][0].max;
                    if (!max) {
                        max = 0;
                    }
                    return queryInterface.sequelize.query("ALTER  SEQUENCE public.\"Users_id_seq\" RESTART WITH " + (max + 1));
                }).then(function () {
                    // max from table LocalLogin:
                    return queryInterface.sequelize.query("select max(id) from public.\"LocalLogins\"");
                }).then(function (maxLocalLoginIdRes) {
                    // udpate sequence:
                    let max = maxLocalLoginIdRes[0][0].max;
                    if (!max) {
                        max = 0;
                    }
                    return queryInterface.sequelize.query("ALTER SEQUENCE public.\"LocalLogins_id_seq\" RESTART WITH " + (max + 1));
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
