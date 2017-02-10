"use strict";

var generate = require('../../lib/generate');
var messages = require('../../lib/messages');
var db = require('../../models');

var requestHelper = require('../request-helper');
var dbHelper = require('../db-helper');

var initDatabase = function (done) {

    db.Role
        .create({
                id: 1,
                label: "admin"
            }
        ).then(function () {
        db.Role
            .create({
                    id: 2,
                    label: "other"
                }
            ).then(function () {
            db.User.create({
                id: 5,
                email: 'testuser',
                provider_uid: 'testuser'
            })
                .then(function (user) {
                    return user.setPassword('testpassword');
                })
                .then(function (user) {
                    return user.updateAttributes({role_id: 1});
                })
                .then(function (user) {
                    return db.Domain.create({
                        id: 5,
                        name: 'example-service.bbc.co.uk',
                        display_name: 'BBC',
                        access_token: '70fc2cbe54a749c38da34b6a02e8dfbd'
                    });
                })
                .then(
                    function () {
                        done();
                    },
                    function (error) {
                        done(new Error(error));
                    });
        })
    });


};

var resetDatabase = function (done) {
    dbHelper.clearDatabase(function (err) {
        if (err) {
            done(err);
        }
        else {
            initDatabase(done);
        }
    });
};

describe('GET /admin/users', function () {

    context('When the user is authenticated and is not admin', function () {

        var self = this;

        before(resetDatabase);

        // Remove admin rights
        before(function (done) {
            db.User.findOne({where: {id: 5}})
                .then(function (user) {
                    return user.updateAttributes({role_id: 2});
                })
                .then(done());
        });

        before(function (done) {
            // Login with a non admin login
            requestHelper.login(self, done);
        });

        context('When the user request grant admin right', function () {
            before(function (done) {
                requestHelper.sendRequest(self, '/admin/user/5/grant', {
                    cookie: self.cookie,
                    method: 'post'
                }, done);
            });

            it('should return status 403', function () {
                expect(self.res.statusCode).to.equal(403);
            });

        });


    });


});

