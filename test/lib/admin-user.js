/*jshint expr:true */
"use strict";

var db = require('../../models');

var requestHelper = require('../request-helper');
var dbHelper = require('../db-helper');
var config = require('../../config');

var chai = require('chai');
var chaiHttp = require('chai-http');

var bcrypt = require('bcrypt');

chai.use(chaiHttp);
chai.Assertion.addProperty('visible', require('chai-visible'));

var PASSWORD = 'UnbreakablePassword01!';

var USER = {
    provider_uid: 'testuser',
    firstname: 'Scott',
    lastname: 'Tiger'
};
var USER_EMAIL = 'user@user.ch';
var ADMIN = {
    provider_uid: 'testuser',
    permission_id: 1,
    firstname: 'John',
    lastname: 'Doe'
};
var ADMIN_EMAIL = 'admin@admin.ch';

var ADMIN_PERMISSION = {
    id: 1,
    label: "admin"
};

var USER_PERMISSION = {
    id: 2,
    label: "other"
};

var adminId;
var userId;

var initDatabase = function (done) {
    return db.Permission.create(ADMIN_PERMISSION).then(function () {
        return db.Permission.create(USER_PERMISSION);
    }).then(function () {
        return db.User.create(USER);
    }).then(function (user) {
        userId = user.id;
        return db.LocalLogin.create({user_id: user.id, login: USER_EMAIL});
    }).then(function (localLogin) {
        return localLogin.setPassword(PASSWORD);
    }).then(function () {
        return db.User.create(ADMIN);
    }).then(function (user) {
        adminId = user.id;
        return db.LocalLogin.create({user_id: user.id, login: ADMIN_EMAIL});
    }).then(function (localLogin) {
        return localLogin.setPassword(PASSWORD);
    }).then(
        function () {
            done();
        },
        function (error) {
            done(new Error(error));
        });
};


var resetDatabase = function (done) {
    return dbHelper.clearDatabase(function (err) {
        if (err) {
            return done(err);
        }
        else {
            return initDatabase(done);
        }
    });
};

describe('GET /admin/users security', function () {

    context('When the user is authenticated and is not admin', function () {

        var self = this;

        before(resetDatabase);

        before(function (done) {
            // Login with a non admin login
            requestHelper.loginCustom(USER_EMAIL, PASSWORD, self, done);
        });

        context('When the user request grant admin right', function () {
            before(function (done) {
                requestHelper.sendRequest(self, '/admin/users/' + userId + '/permission', {
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
            requestHelper.loginCustom(ADMIN_EMAIL, PASSWORD, self, done);
        });

        context('When the user request grant admin right', function () {
            before(function (done) {
                requestHelper.sendRequest(self, '/admin/users/' + adminId + '/permission', {
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
                requestHelper.sendRequest(self, '/admin/users/' + adminId + '/permission', {
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
            requestHelper.loginCustom(ADMIN_EMAIL, PASSWORD, self, done);
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
            requestHelper.loginCustom(ADMIN_EMAIL, PASSWORD, self, done);
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
            requestHelper.loginCustom(ADMIN_EMAIL, PASSWORD, self, done);
        });

        before(function (done) {
            requestHelper.sendRequest(self, '/admin/users/' + adminId + '/permission', {
                cookie: self.cookie,
                method: 'post',
                data: {permission: 2}
            }, done);
        });

        before(function (done) {
            db.User.findOne({where: {id: adminId}})
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
            requestHelper.loginCustom(USER_EMAIL, PASSWORD, self, done);
        });

        before(function (done) {
            requestHelper.sendRequest(self, '/admin/users/' + userId + '/permission', {
                cookie: self.cookie,
                method: 'post',
                data: {permission: 2}
            }, done);
        });

        before(function (done) {
            db.User.findOne({where: {id: userId}})
                .then(function (user) {
                    self.user = user;
                    done();
                });
        });

        it('should return status 403', function () {
            expect(self.res.statusCode).to.equal(403);
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
            requestHelper.loginCustom(USER_EMAIL, PASSWORD, self, done);
        });

        before(function (done) {
            requestHelper.sendRequest(self, '/admin/users/' + userId + '/permission', {
                cookie: self.cookie,
                method: 'post',
                data: {permission: 1}
            }, done);
        });

        before(function (done) {
            db.User.findOne({where: {id: userId}})
                .then(function (user) {
                    self.user = user;
                    done();
                });
        });

        it('should return status 403 and permission id shoud be 1', function () {
            expect(self.res.statusCode).to.equal(403);
            expect(self.user.permission_id === 1);
        });
    });

    context('when target user is an admin', function () {
        var self = this;

        before(resetDatabase);

        before(function (done) {
            // Login with an admin login
            requestHelper.loginCustom(ADMIN_EMAIL, PASSWORD, self, done);
        });

        before(function (done) {
            requestHelper.sendRequest(self, '/admin/users/' + adminId + '/permission', {
                cookie: self.cookie,
                method: 'post',
                data: {permission: 1}
            }, done);
        });

        before(function (done) {
            db.User.findOne({where: {id: adminId}})
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
            requestHelper.loginCustom(ADMIN_EMAIL, PASSWORD, self, done);
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
            requestHelper.loginCustom(ADMIN_EMAIL, PASSWORD, self, done);
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

    });

    context('When the user is not authenticated', function () {
        var self = this;

        before(resetDatabase);

        before(function (done) {
            config.displayUsersInfos = true;
            requestHelper.sendRequest(this, '/admin/users', {
                parseDOM: true
            }, done);
        });

        it('should return redirect to login (status 302)', function () {
            expect(this.res.statusCode).to.equal(302);
            expect(this.res.text).to.equal('Found. Redirecting to /ap/auth');
        });

    });
});

describe('GET /admin/users/csv', function () {

    var self = this;

    before(function () {
        self.clock = sinon.useFakeTimers(new Date("Jan 29 2017 11:11:00 GMT+0000").getTime());
    });
    after(function () {
        self.clock.restore();
    });

    before(resetDatabase);

    before(function (done) {
        // Login with an admin login
        requestHelper.loginCustom(ADMIN_EMAIL, PASSWORD, self, done);
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
        var lines = self.res.text.split(/\r?\n/);
        expect(lines.length).to.equal(4);
        expect(lines[0]).to.equal('id,email,firstname,lastname,permission_id,permission,created,password_changed,last_login');
        expect(lines[1].indexOf('admin@admin.ch,John,Doe,1,admin')).to.be.greaterThan(0);
        expect(lines[2].indexOf('user@user.ch,Scott,Tiger,,')).to.be.greaterThan(0);
        expect(lines[3]).to.equal('');
    });


});


describe('GET /admin/clients', function () {

    var self = this;

    before(resetDatabase);

    before(function (done) {
        // Login with an admin login
        requestHelper.loginCustom(ADMIN_EMAIL, PASSWORD, self, done);
    });

    before(function (done) {
        requestHelper.sendRequest(self, '/admin/clients', {
            cookie: self.cookie,
            method: 'get'
        }, done);
    });

    it('should return status 200', function () {
        expect(self.res.statusCode).to.equal(200);
    });

});


describe('GET /api/admin/clients', function () {

    context('When no clients in db', function () {


        var self = this;

        before(resetDatabase);

        before(function (done) {
            // Login with an admin login
            requestHelper.loginCustom(ADMIN_EMAIL, PASSWORD, self, done);
        });

        before(function (done) {
            requestHelper.sendRequest(self, '/api/admin/clients', {
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
            requestHelper.loginCustom(ADMIN_EMAIL, PASSWORD, self, done);
        });

        before(function (done) {
            requestHelper.sendRequest(self, '/api/admin/clients', {
                cookie: self.cookie,
                method: 'get'
            }, done);
        });

        it('should return status 200 an array with 1 element', function () {
            expect(self.res.statusCode).to.equal(200);
            var res = JSON.parse(self.res.text);
            expect(res[0].id).to.equal(1);
            expect(res[0].client_id).to.equal("db05acb0c6ed902e5a5b7f5ab79e7144");
            expect(res[0].client_secret).to.be.undefined;
            expect(res[0].created_at).not.undefined;
            expect(res[0].updated_at).not.undefined;
            expect(res[0].name).to.equal("OAuth 2.0 Client");
        });

    });
});

describe('GET /api/admin/clients/id', function () {

    context('When no clients in db', function () {


        var self = this;

        before(resetDatabase);

        before(function (done) {
            // Login with an admin login
            requestHelper.loginCustom(ADMIN_EMAIL, PASSWORD, self, done);
        });

        before(function (done) {
            requestHelper.sendRequest(self, '/api/admin/clients/1', {
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
            requestHelper.loginCustom(ADMIN_EMAIL, PASSWORD, self, done);
        });

        before(function (done) {
            requestHelper.sendRequest(self, '/api/admin/clients/1', {
                cookie: self.cookie,
                method: 'get'
            }, done);
        });

        it('should return status 200 an empty array', function () {
            expect(self.res.statusCode).to.equal(200);
            var res = JSON.parse(self.res.text);
            expect(res.id).to.equal(1);
            expect(res.client_id).to.equal("db05acb0c6ed902e5a5b7f5ab79e7144");
            expect(res.client_secret).to.be.undefined;
            expect(res.created_at).not.undefined;
            expect(res.updated_at).not.undefined;
            expect(res.name).to.equal("OAuth 2.0 Client");
        });

    });
});

describe('GET /api/admin/clients/:clientId/secret', function () {
    var self = this;

    before(resetDatabase);

    before(function (done) {
        db.OAuth2Client.create({
            id: 1,
            client_id: "db05acb0c6ed902e5a5b7f5ab79e7144",
            client_secret: "secret",
            name: "OAuth 2.0 Client"
        }).then(function () {
            done();
        });
    });

    before(function (done) {
        // Login with an admin login
        requestHelper.loginCustom(ADMIN_EMAIL, PASSWORD, self, done);
    });

    before(function (done) {
        requestHelper.sendRequest(self, '/api/admin/clients/1/secret', {
            cookie: self.cookie,
            method: 'get'
        }, done);
    });

    before(function (done) {
        db.OAuth2Client.findOne({where: {id: 1}}).then(
            function (client) {
                self.clientInDb = client;
                done();
            });
    });

    it('should return status 200, change the password hash, and be validated via bcrypt', function () {
        expect(self.res.statusCode).to.equal(200);
        expect(self.clientInDb.client_secret).to.not.equal("secret");
        expect(bcrypt.compareSync(JSON.parse(self.res.text).secret, self.clientInDb.client_secret)).to.be.true;
    });

});


describe('DELETE /api/admin/clients/id', function () {

    context('When no clients in db', function () {


        var self = this;

        before(resetDatabase);

        before(function (done) {
            // Login with an admin login
            requestHelper.loginCustom(ADMIN_EMAIL, PASSWORD, self, done);
        });

        before(function (done) {
            requestHelper.sendRequest(self, '/api/admin/clients/1', {
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
            requestHelper.loginCustom(ADMIN_EMAIL, PASSWORD, self, done);
        });

        before(function (done) {
            requestHelper.sendRequest(self, '/api/admin/clients/2', {
                cookie: self.cookie,
                method: 'delete'
            }, done);
        });


        before(function (done) {
            requestHelper.sendRequest(self, '/api/admin/clients', {
                cookie: self.cookie,
                method: 'get'
            }, done);
        });

        it('should return status 200 an array with one element', function () {
            expect(self.res.statusCode).to.equal(200);
            var res = JSON.parse(self.res.text);
            expect(res[0].id).to.equal(1);
            expect(res[0].client_id).to.equal("db05acb0c6ed902e5a5b7f5ab79e7144");
            expect(res[0].client_secret).to.be.undefined;
            expect(res[0].created_at).not.undefined;
            expect(res[0].updated_at).not.undefined;
            expect(res[0].name).to.equal("OAuth 2.0 Client");
            expect(res.length).to.equal(1);
        });

    });
});

describe('POST /api/admin/clients', function () {

    context('when creating a new client', function () {


        var self = this;

        before(resetDatabase);

        before(function (done) {
            // Login with an admin login
            requestHelper.loginCustom(ADMIN_EMAIL, PASSWORD, self, done);
        });

        before(function (done) {
            requestHelper.sendRequest(self, '/api/admin/clients', {
                cookie: self.cookie,
                method: 'post',
                data: {
                    name: "OAuth 2.0 Client"
                }
            }, done);
        });

        before(function (done) {
            requestHelper.sendRequest(self, '/api/admin/clients', {
                cookie: self.cookie,
                method: 'get'
            }, done);
        });

        before(function (done) {
            db.OAuth2Client.findAll().then(
                function (clients) {
                    self.clientsInDb = clients;
                    done();
                });
        });

        it('should return status 200 an array with one element containing a client_secret (length 60)', function () {
            expect(self.res.statusCode).to.equal(200);
            var res = JSON.parse(self.res.text);
            expect(res[0].client_id.length).to.equal(16);
            expect(res[0].name).to.equal("OAuth 2.0 Client");
            expect(res[0].client_secret).to.be.undefined;
            expect(res[0].created_at).not.undefined;
            expect(res[0].updated_at).not.undefined;
            expect(self.clientsInDb[0].client_secret.length).to.equal(60);
        });
    });

    context('when updating a client', function () {


        var self = this;

        before(resetDatabase);

        before(function (done) {
            // Login with an admin login
            requestHelper.loginCustom(ADMIN_EMAIL, PASSWORD, self, done);
        });

        before(function (done) {
            requestHelper.sendRequest(self, '/api/admin/clients', {
                cookie: self.cookie,
                method: 'post',
                data: {
                    client_id: "db05acb0c6ed902e5a5b7f5ab79e7144",
                    name: "OAuth 2.0 Client"
                }
            }, done);
        });

        before(function (done) {
            var id = JSON.parse(self.res.text).id;
            requestHelper.sendRequest(self, '/api/admin/clients', {
                cookie: self.cookie,
                method: 'post',
                data: {
                    id: id,
                    name: "bbb"
                }
            }, done);
        });

        before(function (done) {
            requestHelper.sendRequest(self, '/api/admin/clients', {
                cookie: self.cookie,
                method: 'get'
            }, done);
        });

        before(function (done) {
            db.OAuth2Client.findAll().then(
                function (clients) {
                    self.clientsInDb = clients;
                    done();
                });
        });

        it('should return status 200 an array with one element containing a client_secret (length 60)', function () {
            expect(self.res.statusCode).to.equal(200);
            var res = JSON.parse(self.res.text);
            expect(res[0].name).to.equal("bbb");
            expect(res[0].client_secret).to.be.undefined;
            expect(res[0].client_id.length).to.equal(16);
            expect(res[0].created_at).not.undefined;
            expect(res[0].updated_at).not.undefined;
            expect(self.clientsInDb[0].client_secret.length).to.equal(60);

        });


    });

});

describe('GET /api/admin/users', function () {

    context('with pagination', function () {
        var self = this;

        before(resetDatabase);

        before(function (done) {
            var promiseChain = [];
            for (var i = 1000; i < 1150; i++) {
                promiseChain.push(
                    db.User.create({
                        id: i,
                        provider_uid: 'zzzzzzzzzzz'
                    })
                );
                promiseChain.push(
                    db.LocalLogin.create({
                        user_id: i,
                        login: 'zzzzzzzzzz' + i
                    })
                );
            }

            Promise.all(promiseChain)
                .then(function () {
                    done();
                });
        });

        before(function (done) {
            requestHelper.loginCustom(ADMIN_EMAIL, PASSWORD, self, done);
        });

        before(function (done) {
            self.displayUsersInfos = config.displayUsersInfos;
            config.displayUsersInfos = true;
            done();
        });

        after(function (done) {
            config.displayUsersInfos = self.displayUsersInfos;
            done();
        });
        context('when limit is', function () {
            context('empty', function () {
                before(function (done) {
                    requestHelper.sendRequest(this, '/api/admin/users', {
                        cookie: self.cookie,
                        parseDOM: true
                    }, done);
                });

                it('should return status 200 and contains 20 elements', function () {
                    expect(this.res.statusCode).to.equal(200);
                    var json = JSON.parse(this.res.text);
                    expect(json.users.length).to.equal(20);
                    expect(json.count).to.equal(152);
                    expect(json.users[0].email).to.equal('zzzzzzzzzz1000');

                });
            });
            context('limited to 10', function () {
                before(function (done) {
                    requestHelper.sendRequest(this, '/api/admin/users?limit=10', {
                        cookie: self.cookie,
                        parseDOM: true
                    }, done);
                });

                it('should return status 200 and contains 10 elements', function () {
                    expect(this.res.statusCode).to.equal(200);
                    var json = JSON.parse(this.res.text);
                    expect(json.users.length).to.equal(10);
                    expect(json.count).to.equal(152);
                    expect(json.users[0].email).to.equal('zzzzzzzzzz1000');
                });
            });
            context('limited to 1000000', function () {
                before(function (done) {
                    requestHelper.sendRequest(this, '/api/admin/users?limit=1000000', {
                        cookie: self.cookie,
                        parseDOM: true
                    }, done);
                });

                it('should return status 200 and contains 10 elements', function () {
                    expect(this.res.statusCode).to.equal(200);
                    var json = JSON.parse(this.res.text);
                    expect(json.users.length).to.equal(100);
                    expect(json.count).to.equal(152);
                    for (var i = 0; i < 100; i++) {
                        expect(json.users[i].email).to.equal('zzzzzzzzzz' + (1000 + i));
                    }
                });
            });
        });
        context('when offset is ', function () {
            context('2', function () {
                before(function (done) {
                    requestHelper.sendRequest(this, '/api/admin/users?offset=2', {
                        cookie: self.cookie,
                        parseDOM: true
                    }, done);
                });

                it('should return status 200 and contains 50 elements', function () {
                    expect(this.res.statusCode).to.equal(200);
                    var json = JSON.parse(this.res.text);
                    expect(json.users.length).to.equal(20);
                    expect(json.count).to.equal(152);
                    for (var i = 0; i < 20; i++) {
                        expect(json.users[i].email).to.equal('zzzzzzzzzz' + (1002 + i));
                    }
                });
            });
            context(' more that the number of elements', function () {
                before(function (done) {
                    requestHelper.sendRequest(this, '/api/admin/users?offset=999999', {
                        cookie: self.cookie,
                        parseDOM: true
                    }, done);
                });

                it('should return status 200 and contains 0 element', function () {
                    expect(this.res.statusCode).to.equal(200);
                    var json = JSON.parse(this.res.text);
                    expect(json.count).to.equal(152);
                    expect(json.users.length).to.equal(0);
                });
            });
            context(' 2 less than the number of elements (152) ', function () {
                before(function (done) {
                    requestHelper.sendRequest(this, '/api/admin/users?offset=150', {
                        cookie: self.cookie,
                        parseDOM: true
                    }, done);
                });

                it('should return status 200 and contains 2 elements', function () {
                    expect(this.res.statusCode).to.equal(200);
                    var json = JSON.parse(this.res.text);
                    expect(json.users.length).to.equal(2);
                    expect(json.count).to.equal(152);
                    expect(json.users[0].email).to.equal(ADMIN_EMAIL);
                });
            });

        });
        context('when search on ', function () {
            context(' mail with exact matching ', function () {
                before(function (done) {
                    requestHelper.sendRequest(this, '/api/admin/users?email=' + USER_EMAIL, {
                        cookie: self.cookie,
                        parseDOM: true
                    }, done);
                });

                it('should return status 200 and contains 1 elements', function () {
                    expect(this.res.statusCode).to.equal(200);
                    var json = JSON.parse(this.res.text);
                    expect(json.users.length).to.equal(1);
                    expect(json.count).to.equal(1);
                    expect(json.users[0].email).to.equal(USER_EMAIL);
                });
            });
            context(' mail with partial matching ', function () {
                before(function (done) {
                    requestHelper.sendRequest(this, '/api/admin/users?email=.ch', {
                        cookie: self.cookie,
                        parseDOM: true
                    }, done);
                });

                it('should return status 200 and contains 1 elements', function () {
                    expect(this.res.statusCode).to.equal(200);
                    var json = JSON.parse(this.res.text);
                    expect(json.users.length).to.equal(2);
                    expect(json.count).to.equal(2);
                    expect(json.users[0].email).to.equal(ADMIN_EMAIL);
                    expect(json.users[1].email).to.equal(USER_EMAIL);
                });
            });
            context('firstname with partial matching ', function () {
                before(function (done) {
                    requestHelper.sendRequest(this, '/api/admin/users?firstname=ot', {
                        cookie: self.cookie,
                        parseDOM: true
                    }, done);
                });

                it('should return status 200 and contains 1 elements', function () {
                    expect(this.res.statusCode).to.equal(200);
                    var json = JSON.parse(this.res.text);
                    expect(json.users.length).to.equal(1);
                    expect(json.count).to.equal(1);
                    expect(json.users[0].email).to.equal(USER_EMAIL);
                });
            });
            context('firstname, lastname and mail with partial matching', function () {
                before(function (done) {
                    requestHelper.sendRequest(this, '/api/admin/users?firstname=Sco&lastname=ige&email=user', {
                        cookie: self.cookie,
                        parseDOM: true
                    }, done);
                });

                it('should return status 200 and contains 1 elements', function () {
                    expect(this.res.statusCode).to.equal(200);
                    var json = JSON.parse(this.res.text);
                    expect(json.users.length).to.equal(1);
                    expect(json.count).to.equal(1);
                    expect(json.users[0].email).to.equal(USER_EMAIL);
                });
            });
            context('admin only', function () {
                before(function (done) {
                    requestHelper.sendRequest(this, '/api/admin/users?admin=true', {
                        cookie: self.cookie,
                        parseDOM: true
                    }, done);
                });

                it('should return status 200 and contains 1 elements', function () {
                    expect(this.res.statusCode).to.equal(200);
                    var json = JSON.parse(this.res.text);
                    expect(json.users.length).to.equal(1);
                    expect(json.count).to.equal(1);
                    expect(json.users[0].email).to.equal(ADMIN_EMAIL);
                });
            });
            context('id only', function () {
                before(function (done) {
                    requestHelper.sendRequest(this, '/api/admin/users?id=' + adminId, {
                        cookie: self.cookie,
                        parseDOM: true
                    }, done);
                });

                it('should return status 200 and contains 1 elements', function () {
                    expect(this.res.statusCode).to.equal(200);
                    var json = JSON.parse(this.res.text);
                    expect(json.users.length).to.equal(1);
                    expect(json.count).to.equal(1);
                    expect(json.users[0].email).to.equal(ADMIN_EMAIL);
                });
            });
            context('id and other parameter', function () {
                before(function (done) {
                    requestHelper.sendRequest(this, '/api/admin/users?id=' + adminId + '&firstname=this_is_not_existing_in_the_db&lastname=this_is_not_existing_in_the_db&email=this_is_not_existing_in_the_db', {
                        cookie: self.cookie,
                        parseDOM: true
                    }, done);
                });

                it('should return status 200 and contains 1 elements other query parameters than id are ignored', function () {
                    expect(this.res.statusCode).to.equal(200);
                    var json = JSON.parse(this.res.text);
                    expect(json.users.length).to.equal(1);
                    expect(json.count).to.equal(1);
                    expect(json.users[0].email).to.equal(ADMIN_EMAIL);
                });
            });
        });
    });

});

