"use strict";

var generate = require('../../lib/generate');
var messages = require('../../lib/messages');
var db = require('../../models');

var requestHelper = require('../request-helper');
var dbHelper = require('../db-helper');

var chai = require('chai');
var chaiJquery = require('chai-jquery');
var chaiHttp = require('chai-http');

chai.use(chaiHttp);

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
                requestHelper.sendRequest(self, '/admin/users/5/role', {
                    cookie: self.cookie,
                    method: 'post',
                    data: {role : 1}
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
                requestHelper.sendRequest(self, '/admin/users/5/role', {
                    cookie: self.cookie,
                    method: 'post',
                    data: {role : 1}
            }, done);
            });

            it('should return status 200', function () {
                expect(self.res.statusCode).to.equal(200);
            });

        });

        context('When the user request ungrant admin right', function () {
            before(function (done) {
                requestHelper.sendRequest(self, '/admin/users/5/role', {
                    cookie: self.cookie,
                    method: 'post',
                    data: {role : 2}
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

describe('POST /admin/users/<id>/role ', function () {
    context('When target user is an admin', function () {

        var self = this;

        before(resetDatabase);

        before(function (done) {
            // Login with a non admin login
            requestHelper.login(self, done);
        });

        before(function (done) {
            requestHelper.sendRequest(self, '/admin/users/5/role', {
                cookie: self.cookie,
                method: 'post',
                data: {role : 2}
            }, done);
        });

        before(function (done) {
            db.User.findOne({where: {id: 5}})
                .then(function (user) {
                    self.user = user;
                    done();
                })
        });

        it('should return status 200 and role_id should be 2', function () {
            expect(self.res.statusCode).to.equal(200);
            expect(self.user.role_id === 2);
        });
    });
    context('When target user is not an admin', function () {
        var self = this;

        before(resetDatabase);

        before(function (done) {
            // Login with a non admin login
            requestHelper.login(self, done);
        });

        before(function (done) {
            requestHelper.sendRequest(self, '/admin/users/6/role', {
                cookie: self.cookie,
                method: 'post',
                data: {role : 2}
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
            expect(self.user.role_id === 2);
        });

    });


});

describe('POST /admin/users/<id>/role ', function () {

    context('when target user is not an admin', function () {
        var self = this;

        before(resetDatabase);

        before(function (done) {
            // Login with a non admin login
            requestHelper.login(self, done);
        });

        before(function (done) {
            requestHelper.sendRequest(self, '/admin/users/6/role', {
                cookie: self.cookie,
                method: 'post',
                data: {role : 1}
            }, done);
        });

        before(function (done) {
            db.User.findOne({where: {id: 6}})
                .then(function (user) {
                    self.user = user;
                    done();
                })
        });

        it('should return status 200 and role id shoud be 1', function () {
            expect(self.res.statusCode).to.equal(200);
            expect(self.user.role_id === 1);
        });
    });

    context('when target user is an admin', function () {
        var self = this;

        before(resetDatabase);

        before(function (done) {
            // Login with a non admin login
            requestHelper.login(self, done);
        });

        before(function (done) {
            requestHelper.sendRequest(self, '/admin/users/5/role', {
                cookie: self.cookie,
                method: 'post',
                data: {role : 1}
            }, done);
        });

        before(function (done) {
            db.User.findOne({where: {id: 5}})
                .then(function (user) {
                    self.user = user;
                    done();
                })
        });

        it('should return status 200 and role id shoud be 1', function () {
            expect(self.res.statusCode).to.equal(200);
            expect(self.user.role_id === 1);
        });
    });
});

describe('GET /admin/users', function () {
    context('When the admin is authenticated', function () {
        var self = this;

        before(resetDatabase);

        before(function (done) {
            requestHelper.loginCustom('testuser', 'testpassword', self, done);
        });

        before(function (done) {
            // console.log("the cookie", self.cookie);
            requestHelper.sendRequest(this, '/admin/users', {
                cookie: self.cookie,
                parseDOM: true
            }, done);
        });

        it('should return status 200', function () {
            expect(this.res.statusCode).to.equal(200);
        });

        it('should return HTML', function () {
            expect(this.res.headers['content-type']).to.equal('text/html; charset=utf-8');
        });

        it('should show the right number of users in table', function () {
            expect(this.$('table > tbody > tr').length).to.equal(2);
        });

        it('should show the right text and buttons for admin and user', function () {
            expect(this.$('#user-5 .admin-text')).to.be.visible;
            expect(this.$('#user-6 .admin-text')).to.be.hidden;
        });

    });

    context('When the user is not authenticated', function () {

    });
});

describe('GET /admin/users/csv', function () {

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
        expect(self.res).to.have.header('content-disposition', 'attachment; filename=users.csv');
        expect(self.res).to.have.header('content-type', 'text/csv; charset=utf-8');
        expect(self.res).to.have.header('content-length', '54');
        expect(self.res.text).to.equal('email,role_id,role\r\ntestuser,1,admin\r\nuser@user.ch,,\r\n');
    });


});
