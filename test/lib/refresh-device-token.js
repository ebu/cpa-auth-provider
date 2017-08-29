"use strict";

var db = require('../../models');
var generate = require('../../lib/generate');

var assertions = require('../assertions');
var requestHelper = require('../request-helper');
var dbHelper = require('../db-helper');

/*
 * For testing, create three clients:
 *
 * - a device in user mode (101) that has access token for domain
 *   example-service.bbc.co.uk (201)
 * - a device in client mode (102) that has access token for domain
 *   example-service.com (202)
 * - a web server (103) that has access token for domain
 *   example-service.bbc.co.uk (201)
 */

var initDatabase = function (done) {
    new Promise(function (resolve, reject) {
        resolve();
    })
        .then(function () {
            return db.User.create({
                id: 301,
                provider_uid: 'testuser',
                display_name: 'Test User',
                password: 'testpassword'
            });
        })
        .then(function () {
            return db.User.create({
                id: 302,
                provider_uid: 'anothertestuser',
                display_name: 'Another Test User',
                password: 'testpassword'
            });
        })
        .then(function () {
            return db.Client.create({
                id: 101,
                secret: 'e2412cd1-f010-4514-acab-c8af59e5501a',
                name: 'User mode test client',
                software_id: 'CPA AP Test',
                software_version: '0.0.1',
                ip: '127.0.0.1',
                registration_type: 'dynamic',
                user_id: 301,
            });
        })
        .then(function () {
            return db.Client.create({
                id: 102,
                secret: '751ae023-7dc0-4650-b0ff-e48ea627d6b2',
                name: 'Client mode test client',
                software_id: 'CPA AP Test',
                software_version: '0.0.1',
                ip: '127.0.0.1',
                registration_type: 'dynamic',
                user_id: null
            });
        })
        .then(function () {
            return db.Client.create({
                id: 103,
                secret: '399a8f42-365e-42db-a745-cf8b0e5b7ab7',
                name: 'Webserver test client',
                software_id: 'CPA AP Test',
                software_version: '0.0.1',
                ip: '127.0.0.1',
                registration_type: 'static',
                redirect_uri: 'https://example-client.com/cpa/callback',
                user_id: null
            });
        })
        .then(function () {
            return db.Domain.create({
                id: 201,
                name: 'example-service.bbc.co.uk',
                display_name: 'BBC Radio',
                access_token: '70fc2cbe54a749c38da34b6a02e8dfbd'
            });
        })
        .then(function () {
            return db.Domain.create({
                id: 202,
                name: 'example-service.com',
                display_name: 'CPA Example Service',
                access_token: '44e948140678443fbe1d89d1b7313911'
            });
        })
        .then(function () {
            // Access token for device client in user mode
            return db.AccessToken.create({
                token: '2d18047c-a07b-4a84-a81c-ad2bf23a8753',
                client_id: 101,
                user_id: 301,
                domain_id: 201
            });
        })
        .then(function () {
            // Access token for device client in client mode
            return db.AccessToken.create({
                token: 'b3248f78-7ffd-466a-ba2b-50a6616aefb9',
                client_id: 102,
                user_id: null,
                domain_id: 202
            });
        })
        .then(function () {
            // Access token for web server client
            return db.AccessToken.create({
                token: '9d009168-c841-4ecd-abf6-0278722fac05',
                client_id: 103,
                user_id: 302,
                domain_id: 201
            });
        })
        .then(function () {
                done();
            },
            function (error) {
                done(new Error(JSON.stringify(error)));
            });
};

var resetDatabase = function (done) {
    return dbHelper.resetDatabase(initDatabase, done);
};

describe("POST /token", function () {
    before(function () {
        sinon.stub(generate, 'accessToken').returns('aed201ffb3362de42700a293bdebf694');
    });

    after(function () {
        generate.accessToken.restore();
    });

    context("Refreshing an access token", function () {
        context("with a device client", function () {
            context("that has an existing user mode access token for the requested domain", function () {
                before(function () {
                    var time = new Date("Wed Apr 09 2014 11:00:00 GMT+0100").getTime();
                    this.clock = sinon.useFakeTimers(time);
                });

                after(function () {
                    this.clock.restore();
                });

                before(resetDatabase);

                before(function (done) {
                    var requestBody = {
                        grant_type: 'http://tech.ebu.ch/cpa/1.0/client_credentials',
                        client_id: '101',
                        client_secret: 'e2412cd1-f010-4514-acab-c8af59e5501a',
                        domain: 'example-service.bbc.co.uk'
                    };

                    requestHelper.sendRequest(this, '/token', {
                        method: 'post',
                        type: 'json',
                        data: requestBody
                    }, done);
                });

                it("should return status 200", function () {
                    expect(this.res.statusCode).to.equal(200);
                });

                it("should return a Cache-Control: no-store header", function () {
                    expect(this.res.headers).to.have.property('cache-control');
                    expect(this.res.headers['cache-control']).to.equal('no-store');
                });

                it("should return a Pragma: no-cache header", function () {
                    expect(this.res.headers).to.have.property('pragma');
                    expect(this.res.headers.pragma).to.equal('no-cache');
                });

                it("should return a JSON object", function () {
                    expect(this.res.headers['content-type']).to.equal('application/json; charset=utf-8');
                    expect(this.res.body).to.be.an('object');
                });

                describe("the response body", function () {
                    it("should include the user name", function () {
                        expect(this.res.body).to.have.property('user_name');
                        expect(this.res.body.user_name).to.equal('Test User');
                    });

                    it("should include a valid access token", function () {
                        expect(this.res.body).to.have.property('access_token');
                        expect(this.res.body.access_token).to.equal('aed201ffb3362de42700a293bdebf694');
                    });

                    it("should include the token type", function () {
                        expect(this.res.body).to.have.property('token_type');
                        expect(this.res.body.token_type).to.equal('bearer');
                    });

                    it("should include the domain", function () {
                        expect(this.res.body).to.have.property('domain');
                        expect(this.res.body.domain).to.equal('example-service.bbc.co.uk');
                    });

                    it("should include a display name for the domain", function () {
                        expect(this.res.body).to.have.property('domain_display_name');
                        expect(this.res.body.domain_display_name).to.equal('BBC Radio');
                    });

                    it("should include the lifetime of the access token", function () {
                        expect(this.res.body).to.have.property('expires_in');
                        expect(this.res.body.expires_in).to.equal(30 * 24 * 60 * 60);
                    });

                    it("should include the scope of the access token"); // TODO: optional(?): scope
                });

                describe("the database", function () {
                    before(function (done) {
                        var self = this;

                        db.AccessToken.findAll({where: {client_id: 101}})
                            .then(function (accessTokens) {
                                    self.accessTokens = accessTokens;
                                    done();
                                },
                                function (error) {
                                    done(error);
                                });
                    });

                    it("should contain the new access token", function () {
                        expect(this.accessTokens.length).to.equal(1);
                    });

                    describe("the access token", function () {
                        it("should have correct value", function () {
                            expect(this.accessTokens[0].token).to.equal('aed201ffb3362de42700a293bdebf694');
                        });

                        it("should be associated with the correct client", function () {
                            expect(this.accessTokens[0].client_id).to.equal(101);
                        });

                        it("should be associated with the correct user", function () {
                            expect(this.accessTokens[0].user_id).to.equal(301);
                        });

                        it("should be associated with the correct domain", function () {
                            expect(this.accessTokens[0].domain_id).to.equal(201);
                        });
                    });
                });
            });

            context("that has an existing client mode access token for the requested domain", function () {
                before(function () {
                    var time = new Date("Wed Apr 09 2014 11:00:00 GMT+0100").getTime();
                    this.clock = sinon.useFakeTimers(time);
                });

                after(function () {
                    this.clock.restore();
                });

                before(resetDatabase);

                before(function (done) {
                    var requestBody = {
                        grant_type: 'http://tech.ebu.ch/cpa/1.0/client_credentials',
                        client_id: '102',
                        client_secret: '751ae023-7dc0-4650-b0ff-e48ea627d6b2',
                        domain: 'example-service.com'
                    };

                    requestHelper.sendRequest(this, '/token', {
                        method: 'post',
                        type: 'json',
                        data: requestBody
                    }, done);
                });

                it("should return status 200", function () {
                    expect(this.res.statusCode).to.equal(200);
                });

                it("should return a Cache-Control: no-store header", function () {
                    expect(this.res.headers).to.have.property('cache-control');
                    expect(this.res.headers['cache-control']).to.equal('no-store');
                });

                it("should return a Pragma: no-cache header", function () {
                    expect(this.res.headers).to.have.property('pragma');
                    expect(this.res.headers.pragma).to.equal('no-cache');
                });

                it("should return a JSON object", function () {
                    expect(this.res.headers['content-type']).to.equal('application/json; charset=utf-8');
                    expect(this.res.body).to.be.an('object');
                });

                describe("the response body", function () {
                    it("should not include a the user name", function () {
                        expect(this.res.body).to.not.have.property('user_name');
                    });

                    it("should include a valid access token", function () {
                        expect(this.res.body).to.have.property('access_token');
                        expect(this.res.body.access_token).to.equal('aed201ffb3362de42700a293bdebf694');
                    });

                    it("should include the token type", function () {
                        expect(this.res.body).to.have.property('token_type');
                        expect(this.res.body.token_type).to.equal('bearer');
                    });

                    it("should include the domain", function () {
                        expect(this.res.body).to.have.property('domain');
                        expect(this.res.body.domain).to.equal('example-service.com');
                    });

                    it("should include a display name for the domain", function () {
                        expect(this.res.body).to.have.property('domain_display_name');
                        expect(this.res.body.domain_display_name).to.equal('CPA Example Service');
                    });

                    it("should include the lifetime of the access token", function () {
                        expect(this.res.body).to.have.property('expires_in');
                        expect(this.res.body.expires_in).to.equal(30 * 24 * 60 * 60);
                    });

                    it("should include the scope of the access token"); // TODO: optional(?): scope
                });

                describe("the database", function () {
                    before(function (done) {
                        var self = this;

                        db.AccessToken.findAll({where: {client_id: 102}})
                            .then(function (accessTokens) {
                                self.accessTokens = accessTokens;
                                return db.Client.findById(102);
                            })
                            .then(function (client) {
                                    self.client = client;
                                    done();
                                },
                                function (error) {
                                    done(error);
                                });
                    });

                    it("should contain the new access token", function () {
                        expect(this.accessTokens.length).to.equal(1);
                    });

                    describe("the access token", function () {
                        it("should have correct value", function () {
                            expect(this.accessTokens[0].token).to.equal('aed201ffb3362de42700a293bdebf694');
                        });

                        it("should be associated with the correct client", function () {
                            expect(this.accessTokens[0].client_id).to.equal(102);
                        });

                        it("should not be associated a user", function () {
                            expect(this.accessTokens[0].user_id).to.equal(null);
                        });

                        it("should be associated with the correct domain", function () {
                            expect(this.accessTokens[0].domain_id).to.equal(202);
                        });
                    });

                    describe("the client", function () {
                        it("should not be associated with a user", function () {
                            expect(this.client.user_id).to.equal(null);
                        });
                    });
                });
            });

            context("with an unknown client", function () {
                before(resetDatabase);

                before(function (done) {
                    var requestBody = {
                        grant_type: 'http://tech.ebu.ch/cpa/1.0/client_credentials',
                        client_id: 'unknown',
                        client_secret: 'unknown',
                        domain: 'example-service.bbc.co.uk'
                    };

                    requestHelper.sendRequest(this, '/token', {
                        method: 'post',
                        type: 'json',
                        data: requestBody
                    }, done);
                });

                it("should return an invalid_client error", function () {
                    assertions.verifyError(this.res, 400, 'invalid_client');
                });
            });
        });

        context("with a web server client", function () {
            before(resetDatabase);

            before(function (done) {
                var requestBody = {
                    grant_type: 'http://tech.ebu.ch/cpa/1.0/client_credentials',
                    client_id: '103',
                    client_secret: '399a8f42-365e-42db-a745-cf8b0e5b7ab7',
                    domain: 'example-service.bbc.co.uk'
                };

                requestHelper.sendRequest(this, '/token', {
                    method: 'post',
                    type: 'json',
                    data: requestBody
                }, done);
            });

            it("should return an invalid_client error", function () {
                assertions.verifyError(this.res, 400, 'invalid_client');
            });
        });
    });

    var fields = ['client_id', 'client_secret', 'domain'];

    fields.forEach(function (field) {
        context('with missing ' + field + ' field', function () {
            before(resetDatabase);

            before(function (done) {
                var data = {
                    grant_type: 'http://tech.ebu.ch/cpa/1.0/client_credentials',
                    client_id: '101',
                    client_secret: 'e2412cd1-f010-4514-acab-c8af59e5501a',
                    domain: 'example-service.bbc.co.uk'
                };

                delete data[field];

                requestHelper.sendRequest(this, '/token', {
                    method: 'post',
                    type: 'json',
                    data: data,
                }, done);
            });

            it("should return an invalid_request error", function () {
                assertions.verifyError(this.res, 400, 'invalid_request');
            });
        });
    });

    context("with an extra field in the request body", function () {
        before(resetDatabase);

        before(function (done) {
            var data = {
                grant_type: 'http://tech.ebu.ch/cpa/1.0/client_credentials',
                client_id: '101',
                client_secret: 'e2412cd1-f010-4514-acab-c8af59e5501a',
                domain: 'example-service.bbc.co.uk',
                extra: 'test'
            };

            requestHelper.sendRequest(this, '/token', {
                method: 'post',
                type: 'json',
                data: data,
            }, done);
        });

        it("should return an invalid_request error", function () {
            assertions.verifyError(this.res, 400, 'invalid_request');
        });
    });
});
