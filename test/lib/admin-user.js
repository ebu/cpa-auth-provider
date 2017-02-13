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
            )
            .then(function () {
                db.User.create({
                    id: 6,
                    email: 'user@user.ch',
                    provider_uid: 'testuser'
                })
            })

            .then(function () {
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

describe('GET /admin/users security', function () {

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
                requestHelper.sendRequest(self, '/admin/users/5/grant', {
                    cookie: self.cookie,
                    method: 'post'
                }, done);
            });

            it('should return status 403', function () {
                expect(self.res.statusCode).to.equal(403);
            });

        });

        context('When the user request ungrant admin right', function () {
            before(function (done) {
                requestHelper.sendRequest(self, '/admin/users/5/ungrant', {
                    cookie: self.cookie,
                    method: 'post'
                }, done);
            });

            it('should return status 403', function () {
                expect(self.res.statusCode).to.equal(403);
            });

        });

        context('When the user request download cvs list', function () {
            before(function (done) {
                requestHelper.sendRequest(self, '/admin/users/csv', {
                    cookie: self.cookie,
                    method: 'get'
                }, done);
            });

            it('should return status 403', function () {
                expect(self.res.statusCode).to.equal(403);
            });

        });

        context('When the user request user list', function () {
            before(function (done) {
                requestHelper.sendRequest(self, '/admin/users', {
                    cookie: self.cookie,
                    method: 'get'
                }, done);
            });

            it('should return status 403', function () {
                expect(self.res.statusCode).to.equal(403);
            });

        });


    });

    context('When the user is authenticated and is admin, testing (un)grant', function () {

        var self = this;

        before(resetDatabase);

        before(function (done) {
            // Login with an admin login
            requestHelper.login(self, done);
        });

        context('When the user request grant admin right', function () {
            before(function (done) {
                requestHelper.sendRequest(self, '/admin/users/5/grant', {
                    cookie: self.cookie,
                    method: 'post'
                }, done);
            });

            it('should return status 200', function () {
                expect(self.res.statusCode).to.equal(200);
            });

        });

        context('When the user request ungrant admin right', function () {
            before(function (done) {
                requestHelper.sendRequest(self, '/admin/users/5/ungrant', {
                    cookie: self.cookie,
                    method: 'post'
                }, done);
            });

            it('should return status 200', function () {
                expect(self.res.statusCode).to.equal(200);
            });

        });
    });

    context('When the user is authenticated and is admin', function () {

        var self = this;

        before(resetDatabase);

        before(function (done) {
            // Login with an admin login
            requestHelper.login(self, done);
        });

        before(function (done) {
            requestHelper.sendRequest(self, '/admin/users/csv/', {
                cookie: self.cookie,
                method: 'get'
            }, done);
        });

        it('should return status 200', function () {
            expect(self.res.statusCode).to.equal(200);
        });

    });

    context('When the user is authenticated and is admin', function () {

        var self = this;

        before(resetDatabase);

        before(function (done) {
            // Login with an admin login
            requestHelper.login(self, done);
        });
        before(function (done) {
            requestHelper.sendRequest(self, '/admin/users', {
                cookie: self.cookie,
                method: 'get'
            }, done);
        });

        it('should return status 200', function () {
            expect(self.res.statusCode).to.equal(200);
        });

    });

});

describe('POST /admin/users/<id>/grant', function () {
    var self = this;

    before(resetDatabase);

    before(function (done) {
        // Login with a non admin login
        requestHelper.login(self, done);
    });

    before(function (done) {
        requestHelper.sendRequest(self, '/admin/users/5/ungrant', {
            cookie: self.cookie,
            method: 'post'
        }, done);
    });

    before(function (done) {
        db.User.findOne({where: {id: 5}})
            .then(function (user) {
                self.user = user;
                done();
            })
    });

    it('should return status 200', function () {
        expect(self.res.statusCode).to.equal(200);
        expect(self.user.role_id === 2);
    });

});


describe('POST /admin/users/<id>/grant', function () {
    var self = this;

    before(resetDatabase);

    before(function (done) {
        // Login with a non admin login
        requestHelper.login(self, done);
    });

    before(function (done) {
        requestHelper.sendRequest(self, '/admin/users/6/grant', {
            cookie: self.cookie,
            method: 'post'
        }, done);
    });

    before(function (done) {
        db.User.findOne({where: {id: 6}})
            .then(function (user) {
                self.user = user;
                done();
            })
    });

    it('should return status 200', function () {
        expect(self.res.statusCode).to.equal(200);
        expect(self.user.role_id === 1);
    });

});
