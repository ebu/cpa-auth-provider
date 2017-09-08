"use strict";

var db = require('../models');

var async = require('async');

module.exports = {
    clearDatabase: function (done) {
        var tables = [
            'AccessTokens',
            'OAuth2AuthorizationCodes',
            'OAuth2Clients',
            'Clients',
            'Domains',
            'IdentityProviders',
            'PairingCodes',
            'Users',
            'Permissions',
            'UserProfiles'
        ];

        var deleteData = function (table, done) {
            db.sequelize.query("DELETE from " + table).then(
                function () {
                    done();
                },
                done);
        };

        async.eachSeries(tables, deleteData, done);
    },

    resetDatabase: function (populateDatabase, done) {
        this.clearDatabase(function (error) {
            if (error) {
                done(error);
            }
            else {
                populateDatabase(function (error) {
                    done(error);
                });
            }
        });
    },

    createFakeUser: function (userTemplate, done) {
        return db.User.create(userTemplate).then(function (user) {
            return user.setPassword(userTemplate.password);
        }).then(
            function () {
                done();
            }
        );
    }
};

