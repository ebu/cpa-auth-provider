'use strict';

//SQL Magic (POSTGRES) query to be able to run that migration file as much as you want :)
// ﻿DELETE FROM public."SequelizeMeta" WHERE name='20180115120000-change-email-in-social-account-2-data.js';

module.exports = {
    up: function (queryInterface, Sequelize) {
        return new Promise(function (resolve, reject) {
            //FIXME POSTGRES specific use process.env.DB_TYPE to see if current run use postgres (RTS) or mysql(BR). For other Database don't do anything and CRASH
            return queryInterface.sequelize.query("select * from \"public\".\"Users\"").then(function (users) {
                var batch = [];

                console.log("users", users);
                console.log("coucou");
                console.log("users[0]", users[0]);
                // insert data in appropriate table
                for (var i = 0; i < users[users.length - 1].rowCount; i++) {
                    console.log("users.rows[0][" + i + "]:", users.rows[0][i]);
                    batch.push(queryInterface.sequelize.query("insert into \"public\".\"LocalLogins\" (login, password, verified, password_changed_at, last_login_at, user_id) " +
                        " VALUES ('" + users.rows[0][i].login + "', '" + users.rows[0][i].password + "', '" + users.rows[0][i].verified + "', '" + users.rows[0][i].password_changed_at + "', '" + users.rows[0][i].lastByte + "', '" + users.rows[0][i].id + "')"));
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
