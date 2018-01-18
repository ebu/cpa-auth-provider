'use strict';

//SQL Magic (POSTGRES) query to be able to run that migration file as much as you want :)
// ﻿DELETE FROM public."SequelizeMeta" WHERE name='20180115120000-change-email-in-social-account-2-data.js';
// ﻿DELETE FROM public."LocalLogins";

function getUserSelectQuery() {
    if (process.env.DB_TYPE === "postgres") {
        return "select * from \"public\".\"Users\"";
    } else {
        //TODO support mysql
        throw new Error(process.env.DB_TYPE + " database is not supported now :'(");
    }
}

function getUserProfileSelectQuery() {
    if (process.env.DB_TYPE === "postgres") {
        return "select * from \"public\".\"UserProfiles\"";
    } else {
        //TODO support mysql
        throw new Error(process.env.DB_TYPE + " database is not supported now :'(");
    }
}

function getUsersSelectQueryNbOfResult(users) {
    if (process.env.DB_TYPE === "postgres") {
        return users[0].length; //TODO test if no user
    } else {
        //TODO support mysql
        throw new Error(process.env.DB_TYPE + " database is not supported now :'(");
    }
}

function getUserProfilesSelectQueryNbOfResult(userProfiles) {
    if (process.env.DB_TYPE === "postgres") {
        return userProfiles[0].length; //TODO test if no user
    } else {
        //TODO support mysql
        throw new Error(process.env.DB_TYPE + " database is not supported now :'(");
    }
}

function buildInsertQuery(user, i) {
    // We assume that there are no social login to migrate.
    // That's the case at RTS : we have social login but they are migrated from openAM to the idp as local account
    // BR is not supposed to have social login
    if (process.env.DB_TYPE === "postgres") {
        var login = user[0][i].email;
        var password = user[0][i].password;
        var verified = user[0][i].verified ? true : false;
        var password_changed_at = user[0][i].password_changed_at;
        var last_login_at = user[0][i].last_login_at;
        var user_id = user[0][i].id;

        console.log("user [" + i + "] login: " + login);
        console.log("user [" + i + "] password: " + password);
        console.log("user [" + i + "] verified: " + verified);
        console.log("user [" + i + "] password_changed_at: " + password_changed_at);
        console.log("user [" + i + "] last_login_at: " + last_login_at);
        console.log("user [" + i + "] user_id: " + user_id);

        return "insert into \"public\".\"LocalLogins\" (login, password, verified, password_changed_at, last_login_at, user_id) " +
            " VALUES ('" + login + "', '" + password + "', '" + verified + "', '" + password_changed_at + "', '" + last_login_at + "', '" + user_id + "')";
    } else {
        //TODO support mysql
        throw new Error(process.env.DB_TYPE + " database is not supported now :'(");
    }
}

function buildUpdateQueries(userProfile, i) {
    if (process.env.DB_TYPE === "postgres") {
        console.log('userProfile[0][i]', userProfile[0][i]);
        var userId = userProfile[0][i].user_id;
        var fieldsToUpdates = [];
        //TODO extract common part of the query and use ".format"
        if (userProfile[0][i].firstname) {
            fieldsToUpdates.push("update \"public\".\"Users\" set 'first_name' =  '" + userProfile[0][i].firstname + "' where id = " + userId);
        }
        if (userProfile[0][i].lastname) {
            fieldsToUpdates.push("update \"public\".\"Users\" set 'first_name' =  '" + userProfile[0][i].lastname + "' where id = " + userId);
        }
        if (userProfile[0][i].gender) {
            fieldsToUpdates.push("update \"public\".\"Users\" set 'first_name' =  '" + userProfile[0][i].gender + "' where id = " + userId);
        }
        if (userProfile[0][i].date_of_birth) {
            fieldsToUpdates.push("update \"public\".\"Users\" set 'first_name' =  '" + userProfile[0][i].date_of_birth + "' where id = " + userId);
        }
        if (userProfile[0][i].language) {
            fieldsToUpdates.push("update \"public\".\"Users\" set 'first_name' =  '" + userProfile[0][i].language + "' where id = " + userId);
        }
        return fieldsToUpdates;
    } else {
        //TODO support mysql
        throw new Error(process.env.DB_TYPE + " database is not supported now :'(");
    }
}


module.exports = {
    up: function (queryInterface, Sequelize) {
        return new Promise(function (resolve, reject) {
            //FIXME POSTGRES specific use process.env.DB_TYPE to see if current run use postgres (RTS) or mysql(BR). For other Database don't do anything and CRASH
            return queryInterface.sequelize.query(getUserSelectQuery()).then(function (users) {
                var batch = [];
                // insert data in appropriate table
                let nb = getUsersSelectQueryNbOfResult(users);
                for (var i = 0; i < nb; i++) {
                    console.log("Migratinf local login " + (i + 1) + " of " + nb);
                    batch.push(queryInterface.sequelize.query(buildInsertQuery(users, i)));
                }

                return Promise.all(batch);
            }).then(function () {
                console.log("now migrating user profile...");
                return queryInterface.sequelize.query(getUserProfileSelectQuery());
            }).then(function (userProfiles) {
                var batch = [];
                // insert data in appropriate table
                let nb = getUserProfilesSelectQueryNbOfResult(userProfiles);
                for (var i = 0; i < nb; i++) {
                    console.log("Migrating user profile " + (i + 1) + " of " + nb + "...");
                    var updateQueries = buildUpdateQueries(userProfiles[0][i], i);
                    for (var j = 0; j < updateQueries.length; j++) {
                        console.log("New udpate query", j);
                        console.log("updateQueries[" + j + "]:", updateQueries[j]);
                        batch.push(queryInterface.sequelize.query(updateQueries[j]));
                    }
                }
                return Promise.all(batch);
                //TODO
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
