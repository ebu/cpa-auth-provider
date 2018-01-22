'use strict';

var util = require('util');

//SQL Magic (POSTGRES) query to be able to run that migration file as much as you want :)
// ﻿DELETE FROM public."SequelizeMeta" WHERE name='20180115120000-change-email-in-social-account-2-data.js';
// ﻿DELETE FROM public."LocalLogins";


function getSQLDateFormated(date) {
    return date.getUTCFullYear() + "-" +
        ("00" + (date.getUTCMonth() + 1)).slice(-2) + "-" +
        ("00" + date.getUTCDate()).slice(-2) + " " +
        ("00" + date.getUTCHours()).slice(-2) + ":" +
        ("00" + date.getUTCMinutes()).slice(-2) + ":" +
        ("00" + date.getUTCSeconds()).slice(-2);
}

function getUserSelectQuery() {
    if (process.env.DB_TYPE === "postgres") {
        return "select * from \"public\".\"Users\"";
    } else {
        return "select * from Users";
    }
}

function getUserProfileSelectQuery() {
    if (process.env.DB_TYPE === "postgres") {
        return "select * from \"public\".\"UserProfiles\"";
    } else {
        return "select * from UserProfiles";
    }
}

function getUsersSelectQueryNbOfResult(users) {
    if (process.env.DB_TYPE === "postgres") {
        return users[0].length; //TODO test if no user
    } else {
        console.log("zy va le user: ", users);
        return users[0].length; //TODO test if no user

    }
}

function getUserProfilesSelectQueryNbOfResult(userProfiles) {
    if (process.env.DB_TYPE === "postgres") {
        return userProfiles[0].length; //TODO test if no user
    } else {
        console.log("zy va le user: ", userProfiles);
        return userProfiles[0].length; //TODO test if no user

    }
}

function buildInsertQuery(user) {

    var login = user.email;
    var password = user.password;
    var verified = user.verified ? true : false;
    var password_changed_at = user.password_changed_at;
    var last_login_at = user.last_login_at;
    var user_id = user.id;
    var created_at = getSQLDateFormated(user.created_at);
    var updated_at = getSQLDateFormated(user.updated_at);

    // We assume that there are no social login to migrate.
    // That's the case at RTS : we have social login but they are migrated from openAM to the idp as local account
    // BR is not supposed to have social login
    if (process.env.DB_TYPE === "postgres") {

        console.log("user login: " + login);
        console.log("user password: " + password);
        console.log("user verified: " + verified);
        console.log("user password_changed_at: " + password_changed_at);
        console.log("user last_login_at: " + last_login_at);
        console.log("user user_id: " + user_id);
        console.log("user created_at: " + created_at);
        console.log("user updated_at: " + updated_at);

        return "insert into \"public\".\"LocalLogins\" (login, password, verified, password_changed_at, last_login_at, user_id, created_at, updated_at) " +
            " VALUES ('" + login + "', '" + password + "', '" + verified + "', '" + password_changed_at + "', '" + last_login_at + "', '" + user_id + "', '" + created_at + "', '" + updated_at + "')";
    } else {
        return "insert into LocalLogins (login, password, verified, password_changed_at, last_login_at, user_id, created_at, updated_at) " +
            " VALUES ('" + login + "', '" + password + "', '" + verified + "', '" + password_changed_at + "', '" + last_login_at + "', '" + user_id + "', '" + created_at + "', '" + updated_at + "')";
    }
}

function buildUpdateQueries(userProfile) {
    var fieldsToUpdates = [];
    var updateQuery;
    var userId = userProfile.user_id;

    if (process.env.DB_TYPE === "postgres") {
        updateQuery = "update \"public\".\"Users\" set %s =  '%s' where id = " + userId;
    } else {
        updateQuery = "update Users set %s =  '%s' where id = " + userId;
    }
    if (userProfile.firstname) {
        fieldsToUpdates.push(util.format(updateQuery, "firstname", userProfile.firstname));
    }
    if (userProfile.lastname) {
        fieldsToUpdates.push(util.format(updateQuery, "lastname", userProfile.lastname));
    }
    if (userProfile.gender) {
        fieldsToUpdates.push(util.format(updateQuery, "gender", userProfile.gender));
    }
    if (userProfile.date_of_birth) {
        fieldsToUpdates.push(util.format(updateQuery, "date_of_birth", userProfile.date_of_birth));
    }
    if (userProfile.language) {
        fieldsToUpdates.push(util.format(updateQuery, "language", userProfile.language));
    }
    return fieldsToUpdates;

}

function getLocalProfileInsertQuery() {
    if (process.env.DB_TYPE === "postgres") {
        return "INSERT INTO public.\"LocalLogins\" (id, login, password, verified, password_changed_at, last_login_at, user_id, created_at, updated_at)  SELECT id, email, password, verified, password_changed_at, last_login_at, id, created_at, updated_at FROM public.\"Users\"\n";
    } else {
        throw new Error("mysql WIP");
    }
}

function getUserUpdateQuery(){
    if (process.env.DB_TYPE === "postgres") {
        return "UPDATE public.\"Users\" SET firstname=up.firstname, lastname=up.lastname, gender=up.gender, date_of_birth=up.date_of_birth, language=up.language FROM public.\"Users\" as u, public.\"UserProfiles\" as up WHERE u.id=up.user_id";
    } else {
        throw new Error("mysql WIP");
    }
 }


module.exports = {
    up: function (queryInterface, Sequelize) {
        return new Promise(function (resolve, reject) {
            // return queryInterface.sequelize.query(getUserSelectQuery()).then(function (users) {
            //     var batch = [];
            //     // insert data in appropriate table
            //     let nb = getUsersSelectQueryNbOfResult(users);
            //     for (var i = 0; i < nb; i++) {
            //         console.log("Migrating local login " + (i + 1) + " of " + nb);
            //         batch.push(queryInterface.sequelize.query(buildInsertQuery(users[0][i])));
            //     }
            //
            //     return Promise.all(batch);
            return queryInterface.sequelize.query(getLocalProfileInsertQuery()).then(function () {
            //     console.log("now migrating user profile...");
            //     return queryInterface.sequelize.query(getUserProfileSelectQuery());
            // }).then(function (userProfiles) {
            //     var batch = [];
            //     // insert data in appropriate table
            //     let nb = getUserProfilesSelectQueryNbOfResult(userProfiles);
            //     for (var i = 0; i < nb; i++) {
            //         console.log("Migrating user profile " + (i + 1) + " of " + nb + "...");
            //         var updateQueries = buildUpdateQueries(userProfiles[0][i]);
            //         for (var j = 0; j < updateQueries.length; j++) {
            //             console.log("updateQueries[" + j + "]:", updateQueries[j]);
            //             batch.push(queryInterface.sequelize.query(updateQueries[j]));
            //         }
            //     }
            //     return Promise.all(batch);
                return queryInterface.sequelize.query(getUserUpdateQuery());
            }).then(resolve).catch(reject);
        });
    },

    down: function (queryInterface, Sequelize) {
        return new Promise(function (resolve, reject) {
            resolve();
        });
    }
}
