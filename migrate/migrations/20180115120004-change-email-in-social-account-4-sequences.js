'use strict';

module.exports = {
    up: function (queryInterface, Sequelize) {
        return new Promise(function (resolve, reject) {
            if (process.env.DB_TYPE === "postgres") {
                // max from table User:
                return queryInterface.sequelize.query("select max(id) from Users").then(function (maxUserIdRes) {
                    // udpate sequence:
                    console.log("maxUserIdRes", maxUserIdRes);
                    return queryInterface.sequelize.query("Users_id_seq\" RESTART WITH " + (maxUserIdRes[0]) + 1);
                }).then(function () {
                    // max from table LocalLogin:
                    return queryInterface.sequelize.query("select max(id) from LocalLogins");
                }).then(function (maxLocalLoginIdRes) {
                    // udpate sequence:
                    console.log("maxLocalLoginIdRes", maxLocalLoginIdRes);
                    return queryInterface.sequelize.query("ALTER SEQUENCE \"LocalLogins_id_seq\" RESTART WITH " + (maxLocalLoginIdRes[0]) + 1);
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
