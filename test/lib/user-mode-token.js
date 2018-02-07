"use strict";

var config = require('../../config');
var db = require('../../models');
var generate = require('../../lib/generate');

var assertions = require('../assertions');
var requestHelper = require('../request-helper');
var dbHelper = require('../db-helper');

/**
 * For testing, create two clients, each with its own pairing code. One
 * pairing code is pending user verification, and the other has already
 * been verified.
 */

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
            return db.User.create({
                id: 3,
                provider_uid: 'testuser',
                display_name: 'Test User',
                password: 'testpassword'
            });
        })
        .then(function () {
            return db.Client.create({
                id: 101,
                secret: '751ae023-7dc0-4650-b0ff-e48ea627d6b2',
                name: 'Test client',
                software_id: 'CPA AP Test',
                software_version: '0.0.1',
                ip: '127.0.0.1',
                user_id: 3
            });
        })
        .then(function () {
            return db.Client.create({
                id: 102,
                secret: '21cced5a-3574-444c-98e9-5f1ba06995da',
                name: 'Test client',
                software_id: 'CPA AP Test',
                software_version: '0.0.1',
                ip: '127.0.0.1',
                user_id: 3
            });
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
            var date = new Date("Wed Apr 09 2014 11:00:00 GMT+0100");

            return db.PairingCode.create({
                id: 50,
                client_id: 100,
                domain_id: 5,
                device_code: '65ec63a2-df53-4ceb-a938-f94e43b16a5e',
                user_code: '1234',
                verification_uri: 'http://example.com',
                state: 'pending', // authorization_pending
                created_at: date,
                updated_at: date
            });
        })
        .then(function () {
            var date = new Date("Wed Apr 09 2014 11:00:00 GMT+0100");

            return db.PairingCode.create({
                id: 51,
                client_id: 101,
                domain_id: 5,
                device_code: 'c691343f-0ac0-467d-8659-5041cfc3dc4a',
                user_code: '5678',
                verification_uri: 'http://example.com',
                state: 'verified',
                user_id: 3,
                created_at: date,
                updated_at: date
            });
        })
        .then(function () {
            var date = new Date("Wed Apr 09 2014 11:00:00 GMT+0100");

            return db.PairingCode.create({
                id: 52,
                client_id: 102,
                domain_id: 5,
                device_code: '320b4ce5-24cd-4e8e-a845-3ee0e5cc927b',
                user_code: 'RYBkEpqE',
                verification_uri: 'http://example.com',
                state: 'pending',
                user_id: 3,
                created_at: date,
                updated_at: date
            });
        })
        .then(function () {
            var date = new Date("Wed Apr 09 2014 11:00:00 GMT+0100");

            return db.PairingCode.create({
                id: 53,
                client_id: 101,
                domain_id: 5,
                device_code: '3860fa73-f98f-4c99-a34c-29e0b5c79b84',
                user_code: 'dfydN789',
                verification_uri: 'http://example.com',
                state: 'denied',
                user_id: 3,
                created_at: date,
                updated_at: date
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

    [false, true].forEach(function (autoProvisionEnabled) {
        context("with the server configured to auto-provision tokens: " + autoProvisionEnabled, function () {
            before(function () {
                this.auto_provision_tokens = config.auto_provision_tokens;
                config.auto_provision_tokens = autoProvisionEnabled;
            });

            after(function () {
                config.auto_provision_tokens = this.auto_provision_tokens;
            });

            context("with a client that is not associated with a user account", function () {
                context("when the client polls to obtain an access token (user mode)", function () {
                    context("and the device code is pending user verification", function () {
                        context("and the client provides valid parameters", function () {
                            before(resetDatabase);

                            before(function () {
                                // Ensure pairing code has not expired
                                var time = new Date("Wed Apr 09 2014 11:30:00 GMT+0100").getTime();
                                this.clock = sinon.useFakeTimers(time);
                            });

                            after(function () {
                                this.clock.restore();
                            });

                            before(function (done) {
                                var requestBody = {
                                    grant_type: 'http://tech.ebu.ch/cpa/1.0/device_code',
                                    client_id: '100',
                                    client_secret: 'e2412cd1-f010-4514-acab-c8af59e5501a',
                                    device_code: '65ec63a2-df53-4ceb-a938-f94e43b16a5e',
                                    domain: 'example-service.bbc.co.uk'
                                };

                                requestHelper.sendRequest(this, '/token', {
                                    method: 'post',
                                    type: 'json',
                                    data: requestBody
                                }, done);
                            });

                            it("should return status 202", function () {
                                expect(this.res.statusCode).to.equal(202);
                            });

                            it("should return a JSON object", function () {
                                expect(this.res.headers['content-type']).to.equal('application/json; charset=utf-8');
                                expect(this.res.body).to.be.an('object');
                            });

                            describe("the response body", function () {
                                it("should contain 'reason': 'authorization_pending'", function () {
                                    expect(this.res.body).to.deep.equal({'reason': 'authorization_pending'});
                                });
                            });
                        });

                        context("and the client polls too quickly", function () {
                            it("should return status 400");
                            it("should return slow_down error");
                            it("should return retry_in field");
                        });
                    });

                    context("and the user has approved access", function () {
                        context("and the client provides valid parameters", function () {
                            before(resetDatabase);

                            before(function () {
                                // Ensure pairing code has not expired
                                var time = new Date("Wed Apr 09 2014 11:30:00 GMT+0100").getTime();
                                this.clock = sinon.useFakeTimers(time);
                            });

                            after(function () {
                                this.clock.restore();
                            });

                            before(function (done) {
                                var requestBody = {
                                    grant_type: 'http://tech.ebu.ch/cpa/1.0/device_code',
                                    client_id: '101', // client with verified pairing code
                                    client_secret: '751ae023-7dc0-4650-b0ff-e48ea627d6b2',
                                    device_code: 'c691343f-0ac0-467d-8659-5041cfc3dc4a',
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
                            });

                            describe("the database", function () {
                                before(function (done) {
                                    var self = this;

                                    db.AccessToken.findAll()
                                        .then(function (accessTokens) {
                                            self.accessTokens = accessTokens;
                                            return db.PairingCode.findById(51);
                                        })
                                        .then(function (pairingCode) {
                                            self.pairingCode = pairingCode;
                                            return db.Client.findById(101);
                                        })
                                        .then(function (client) {
                                                self.client = client;
                                                done();
                                            },
                                            function (error) {
                                                done(error);
                                            });
                                });

                                it("should delete the pairing code", function () {
                                    // jshint expr: true
                                    expect(this.pairingCode).to.not.be.ok;
                                });

                                it("should contain a new access token", function () {
                                    // jshint expr: true
                                    expect(this.accessTokens).to.be.ok;
                                    expect(this.accessTokens).to.be.an('array');
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
                                        expect(this.accessTokens[0].user_id).to.equal(3);
                                    });

                                    it("should be associated with the correct domain", function () {
                                        expect(this.accessTokens[0].domain_id).to.equal(5);
                                    });
                                });

                                describe("the client", function () {
                                    it("should be associated with the correct user", function () {
                                        expect(this.client.user_id).to.equal(3);
                                    });
                                });
                            });
                        });
                    });

                    context("and the user has denied access", function () {
                        context("and the client provides valid parameters", function () {
                            before(resetDatabase);

                            before(function () {
                                // Ensure pairing code has not expired
                                var time = new Date("Wed Apr 09 2014 11:30:00 GMT+0100").getTime();
                                this.clock = sinon.useFakeTimers(time);
                            });

                            after(function () {
                                this.clock.restore();
                            });

                            before(function (done) {
                                var requestBody = {
                                    grant_type: 'http://tech.ebu.ch/cpa/1.0/device_code',
                                    client_id: '101', // client with denied pairing code
                                    client_secret: '751ae023-7dc0-4650-b0ff-e48ea627d6b2',
                                    device_code: '3860fa73-f98f-4c99-a34c-29e0b5c79b84',
                                    domain: 'example-service.bbc.co.uk'
                                };

                                requestHelper.sendRequest(this, '/token', {
                                    method: 'post',
                                    type: 'json',
                                    data: requestBody
                                }, done);
                            });

                            it("should return a 'cancelled' error", function () {
                                assertions.verifyError(this.res, 400, 'cancelled');
                            });
                        });
                    });
                });
            });

            context("with a client that is associated with a user account", function () {
                context("when the client polls to obtain an access token (user mode)", function () {
                    context("and the device code is pending user verification", function () {
                        context("and the client provides valid parameters", function () {
                            before(resetDatabase);

                            before(function () {
                                // Ensure pairing code has not expired
                                var time = new Date("Wed Apr 09 2014 11:30:00 GMT+0100").getTime();
                                this.clock = sinon.useFakeTimers(time);
                            });

                            after(function () {
                                this.clock.restore();
                            });

                            before(function (done) {
                                var requestBody = {
                                    grant_type: 'http://tech.ebu.ch/cpa/1.0/device_code',
                                    client_id: '102',
                                    client_secret: '21cced5a-3574-444c-98e9-5f1ba06995da',
                                    device_code: '320b4ce5-24cd-4e8e-a845-3ee0e5cc927b',
                                    domain: 'example-service.bbc.co.uk'
                                };

                                requestHelper.sendRequest(this, '/token', {
                                    method: 'post',
                                    type: 'json',
                                    data: requestBody
                                }, done);
                            });

                            if (autoProvisionEnabled) {
                                it("should return status 200", function () {
                                    expect(this.res.statusCode).to.equal(200);
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
                            }
                            else {
                                it("should return status 202", function () {
                                    expect(this.res.statusCode).to.equal(202);
                                });
                            }
                        });
                    });
                });
            });
        });
    });

    context("with incorrect content type", function () {
        before(resetDatabase);

        before(function (done) {
            var requestBody = {
                grant_type: 'http://tech.ebu.ch/cpa/1.0/device_code',
                client_id: '100',
                client_secret: 'e2412cd1-f010-4514-acab-c8af59e5501a',
                device_code: '65ec63a2-df53-4ceb-a938-f94e43b16a5e',
                domain: 'example-service.bbc.co.uk'
            };

            requestHelper.sendRequest(this, '/token', {
                method: 'post',
                type: 'form', // should be 'json'
                data: requestBody
            }, done);
        });

        it("should return an invalid_request error", function () {
            assertions.verifyError(this.res, 400, 'invalid_request');
        });
    });

    context("with missing grant_type", function () {
        before(resetDatabase);

        before(function (done) {
            var requestBody = {
                // grant_type:    'http://tech.ebu.ch/cpa/1.0/device_code',
                client_id: '100',
                client_secret: 'e2412cd1-f010-4514-acab-c8af59e5501a',
                device_code: '65ec63a2-df53-4ceb-a938-f94e43b16a5e',
                domain: 'example-service.bbc.co.uk'
            };

            requestHelper.sendRequest(this, '/token', {
                method: 'post',
                type: 'json',
                data: requestBody
            }, done);
        });

        it("should return an invalid_request error", function () {
            assertions.verifyError(this.res, 400, 'invalid_request');
        });
    });

    context("with invalid grant_type", function () {
        before(resetDatabase);

        before(function (done) {
            var requestBody = {
                grant_type: 'invalid',
                client_id: '100',
                client_secret: 'e2412cd1-f010-4514-acab-c8af59e5501a',
                device_code: '65ec63a2-df53-4ceb-a938-f94e43b16a5e',
                domain: 'example-service.bbc.co.uk'
            };

            requestHelper.sendRequest(this, '/token', {
                method: 'post',
                type: 'json',
                data: requestBody
            }, done);
        });

        it("should return an invalid_request error", function () {
            assertions.verifyError(this.res, 400, 'invalid_request');
        });
    });

    context("with missing client_id", function () {
        before(resetDatabase);

        before(function (done) {
            var requestBody = {
                grant_type: 'http://tech.ebu.ch/cpa/1.0/device_code',
                // client_id:     '100',
                client_secret: 'e2412cd1-f010-4514-acab-c8af59e5501a',
                device_code: '65ec63a2-df53-4ceb-a938-f94e43b16a5e',
                domain: 'example-service.bbc.co.uk'
            };

            requestHelper.sendRequest(this, '/token', {
                method: 'post',
                type: 'json',
                data: requestBody
            }, done);
        });

        it("should return an invalid_request error", function () {
            assertions.verifyError(this.res, 400, 'invalid_request');
        });
    });

    context("with incorrect client_id", function () {
        before(resetDatabase);

        before(function (done) {
            var requestBody = {
                grant_type: 'http://tech.ebu.ch/cpa/1.0/device_code',
                client_id: 'unknown',
                client_secret: 'e2412cd1-f010-4514-acab-c8af59e5501a',
                device_code: '65ec63a2-df53-4ceb-a938-f94e43b16a5e',
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

    context("with missing client_secret", function () {
        before(resetDatabase);

        before(function (done) {
            var requestBody = {
                grant_type: 'http://tech.ebu.ch/cpa/1.0/device_code',
                client_id: '100',
                // client_secret: 'e2412cd1-f010-4514-acab-c8af59e5501a',
                device_code: '65ec63a2-df53-4ceb-a938-f94e43b16a5e',
                domain: 'example-service.bbc.co.uk'
            };

            requestHelper.sendRequest(this, '/token', {
                method: 'post',
                type: 'json',
                data: requestBody
            }, done);
        });

        it("should return an invalid_request error", function () {
            assertions.verifyError(this.res, 400, 'invalid_request');
        });
    });

    context("with incorrect client_secret", function () {
        before(resetDatabase);

        before(function (done) {
            var requestBody = {
                grant_type: 'http://tech.ebu.ch/cpa/1.0/device_code',
                client_id: '100',
                client_secret: 'unknown',
                device_code: '65ec63a2-df53-4ceb-a938-f94e43b16a5e',
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

    context("with missing device code", function () {
        before(resetDatabase);

        before(function (done) {
            var requestBody = {
                grant_type: 'http://tech.ebu.ch/cpa/1.0/device_code',
                client_id: '100',
                client_secret: 'e2412cd1-f010-4514-acab-c8af59e5501a',
                // device_code:   '65ec63a2-df53-4ceb-a938-f94e43b16a5e',
                domain: 'example-service.bbc.co.uk'
            };

            requestHelper.sendRequest(this, '/token', {
                method: 'post',
                type: 'json',
                data: requestBody
            }, done);
        });

        it("should return an invalid_request error", function () {
            assertions.verifyError(this.res, 400, 'invalid_request');
        });
    });

    context("with incorrect device_code", function () {
        before(resetDatabase);

        before(function (done) {
            var requestBody = {
                grant_type: 'http://tech.ebu.ch/cpa/1.0/device_code',
                client_id: '100',
                client_secret: 'e2412cd1-f010-4514-acab-c8af59e5501a',
                device_code: 'unknown',
                domain: 'example-service.bbc.co.uk'
            };

            requestHelper.sendRequest(this, '/token', {
                method: 'post',
                type: 'json',
                data: requestBody
            }, done);
        });

        it("should return an invalid_request error", function () {
            assertions.verifyError(this.res, 400, 'invalid_request');
        });
    });

    context("with missing domain", function () {
        before(resetDatabase);

        before(function (done) {
            var requestBody = {
                grant_type: 'http://tech.ebu.ch/cpa/1.0/device_code',
                client_id: '100',
                client_secret: 'e2412cd1-f010-4514-acab-c8af59e5501a',
                device_code: '65ec63a2-df53-4ceb-a938-f94e43b16a5e',
                // domain:        'example-service.bbc.co.uk'
            };

            requestHelper.sendRequest(this, '/token', {
                method: 'post',
                type: 'json',
                data: requestBody
            }, done);
        });

        it("should return an invalid_request error", function () {
            assertions.verifyError(this.res, 400, 'invalid_request');
        });
    });

    context("with incorrect domain", function () {
        before(resetDatabase);

        before(function (done) {
            var requestBody = {
                grant_type: 'http://tech.ebu.ch/cpa/1.0/device_code',
                client_id: '100',
                client_secret: 'e2412cd1-f010-4514-acab-c8af59e5501a',
                device_code: '65ec63a2-df53-4ceb-a938-f94e43b16a5e',
                domain: 'unknown'
            };

            requestHelper.sendRequest(this, '/token', {
                method: 'post',
                type: 'json',
                data: requestBody
            }, done);
        });

        it("should return an invalid_request error", function () {
            assertions.verifyError(this.res, 400, 'invalid_request');
        });
    });

    context("when the pairing code has expired", function () {
        before(function (done) {
            var self = this;

            var time = new Date("Wed Apr 09 2014 11:00:00 GMT+0100").getTime();
            this.clock = sinon.useFakeTimers(time);

            resetDatabase(function () {
                self.clock.restore();

                // The pairing code should expire one hour after it was created
                var time = new Date("Wed Apr 09 2014 12:00:00 GMT+0100").getTime();
                self.clock = sinon.useFakeTimers(time);
                done();
            });
        });

        after(function () {
            this.clock.restore();
        });

        before(function (done) {
            var requestBody = {
                grant_type: 'http://tech.ebu.ch/cpa/1.0/device_code',
                client_id: '101', // client with verified pairing code
                client_secret: '751ae023-7dc0-4650-b0ff-e48ea627d6b2',
                device_code: 'c691343f-0ac0-467d-8659-5041cfc3dc4a',
                domain: 'example-service.bbc.co.uk'
            };

            requestHelper.sendRequest(this, '/token', {
                method: 'post',
                type: 'json',
                data: requestBody
            }, done);
        });

        it("should return an 'expired' error", function () {
            assertions.verifyError(this.res, 400, 'expired');
        });
    });
});
