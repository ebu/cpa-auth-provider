'use strict';

module.exports = {
    up: function (queryInterface, Sequelize) {
        return new Promise(function (resolve, reject) {
        }).then(function () {
            if (process.env.DB_TYPE === "postgres") {
                // rename sequence
                // max from table User:
                return queryInterface.sequelize.query("select max(id) from Users").then(function (maxUserIdRes) {
                    // udpate sequence:
                    console.log("maxUserIdRes", maxUserIdRes);
                    let max = maxUserIdRes[0][0];
                    console.log("maxUserIdRes", max);
                    if (!max) {
                        max = 0;
                    }
                    return queryInterface.sequelize.query("Users_id_seq\" RESTART WITH " + (max + 1));
                }).then(function () {
                    // max from table LocalLogin:
                    return queryInterface.sequelize.query("select max(id) from LocalLogins");
                }).then(function (maxLocalLoginIdRes) {
                    // udpate sequence:
                    console.log("maxLocalLoginIdRes", maxLocalLoginIdRes);
                    let max = maxLocalLoginIdRes[0][0];
                    console.log("maxUserIdRes", max);
                    if (!max) {
                        max = 0;
                    }
                    return queryInterface.sequelize.query("ALTER SEQUENCE \"LocalLogins_id_seq\" RESTART WITH " + (max + 1));
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
