"use strict";

var db = require('../../models');
var generate = require('../../lib/generate');

var assertions = require('../assertions');
var requestHelper = require('../request-helper');
var dbHelper = require('../db-helper');

var initDatabase = function (done) {
    db.Client
        .create({
            id: 100,
            secret: 'e2412cd1-f010-4514-acab-c8af59e5501a',
            name: 'Test client',
            software_id: 'CPA AP Test',
            software_version: '0.0.1',
            ip: '127.0.0.1'
        })
        .then(function () {
            return db.Domain.create({
                id: 5,
                name: 'example-service.bbc.co.uk',
                display_name: 'BBC Radio',
                access_token: '70fc2cbe54a749c38da34b6a02e8dfbd'
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

describe('POST /token', function () {
    context("when the client requests an access token (client mode)", function () {
        before(function () {
            sinon.stub(generate, 'accessToken').returns('aed201ffb3362de42700a293bdebf6123');
        });

        after(function () {
            generate.accessToken.restore();
        });

        before(resetDatabase);

        context('with valid parameters', function () {
            before(function () {
                // Fix creation time of access token, so we can verify the expires_in
                // field.
                var time = new Date("Wed Apr 09 2014 11:00:00 GMT+0100").getTime();
                this.clock = sinon.useFakeTimers(time);
            });

            after(function () {
                this.clock.restore();
            });

            before(function (done) {
                var body = {
                    grant_type: 'http://tech.ebu.ch/cpa/1.0/client_credentials',
                    client_id: '100',
                    client_secret: 'e2412cd1-f010-4514-acab-c8af59e5501a',
                    domain: 'example-service.bbc.co.uk'
                };

                requestHelper.sendRequest(this, '/token', {
                    method: 'post',
                    type: 'json',
                    data: body
                }, done);
            });

            it('should reply with a status code 200', function () {
                expect(this.res.statusCode).to.equal(200);
            });

            it('should be return a JSON object', function () {
                expect(this.res.headers['content-type']).to.equal('application/json; charset=utf-8');
                expect(this.res.body).to.be.an('object');
            });

            describe("the response body", function () {
                it("should not include a user name", function () {
                    expect(this.res.body).to.not.have.property('user_name');
                });

                it("should include a valid access token", function () {
                    expect(this.res.body).to.have.property('access_token');
                    expect(this.res.body.access_token).to.equal('aed201ffb3362de42700a293bdebf6123');
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
            });

            describe("the database", function () {
                before(function (done) {
                    var self = this;

                    db.AccessToken.findAll()
                        .then(function (accessTokens) {
                                self.accessTokens = accessTokens;
                                done();
                            },
                            function (error) {
                                done(error);
                            });
                });

                it("should contain a new access token", function () {
                    // jshint expr: true
                    expect(this.accessTokens).to.be.ok;
                    expect(this.accessTokens).to.be.an('array');
                    expect(this.accessTokens.length).to.equal(1);
                });

                describe("the access token", function () {
                    it("should have correct value", function () {
                        expect(this.accessTokens[0].token).to.equal('aed201ffb3362de42700a293bdebf6123');
                    });

                    it("should be associated with the correct client", function () {
                        expect(this.accessTokens[0].client_id).to.equal(100);
                    });

                    it("should not be associated with a user", function () {
                        expect(this.accessTokens[0].user_id).to.equal(null);
                    });

                    it("should be associated with the correct domain", function () {
                        expect(this.accessTokens[0].domain_id).to.equal(5);
                    });
                });
            });
        });

        context('with incorrect content type', function () {
            before(function (done) {
                var body = {
                    grant_type: 'http://tech.ebu.ch/cpa/1.0/client_credentials',
                    client_id: '100',
                    client_secret: 'e2412cd1-f010-4514-acab-c8af59e5501a',
                    scope: 'example-service.bbc.co.uk'
                };

                requestHelper.sendRequest(this, '/token', {
                    method: 'post',
                    type: 'form', // should be 'json'
                    data: body
                }, done);
            });

            it("should return an invalid_request error", function () {
                assertions.verifyError(this.res, 400, 'invalid_request');
            });
        });

        context('with missing client_id', function () {
            before(function (done) {
                var body = {
                    grant_type: 'http://tech.ebu.ch/cpa/1.0/client_credentials',
                    // client_id:     '100',
                    client_secret: 'e2412cd1-f010-4514-acab-c8af59e5501a',
                    domain: 'example-service.bbc.co.uk'
                };

                requestHelper.sendRequest(this, '/token', {
                    method: 'post',
                    type: 'json',
                    data: body
                }, done);
            });

            it("should return an invalid_request error", function () {
                assertions.verifyError(this.res, 400, 'invalid_request');
            });
        });

        context('with incorrect client_id', function () {
            before(function (done) {
                var body = {
                    grant_type: 'http://tech.ebu.ch/cpa/1.0/client_credentials',
                    client_id: 'unknown',
                    client_secret: 'e2412cd1-f010-4514-acab-c8af59e5501a',
                    domain: 'example-service.bbc.co.uk'
                };

                requestHelper.sendRequest(this, '/token', {
                    method: 'post',
                    type: 'json',
                    data: body
                }, done);
            });

            it("should return an invalid_client error", function () {
                assertions.verifyError(this.res, 400, 'invalid_client');
            });
        });

        context('with missing client_secret', function () {
            before(function (done) {
                var body = {
                    grant_type: 'http://tech.ebu.ch/cpa/1.0/client_credentials',
                    client_id: '100',
                    // client_secret: 'e2412cd1-f010-4514-acab-c8af59e5501a',
                    domain: 'example-service.bbc.co.uk'
                };

                requestHelper.sendRequest(this, '/token', {
                    method: 'post',
                    type: 'json',
                    data: body
                }, done);
            });

            it("should return an invalid_request error", function () {
                assertions.verifyError(this.res, 400, 'invalid_request');
            });
        });

        context('with incorrect client_secret', function () {
            before(function (done) {
                var body = {
                    grant_type: 'http://tech.ebu.ch/cpa/1.0/client_credentials',
                    client_id: '100',
                    client_secret: 'unknown',
                    domain: 'example-service.bbc.co.uk'
                };

                requestHelper.sendRequest(this, '/token', {
                    method: 'post',
                    type: 'json',
                    data: body
                }, done);
            });

            it("should return an invalid_client error", function () {
                assertions.verifyError(this.res, 400, 'invalid_client');
            });
        });

        context('with missing domain', function () {
            before(function (done) {
                var body = {
                    grant_type: 'http://tech.ebu.ch/cpa/1.0/client_credentials',
                    client_id: '100',
                    client_secret: 'e2412cd1-f010-4514-acab-c8af59e5501a'
                    // domain:        'example-service.bbc.co.uk'
                };

                requestHelper.sendRequest(this, '/token', {
                    method: 'post',
                    type: 'json',
                    data: body
                }, done);
            });

            it("should return an invalid_request error", function () {
                assertions.verifyError(this.res, 400, 'invalid_request');
            });
        });

        context('with incorrect domain', function () {
            before(function (done) {
                var body = {
                    grant_type: 'http://tech.ebu.ch/cpa/1.0/client_credentials',
                    client_id: '100',
                    client_secret: 'e2412cd1-f010-4514-acab-c8af59e5501a',
                    domain: 'unknown'
                };

                requestHelper.sendRequest(this, '/token', {
                    method: 'post',
                    type: 'json',
                    data: body
                }, done);
            });

            it("should return an invalid_request error", function () {
                assertions.verifyError(this.res, 400, 'invalid_request');
            });
        });

        context("with an extra parameter", function () {
            before(function (done) {
                var body = {
                    grant_type: 'http://tech.ebu.ch/cpa/1.0/client_credentials',
                    client_id: '100',
                    client_secret: 'e2412cd1-f010-4514-acab-c8af59e5501a',
                    domain: 'example-service.bbc.co.uk',
                    extra: 'test'
                };

                requestHelper.sendRequest(this, '/token', {
                    method: 'post',
                    type: 'json',
                    data: body
                }, done);
            });

            it("should return an 'invalid_request' error", function () {
                assertions.verifyError(this.res, 400, 'invalid_request');
            });
        });
    });
});
