'use strict';

module.exports = {
    up: function (queryInterface, Sequelize) {
        return new Promise(function (resolve, reject) {
            // Add new columns to table Users
            console.log("drop columns in table Users");
            return queryInterface.removeColumn("Users", "email")
                .then(function () {
                    return queryInterface.removeColumn("Users", "password");
                }).then(function () {
                    return queryInterface.removeColumn("Users", "verified");
                }).then(function () {
                    return queryInterface.removeColumn("Users", "account_uid");
                }).then(function () {
                    return queryInterface.removeColumn("Users", "password_changed_at");
                }).then(function () {
                    console.log("drop table UserProfiles");
                    return queryInterface.dropTable('UserProfiles');
                }).then(resolve).catch(reject);
        });
    },

    down: function (queryInterface, Sequelize) {
        return new Promise(function (resolve, reject) {
            resolve();
        });
    }
}
