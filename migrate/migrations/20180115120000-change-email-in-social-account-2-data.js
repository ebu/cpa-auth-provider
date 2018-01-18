'use strict';

module.exports = {
    up: function (queryInterface, Sequelize) {
        return new Promise(function (resolve, reject) {
            return queryInterface.sequelize.query("select * from \"public\".\"Users\""); //FIXME POSTGRES specific
        }).then(function (users) {
            // insert data in appropriate table
            for (var i = 0; i < users.length; i++) {
                queryInterface.sequelize.query("insert into \"public\".\"LocalLogins\" (login, password, verified, password_changed_at, last_login_at, user_id) " +
                    " VALUES ('" + users[i].login + "', " + users[i].password + "', " + users[i].verified + "', " + users[i].password_changed_at + "', " + users[i].lastByte + "', " + users[i].id + "')");
            }

            //return queryInterface.migrator.sequelize.query("select * from Users");

            // Drop column

            // Drop table user profile

        }).then(resolve).catch(reject);
    },

    down: function (queryInterface, Sequelize) {
        return new Promise(function (resolve, reject) {
            resolve();
        });
    }
}
