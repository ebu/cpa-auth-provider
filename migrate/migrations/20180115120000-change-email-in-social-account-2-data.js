'use strict';

module.exports = {
    up: function (queryInterface, Sequelize) {
        return new Promise(function (resolve, reject) {
            //FIXME POSTGRES specific use process.env.DB_TYPE to see if current run use postgres (RTS) or mysql(BR). For other Database don't do anything and CRASH
            return queryInterface.sequelize.query("select * from \"public\".\"Users\"").then(function (users) {
                var batch = [];

                // insert data in appropriate table
                for (var i = 0; i < users.length; i++) {
                    console.log("users[i]:", users[i]);
                    batch.push(queryInterface.sequelize.query("insert into \"public\".\"LocalLogins\" (login, password, verified, password_changed_at, last_login_at, user_id) " +
                        " VALUES ('" + users[i].login + "', '" + users[i].password + "', '" + users[i].verified + "', '" + users[i].password_changed_at + "', '" + users[i].lastByte + "', '" + users[i].id + "')"));
                }

                return Promise.all(batch);
                //return queryInterface.migrator.sequelize.query("select * from Users");

                // Drop column

                // Drop table user profile

            }).then(resolve).catch(reject);
        });
    },

    down: function (queryInterface, Sequelize) {
        return new Promise(function (resolve, reject) {
            resolve();
        });
    }
}
