/*jshint expr:true */
"use strict";

var generate = require('../../lib/generate');
var messages = require('../../lib/messages');
var db = require('../../models');

var requestHelper = require('../request-helper');
var dbHelper = require('../db-helper');
var config = require('../../config');

var chai = require('chai');
var chaiJquery = require('chai-jquery');
var chaiHttp = require('chai-http');

chai.use(chaiHttp);

var initDatabase = function (done) {
    db.Permission
        .create({
                id: 1,
                label: "admin"
            }
        ).then(function () {
        db.Permission
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
                });
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
                        return user.updateAttributes({permission_id: 1});
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
            });
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
                    return user.updateAttributes({permission_id: 2});
                })
                .then(done());
        });

        before(function (done) {
            // Login with a non admin login
            requestHelper.login(self, done);
        });

        context('When the user request grant admin right', function () {
            before(function (done) {
                requestHelper.sendRequest(self, '/admin/users/5/permission', {
                    cookie: self.cookie,
                    method: 'post',
                    data: {permission: 1}
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
                requestHelper.sendRequest(self, '/admin/users/5/permission', {
                    cookie: self.cookie,
                    method: 'post',
                    data: {permission: 1}
                }, done);
            });

            it('should return status 200', function () {
                expect(self.res.statusCode).to.equal(200);
            });

        });

        context('When the user request ungrant admin right', function () {
            before(function (done) {
                requestHelper.sendRequest(self, '/admin/users/5/permission', {
                    cookie: self.cookie,
                    method: 'post',
                    data: {permission: 2}
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

describe('POST /admin/users/<id>/permission ', function () {
    context('When target user is an admin', function () {

        var self = this;

        before(resetDatabase);

        before(function (done) {
            // Login with a non admin login
            requestHelper.login(self, done);
        });

        before(function (done) {
            requestHelper.sendRequest(self, '/admin/users/5/permission', {
                cookie: self.cookie,
                method: 'post',
                data: {permission: 2}
            }, done);
        });

        before(function (done) {
            db.User.findOne({where: {id: 5}})
                .then(function (user) {
                    self.user = user;
                    done();
                });
        });

        it('should return status 200 and permission_id should be 2', function () {
            expect(self.res.statusCode).to.equal(200);
            expect(self.user.permission_id === 2);
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
            requestHelper.sendRequest(self, '/admin/users/6/permission', {
                cookie: self.cookie,
                method: 'post',
                data: {permission: 2}
            }, done);
        });

        before(function (done) {
            db.User.findOne({where: {id: 6}})
                .then(function (user) {
                    self.user = user;
                    done();
                });
        });

        it('should return status 200', function () {
            expect(self.res.statusCode).to.equal(200);
            expect(self.user.permission_id === 2);
        });

    });


});

describe('POST /admin/users/<id>/permission ', function () {

    context('when target user is not an admin', function () {
        var self = this;

        before(resetDatabase);

        before(function (done) {
            // Login with a non admin login
            requestHelper.login(self, done);
        });

        before(function (done) {
            requestHelper.sendRequest(self, '/admin/users/6/permission', {
                cookie: self.cookie,
                method: 'post',
                data: {permission: 1}
            }, done);
        });

        before(function (done) {
            db.User.findOne({where: {id: 6}})
                .then(function (user) {
                    self.user = user;
                    done();
                });
        });

        it('should return status 200 and permission id shoud be 1', function () {
            expect(self.res.statusCode).to.equal(200);
            expect(self.user.permission_id === 1);
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
            requestHelper.sendRequest(self, '/admin/users/5/permission', {
                cookie: self.cookie,
                method: 'post',
                data: {permission: 1}
            }, done);
        });

        before(function (done) {
            db.User.findOne({where: {id: 5}})
                .then(function (user) {
                    self.user = user;
                    done();
                });
        });

        it('should return status 200 and permission id shoud be 1', function () {
            expect(self.res.statusCode).to.equal(200);
            expect(self.user.permission_id === 1);
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
            config.displayUsersInfos = false;
            requestHelper.sendRequest(this, '/admin/users', {
                cookie: self.cookie,
                parseDOM: true
            }, done);
        });

        it('should return status 404 if config.displayUsersInfos is false', function () {
            expect(this.res.statusCode).to.equal(404);
        });

    });

    context('When the admin is authenticated', function () {
        var self = this;

        before(resetDatabase);

        before(function (done) {
            requestHelper.loginCustom('testuser', 'testpassword', self, done);
        });

        before(function (done) {
            config.displayUsersInfos = true;
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

    before(function () {
        self.clock = sinon.useFakeTimers(new Date("Jan 29 2017 11:11:00 GMT+0000").getTime(), "Date");
    });
    after(function () {
        self.clock.restore();
    });

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
        expect(self.res).to.have.header('content-length', '303'); // That check might fail if you update the format, so you'll have to check the new length make sens before updating it
        expect(self.res.text).match(/email,permission_id,permission,created,password_changed,last_login\r\ntestuser,1,admin,[A-Za-z0-9 :+()]+,[A-Za-z0-9 :+()]+,[A-Za-z0-9 :+()]*\r\nuser@user.ch,,,[A-Za-z0-9 :+()]+,[A-Za-z0-9 :+()]+,[A-Za-z0-9 :+()]*\r\n/);
        // expect(self.res.text).to.equal('email,permission_id,permission\r\ntestuser,1,admin\r\nuser@user.ch,,\r\n');
    });


});


describe('GET /admin/clients/all', function () {

    var self = this;

    before(resetDatabase);

    before(function (done) {
        // Login with an admin login
        requestHelper.login(self, done);
    });

    before(function (done) {
        requestHelper.sendRequest(self, '/admin/clients/all', {
            cookie: self.cookie,
            method: 'get'
        }, done);
    });

    it('should return status 200', function () {
        expect(self.res.statusCode).to.equal(200);
    });

});


describe('GET /admin/clients', function () {

    context('When no clients in db', function () {


        var self = this;

        before(resetDatabase);

        before(function (done) {
            // Login with an admin login
            requestHelper.login(self, done);
        });

        before(function (done) {
            requestHelper.sendRequest(self, '/admin/clients', {
                cookie: self.cookie,
                method: 'get'
            }, done);
        });

        it('should return status 200 and an empty array', function () {
            expect(self.res.statusCode).to.equal(200);
            expect(self.res.text).to.equal("[]");
        });

    });
    context('When 2 clients in db', function () {

        var self = this;

        before(resetDatabase);

        before(function (done) {
            db.OAuth2Client.create({
                id: 1,
                client_id: "db05acb0c6ed902e5a5b7f5ab79e7144",
                client_secret: "49b7448061fed2319168eb2449ef3b58226a9c554b3ff0b138abe8ffad98",
                name: "OAuth 2.0 Client"
            }).then(function () {
                done();
            });
        });

        before(function (done) {
            // Login with an admin login
            requestHelper.login(self, done);
        });

        before(function (done) {
            requestHelper.sendRequest(self, '/admin/clients', {
                cookie: self.cookie,
                method: 'get'
            }, done);
        });

        it('should return status 200 an array with 1 element', function () {
            expect(self.res.statusCode).to.equal(200);
            var res = JSON.parse(self.res.text);
            expect(res[0].id).to.equal(1);
            expect(res[0].client_id).to.equal("db05acb0c6ed902e5a5b7f5ab79e7144");
            expect(res[0].client_secret).to.equal("49b7448061fed2319168eb2449ef3b58226a9c554b3ff0b138abe8ffad98");
            expect(res[0].name).to.equal("OAuth 2.0 Client");
        });

    });
});

describe('GET /admin/clients/id', function () {

    context('When no clients in db', function () {


        var self = this;

        before(resetDatabase);

        before(function (done) {
            // Login with an admin login
            requestHelper.login(self, done);
        });

        before(function (done) {
            requestHelper.sendRequest(self, '/admin/clients/1', {
                cookie: self.cookie,
                method: 'get'
            }, done);
        });

        it('should return status 404', function () {
            expect(self.res.statusCode).to.equal(404);
        });

    });
    context('When 2 clients in db', function () {

        var self = this;

        before(resetDatabase);

        before(function (done) {
            db.OAuth2Client.create({
                id: 1,
                client_id: "db05acb0c6ed902e5a5b7f5ab79e7144",
                client_secret: "49b7448061fed2319168eb2449ef3b58226a9c554b3ff0b138abe8ffad98",
                name: "OAuth 2.0 Client"
            }).then(function () {
                db.OAuth2Client.create({
                    id: 2,
                    client_id: "222",
                    client_secret: "22222222222",
                    name: "OAuth 2.0 Client 2"
                }).then(function () {
                    done();
                });
            });
        });

        before(function (done) {
            // Login with an admin login
            requestHelper.login(self, done);
        });

        before(function (done) {
            requestHelper.sendRequest(self, '/admin/clients/1', {
                cookie: self.cookie,
                method: 'get'
            }, done);
        });

        it('should return status 200 an empty array', function () {
            expect(self.res.statusCode).to.equal(200);
            var res = JSON.parse(self.res.text);
            expect(res.id).to.equal(1);
            expect(res.client_id).to.equal("db05acb0c6ed902e5a5b7f5ab79e7144");
            expect(res.client_secret).to.equal("49b7448061fed2319168eb2449ef3b58226a9c554b3ff0b138abe8ffad98");
            expect(res.name).to.equal("OAuth 2.0 Client");
        });

    });
});


describe('DELETE /admin/clients/id', function () {

    context('When no clients in db', function () {


        var self = this;

        before(resetDatabase);

        before(function (done) {
            // Login with an admin login
            requestHelper.login(self, done);
        });

        before(function (done) {
            requestHelper.sendRequest(self, '/admin/clients/1', {
                cookie: self.cookie,
                method: 'delete'
            }, done);
        });

        it('should return status 200', function () {
            expect(self.res.statusCode).to.equal(200);
        });

    });
    context('When 2 clients in db', function () {

        var self = this;

        before(resetDatabase);

        before(function (done) {
            db.OAuth2Client.create({
                id: 2,
                client_id: "222",
                client_secret: "22222222222",
                name: "OAuth 2.0 Client 2"
            }).then(function () {
                db.OAuth2Client.create({
                    id: 1,
                    client_id: "db05acb0c6ed902e5a5b7f5ab79e7144",
                    client_secret: "49b7448061fed2319168eb2449ef3b58226a9c554b3ff0b138abe8ffad98",
                    name: "OAuth 2.0 Client"
                }).then(function () {
                    done();
                });
            });
        });

        before(function (done) {
            // Login with an admin login
            requestHelper.login(self, done);
        });

        before(function (done) {
            requestHelper.sendRequest(self, '/admin/clients/2', {
                cookie: self.cookie,
                method: 'delete'
            }, done);
        });


        before(function (done) {
            requestHelper.sendRequest(self, '/admin/clients', {
                cookie: self.cookie,
                method: 'get'
            }, done);
        });

        it('should return status 200 an array with one element', function () {
            expect(self.res.statusCode).to.equal(200);
            var res = JSON.parse(self.res.text);
            expect(res[0].id).to.equal(1);
            expect(res[0].client_id).to.equal("db05acb0c6ed902e5a5b7f5ab79e7144");
            expect(res[0].client_secret).to.equal("49b7448061fed2319168eb2449ef3b58226a9c554b3ff0b138abe8ffad98");
            expect(res[0].name).to.equal("OAuth 2.0 Client");
            expect(res.length).to.equal(1);
        });

    });
});

describe('POST /admin/clients', function () {

    var self = this;

    before(resetDatabase);

    before(function (done) {
        // Login with an admin login
        requestHelper.login(self, done);
    });

    before(function (done) {
        requestHelper.sendRequest(self, '/admin/clients', {
            cookie: self.cookie,
            method: 'post',
            data: {
                client_id: "db05acb0c6ed902e5a5b7f5ab79e7144",
                // client_secret: "49b7448061fed2319168eb2449ef3b58226a9c554b3ff0b138abe8ffad98",
                name: "OAuth 2.0 Client"
            }
        }, done);
    });

    before(function (done) {
        requestHelper.sendRequest(self, '/admin/clients', {
            cookie: self.cookie,
            method: 'get'
        }, done);
    });

    it('should return status 200 an array with one element containing a client_secret (length 60)', function () {
        expect(self.res.statusCode).to.equal(200);
        var res = JSON.parse(self.res.text);
        console.log(res);
        expect(res[0].client_id).to.equal("db05acb0c6ed902e5a5b7f5ab79e7144");
        expect(res[0].name).to.equal("OAuth 2.0 Client");
        expect(res[0].client_secret.length).to.equal(60);
    });

});


