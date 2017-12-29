/*jshint expr:true */
"use strict";

var generate = require('../../lib/generate');
var db = require('../../models');
var config = require('../../config');

var chai = require('chai');
var chaiJquery = require('chai-jquery');
var chaiHttp = require('chai-http');

var requestHelper = require('../request-helper');
var dbHelper = require('../db-helper');

var PASSWORD = 'UnbreakablePassword01!';

var USER = {
    email: 'user@user.ch',
    provider_uid: 'testuser',
    firstname: 'Scott',
    lastname: 'Tiger'
};
var ADMIN = {
    email: 'admin@admin.ch',
    provider_uid: 'testuser',
    permission_id: 1,
    firstname: 'John',
    lastname: 'Doe'
};

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
        return db.LocalLogin.create({user_id: user.id, login: user.email});
    }).then(function (localLogin) {
        localLogin.setPassword(PASSWORD);
    }).then(function () {
        return db.User.create(ADMIN);
    }).then(function (user) {
        adminId = user.id;
        return db.LocalLogin.create({user_id: user.id, login: user.email});
    }).then(function (localLogin) {
        return localLogin.setPassword(PASSWORD);
    }).then(function () {
        return db.Domain.create({
            id: 5,
            name: 'example-service.bbc.co.uk',
            display_name: 'BBC',
            access_token: '70fc2cbe54a749c38da34b6a02e8dfbd'
        });
    }).then(
        function () {
            done();
        },
        function (error) {
            done(new Error(error));
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

describe('GET /admin', function () {

    context('When the user is authenticated and is not admin', function () {

        var self = this;

        before(resetDatabase);

        before(function (done) {
            // Login with a non admin login
            requestHelper.loginCustom(USER.email, PASSWORD, self, done);
        });

        before(function (done) {
            requestHelper.sendRequest(self, '/admin', {
                cookie: self.cookie,
                parseDOM: true
            }, done);
        });

        it('should return status 403', function () {
            expect(self.res.statusCode).to.equal(403);
        });
    });

    context('When the user is authenticated and is admin', function () {

        var self = this;

        before(resetDatabase);

        before(function (done) {
            requestHelper.loginCustom(ADMIN.email, PASSWORD, self, done);
        });

        before(function (done) {
            requestHelper.sendRequest(this, '/admin', {
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
    });

    context('When the admin is authenticated and config.displyUsersInfos is false', function () {

        var self = this;

        before(resetDatabase);

        before(function (done) {
            requestHelper.loginCustom(ADMIN.email, PASSWORD, self, done);
        });

        before(function (done) {
            config.displayUsersInfos = false;
            requestHelper.sendRequest(this, '/admin', {
                cookie: self.cookie,
                parseDOM: true
            }, done);
        });

        it('should hide Users link', function () {
            expect(this.$('#users-link').length).to.equal(0);
        });

    });

    context('When the admin is authenticated and config.displyUsersInfos is true', function () {

        var self = this;

        before(resetDatabase);

        before(function (done) {
            requestHelper.loginCustom(ADMIN.email, PASSWORD, self, done);
        });

        before(function (done) {
            config.displayUsersInfos = true;
            requestHelper.sendRequest(this, '/admin', {
                cookie: self.cookie,
                parseDOM: true
            }, done);
        });

        it('should show Users link', function () {
            expect(this.$('#users-link').length).to.equal(1);
        });

    });

    context('When the user is not authenticated', function () {

        var self = this;

        before(resetDatabase);

        before(function (done) {
            requestHelper.sendRequest(self, '/admin', null, done);
        });

        it('should redirect to the login page', function () {
            var urlPrefix = requestHelper.urlPrefix;
            expect(self.res.statusCode).to.equal(302);
            expect(self.res.headers.location).to.equal(urlPrefix + "/auth");
        });
    });
});

describe('GET /admin/domains', function () {
    context('When the user is authenticated', function () {

        before(resetDatabase);

        before(function (done) {
            requestHelper.loginCustom(ADMIN.email, PASSWORD, this, done);
        });

        before(function (done) {
            requestHelper.sendRequest(this, '/admin/domains', {
                cookie: this.cookie,
                parseDOM: true
            }, done);
        });

        it('should return status 200', function () {
            expect(this.res.statusCode).to.equal(200);
        });

        it('should return HTML', function () {
            expect(this.res.headers['content-type']).to.equal('text/html; charset=utf-8');
        });

        describe('the HTML page', function () {
            it('should show the existing domains', function () {
                expect(this.$('table > tbody > tr').length).to.equal(1);
                expect(this.$('table > tbody > tr:nth-child(1) > td').length).to.equal(3);

                expect(
                    this.$('table > tbody > tr:nth-child(1) > td:nth-child(1)').text()
                ).to.equal('BBC');

                expect(
                    this.$('table > tbody > tr:nth-child(1) > td:nth-child(2)').text()
                ).to.equal('example-service.bbc.co.uk');

                expect(
                    this.$('table > tbody > tr:nth-child(1) > td:nth-child(3)').text()
                ).to.equal('70fc2cbe54a749c38da34b6a02e8dfbd');
            });
        });
    });

    context('When the user is not authenticated', function () {
        before(function (done) {
            requestHelper.sendRequest(this, '/admin/domains', null, done);
        });

        it('should redirect to the login page', function () {
            var urlPrefix = requestHelper.urlPrefix;
            expect(this.res.statusCode).to.equal(302);
            expect(this.res.headers.location).to.equal(urlPrefix + "/auth");
        });
    });
});

describe('GET /admin/domains/add', function () {
    context('When the user is authenticated', function () {
        before(resetDatabase);

        before(function (done) {
            requestHelper.loginCustom(ADMIN.email, PASSWORD, this, done);
        });

        before(function (done) {
            requestHelper.sendRequest(this, '/admin/domains/add', {
                cookie: this.cookie,
                parseDOM: true
            }, done);
        });

        it('should return status 200', function () {
            expect(this.res.statusCode).to.equal(200);
        });

        it('should return HTML', function () {
            expect(this.res.headers['content-type']).to.equal('text/html; charset=utf-8');
        });

        describe('the HTML page', function () {
            it('should contain a form with domain parameters', function () {
                expect(this.$('input#inputDisplayName').length).to.equal(1);
                expect(this.$('input#inputDisplayName').attr('type')).to.equal('text');

                expect(this.$('input#inputDomain').length).to.equal(1);
                expect(this.$('input#inputDomain').attr('type')).to.equal('text');
            });
        });
    });

    context('When the user is not authenticated', function () {
        before(function (done) {
            requestHelper.sendRequest(this, '/admin/domains/add', null, done);
        });

        it('should redirect to the login page', function () {
            var urlPrefix = requestHelper.urlPrefix;
            expect(this.res.statusCode).to.equal(302);
            expect(this.res.headers.location).to.equal(urlPrefix + "/auth");
        });
    });
});

describe('POST /admin/domains', function () {
    before(function () {
        sinon.stub(generate, 'accessToken').returns('51f6ceb51ac44ea3899bb9f07dd120e4');
    });

    after(function () {
        generate.accessToken.restore();
    });

    context('When the user is authenticated', function () {
        before(resetDatabase);

        before(function (done) {
            requestHelper.loginCustom(ADMIN.email, PASSWORD, this, done);
        });

        before(function (done) {
            requestHelper.sendRequest(this, '/admin/domains', {
                method: 'post',
                cookie: this.cookie,
                type: 'form',
                data: {display_name: 'Test', name: 'example.com'}
            }, done);
        });

        it('should redirect to the domain listing page', function () {
            var urlPrefix = requestHelper.urlPrefix;
            expect(this.res.statusCode).to.equal(302);
            expect(this.res.headers.location).to.equal(urlPrefix + "/admin/domains");
        });

        describe("the database", function () {
            before(function (done) {
                var self = this;

                db.Domain.findAll({order: [['created_at']]})
                    .then(function (domains) {
                            self.domains = domains;
                            done();
                        },
                        function (error) {
                            done(error);
                        });
            });

            it("should contain a new domain", function () {
                // jshint expr: true
                expect(this.domains).to.be.ok;
                // jshint expr: false
                expect(this.domains.length).to.equal(2);
            });

            describe("the domain", function () {
                before(function () {
                    this.domain = this.domains[1];
                });

                it("should have the correct attributes", function () {
                    expect(this.domain.display_name).to.equal('Test');
                    expect(this.domain.name).to.equal('example.com');
                    expect(this.domain.access_token).to.equal('51f6ceb51ac44ea3899bb9f07dd120e4');
                });
            });
        });
    });

    context('When the user is not authenticated', function () {
        before(resetDatabase);

        before(function (done) {
            requestHelper.sendRequest(this, '/admin/domains', {
                method: 'post',
                type: 'form',
                data: {display_name: 'Test', name: 'example.com'}
            }, done);
        });

        it('should return status 401', function () {
            expect(this.res.statusCode).to.equal(401);
        });
    });
});
