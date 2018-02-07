"use strict";

var generate = require('../../lib/generate');
var db = require('../../models');

var requestHelper = require('../request-helper');
var dbHelper = require('../db-helper');

var initDatabase = function (done) {
    var clock;
    db.Client
        .create({
            id: 3,
            secret: 'a0fe0231-0220-4d45-8431-1fd374998d78',
            name: 'Test client',
            software_id: 'CPA AP Test',
            software_version: '0.0.1',
            ip: '127.0.0.1'
        })
        .then(function () {
            return db.Client.create({
                id: 101,
                secret: '751ae023-7dc0-4650-b0ff-e48ea627d6b2',
                name: 'Test client',
                software_id: 'CPA AP Test',
                software_version: '0.0.1',
                ip: '127.0.0.1'
            });
        })
        .then(function () {
            return db.User.create({
                id: 3,
                provider_uid: 'https://facebook.com/user',
                enable_sso: true
            });
        })
        .then(function () {
            return db.User.create({
                id: 4,
                provider_uid: 'testuser'
            });
        })
        .then(function (user) {
            return db.LocalLogin.create({user_id: user.id, login: 'testuser'}).then(function (localLogin) {
                return localLogin.setPassword('testpassword');
            });
        })
        .then(function () {
            return db.Domain.create({
                id: 5,
                display_name: 'Example',
                name: 'example-service.bbc.co.uk',
                access_token: '70fc2cbe54a749c38da34b6a02e8dfbd'
            });
        })
        .then(function () {
            return db.Domain.create({
                id: 134,
                display_name: 'Example 2',
                name: 'example-service2.bbc.co.uk',
                access_token: '70fc2cbe54a749c38da34b6a02e8dabc'
            });
        })
        .then(function () {
            var date = new Date("Wed Apr 09 2014 11:00:00 GMT+0100");
            clock = sinon.useFakeTimers({now: date, shouldAdvanceTime: true});

            return db.PairingCode.create({
                id: 12,
                client_id: 3,
                domain_id: 5,
                device_code: 'abcd1234',
                user_code: '1234',
                verification_uri: 'http://example.com',
                state: 'pending',
                user_id: 4,
                created_at: date,
                updated_at: date
            });
        })
        .then(function () {
            var date = new Date("Wed Apr 09 2014 11:00:05 GMT+0100");
            clock.restore();
            clock = sinon.useFakeTimers({now: date, shouldAdvanceTime: true});

            return db.PairingCode.create({
                id: 15,
                client_id: 3,
                domain_id: 134,
                device_code: '123gdd',
                user_code: '',
                verification_uri: 'http://example.com',
                state: 'pending',
                user_id: 4,
                created_at: date,
                updated_at: date
            });
        })
        .then(function () {
            var date = new Date("Wed Apr 09 2014 11:00:00 GMT+0100");
            clock.restore();
            clock = sinon.useFakeTimers({now: date, shouldAdvanceTime: true});

            return db.PairingCode.create({
                id: 16,
                client_id: 101,
                domain_id: 5,
                device_code: 'efgh5678',
                user_code: '1234',
                verification_uri: 'http://example.com',
                state: 'pending',
                user_id: 3,
                created_at: date,
                updated_at: date
            });
        })
        .then(function () {
                clock.restore();
                done();
            },
            function (error) {
                done(new Error(JSON.stringify(error)));
            });
};

var resetDatabase = function (done) {
    return dbHelper.resetDatabase(initDatabase, done);
};

describe('GET /verify', function () {
    before(resetDatabase);

    context('When requesting the form to validate a domain', function () {
        context('and the user is authenticated', function () {
            before(function (done) {
                requestHelper.login(this, done);
            });

            before(function (done) {
                requestHelper.sendRequest(this, '/verify', {cookie: this.cookie, parseDOM: true}, done);
            });

            it('should return a status 200', function () {
                expect(this.res.statusCode).to.equal(200);
            });

            it('should return HTML', function () {
                expect(this.res.headers['content-type']).to.equal('text/html; charset=utf-8');
            });

            describe('the response body', function () {
                it('should display an input with the pairing codes', function () {
                    expect(this.$('input[name="pairing_code_15"]').length).to.equal(2);
                    expect(this.$('input[name="pairing_code_15"]')[0].attribs.value).to.equal('yes');
                    expect(this.$('input[name="pairing_code_12"]').length).to.equal(2);
                    expect(this.$('input[name="pairing_code_12"]')[0].attribs.value).to.equal('yes');
                });

                it('should display the verification_type input', function () {
                    expect(this.$('input[name="verification_type"]').length).to.equal(1);
                    expect(this.$('input[name="verification_type"]')[0].attribs.value).to.equal('domain_list');
                });
            });
        });

        context('and the user is not authenticated', function () {
            before(function (done) {
                requestHelper.sendRequest(this, '/verify', null, done);
            });

            it('should redirect to the login page', function () {
                expect(this.res.statusCode).to.equal(302);
                // TODO: check redirect location and page to return to after login
            });
        });
    });
});

describe('POST /verify', function () {
    context('When validating a domain', function () {
        context('and the user is authenticated', function () {
            before(function (done) {
                requestHelper.login(this, done);
            });

            context('and the user allows the domain', function () {
                before(resetDatabase);

                before(function () {
                    // Ensure pairing code has not expired
                    var time = new Date("Wed Apr 09 2014 11:30:10 GMT+0100").getTime();
                    this.clock = sinon.useFakeTimers({now: time, shouldAdvanceTime: true});
                });

                after(function () {
                    this.clock.restore();
                });

                before(function (done) {
                    db.PairingCode.findAll().then(
                        function (l) {
                            for (var i in l) {
                                //console.log(l[i].updated_at);
                            }
                            done();
                        },
                        done
                    );
                });

                before(function (done) {
                    requestHelper.sendRequest(this, '/verify', {
                        method: 'post',
                        cookie: this.cookie,
                        type: 'form',
                        data: {'pairing_code_12': 'yes', 'verification_type': 'domain_list'}
                    }, done);
                });

                it('should return a status 302 with location /verify', function () {
                    var urlPrefix = requestHelper.urlPrefix;
                    expect(this.res.statusCode).to.equal(302);
                    expect(this.res.headers.location).to.equal(urlPrefix + "/verify");
                });

                describe('the database', function () {
                    before(function (done) {
                        var self = this;

                        db.PairingCode.findAll({where: {user_id: 4}})
                            .then(function (pairingCodes) {
                                self.pairingCodes = pairingCodes;
                                done();
                            })
                            .catch(function (error) {
                                done(error);
                            });
                    });

                    it('should have two pairing codes for the signed in user', function () {
                        expect(this.pairingCodes).to.be.an('array');
                        expect(this.pairingCodes.length).to.equal(2);
                    });

                    describe('the first pairing code', function () {
                        before(function () {
                            this.pairingCode = this.pairingCodes.filter(function (pairingCode) {
                                return pairingCode.id === 12;
                            })[0];
                        });

                        it('should be marked as verified', function () {
                            expect(this.pairingCode.state).to.equal('verified');
                        });

                        it('should be associated with the correct client', function () {
                            expect(this.pairingCode.client_id).to.equal(3);
                        });

                        it('should be associated with the signed-in user', function () {
                            expect(this.pairingCode.user_id).to.equal(4);
                        });

                        it('should be associated with the correct domain', function () {
                            expect(this.pairingCode.domain_id).to.equal(5);
                        });
                    });

                    describe('the second pairing code', function () {
                        before(function () {
                            this.pairingCode = this.pairingCodes.filter(function (pairingCode) {
                                return pairingCode.id === 15;
                            })[0];
                        });

                        it('should still be pending', function () {
                            expect(this.pairingCode.state).to.equal('pending');
                        });

                        it('should be associated with the correct client', function () {
                            expect(this.pairingCode.client_id).to.equal(3);
                        });

                        it('should be associated with the signed-in user', function () {
                            expect(this.pairingCode.user_id).to.equal(4);
                        });

                        it('should be associated with the correct domain', function () {
                            expect(this.pairingCode.domain_id).to.equal(134);
                        });
                    });
                });
            });

            context('and the user denies the domain', function () {
                before(resetDatabase);

                before(function () {
                    // Ensure pairing code has not expired
                    var time = new Date("Wed Apr 09 2014 11:30:10 GMT+0100").getTime();
                    this.clock = sinon.useFakeTimers({now: time, shouldAdvanceTime: true});
                });

                after(function () {
                    this.clock.restore();
                });

                before(function (done) {
                    requestHelper.sendRequest(this, '/verify', {
                        method: 'post',
                        cookie: this.cookie,
                        type: 'form',
                        data: {pairing_code_12: 'no', 'verification_type': 'domain_list'}
                    }, done);
                });

                it('should return a status 302 with location /verify', function () {
                    var urlPrefix = requestHelper.urlPrefix;
                    expect(this.res.statusCode).to.equal(302);
                    expect(this.res.headers.location).to.equal(urlPrefix + "/verify");
                });

                describe('the database', function () {
                    before(function (done) {
                        var self = this;

                        db.PairingCode.findAll({where: {user_id: 4}})
                            .then(function (pairingCodes) {
                                self.pairingCodes = pairingCodes;
                                done();
                            })
                            .catch(function (error) {
                                done(error);
                            });
                    });

                    it('should have two pairing codes for the signed in user', function () {
                        expect(this.pairingCodes).to.be.an('array');
                        expect(this.pairingCodes.length).to.equal(2);
                    });

                    describe('the first pairing code', function () {
                        before(function () {
                            this.pairingCode = this.pairingCodes.filter(function (pairingCode) {
                                return pairingCode.id === 12;
                            })[0];
                        });

                        it('should be marked as denied', function () {
                            expect(this.pairingCode.state).to.equal('denied');
                        });

                        it('should be associated with the correct client', function () {
                            expect(this.pairingCode.client_id).to.equal(3);
                        });

                        it('should be associated with the signed-in user', function () {
                            expect(this.pairingCode.user_id).to.equal(4);
                        });

                        it('should be associated with the correct domain', function () {
                            expect(this.pairingCode.domain_id).to.equal(5);
                        });
                    });

                    describe('the second pairing code', function () {
                        before(function () {
                            this.pairingCode = this.pairingCodes.filter(function (pairingCode) {
                                return pairingCode.id === 15;
                            })[0];
                        });

                        it('should still be pending', function () {
                            expect(this.pairingCode.state).to.equal('pending');
                        });

                        it('should be associated with the correct client', function () {
                            expect(this.pairingCode.client_id).to.equal(3);
                        });

                        it('should be associated with the signed-in user', function () {
                            expect(this.pairingCode.user_id).to.equal(4);
                        });

                        it('should be associated with the correct domain', function () {
                            expect(this.pairingCode.domain_id).to.equal(134);
                        });
                    });
                });
            });

            context('with an expired pairing code', function () {
                before(resetDatabase);

                before(function () {
                    // Ensure pairing code has expired
                    var time = new Date("Sat May 31 2014 11:00:00 GMT+0100").getTime();
                    this.clock = sinon.useFakeTimers({now: time, shouldAdvanceTime: true});
                });

                after(function () {
                    this.clock.restore();
                });

                before(function (done) {
                    requestHelper.sendRequest(this, '/verify', {
                        method: 'post',
                        cookie: this.cookie,
                        type: 'form',
                        data: {pairing_code_12: 'yes', 'verification_type': 'domain_list'}
                    }, done);
                });

                it('should return a status 302 with location /verify', function () {
                    var urlPrefix = requestHelper.urlPrefix;
                    expect(this.res.statusCode).to.equal(302);
                    expect(this.res.headers.location).to.equal(urlPrefix + "/verify");
                });

                describe('the database', function () {
                    before(function (done) {
                        var self = this;

                        db.PairingCode.findAll({where: {user_id: 4}})
                            .then(function (pairingCodes) {
                                self.pairingCodes = pairingCodes;
                                done();
                            })
                            .catch(function (error) {
                                done(error);
                            });
                    });

                    it('should have two pairing codes for the signed in user', function () {
                        expect(this.pairingCodes).to.be.an('array');
                        expect(this.pairingCodes.length).to.equal(2);
                    });

                    describe('the first pairing code', function () {
                        before(function () {
                            this.pairingCode = this.pairingCodes.filter(function (pairingCode) {
                                return pairingCode.id === 12;
                            })[0];
                        });

                        it('should still be pending', function () {
                            expect(this.pairingCode.state).to.equal('pending');
                        });

                        it('should be associated with the correct client', function () {
                            expect(this.pairingCode.client_id).to.equal(3);
                        });

                        it('should be associated with the signed-in user', function () {
                            expect(this.pairingCode.user_id).to.equal(4);
                        });

                        it('should be associated with the correct domain', function () {
                            expect(this.pairingCode.domain_id).to.equal(5);
                        });
                    });
                });
            });

            context('with a pairing code for another user', function () {
                before(resetDatabase);

                before(function () {
                    // Ensure pairing code has not expired
                    var time = new Date("Wed Apr 09 2014 11:30:10 GMT+0100").getTime();
                    this.clock = sinon.useFakeTimers({now: time, shouldAdvanceTime: true});
                });

                after(function () {
                    this.clock.restore();
                });

                before(function (done) {
                    requestHelper.sendRequest(this, '/verify', {
                        method: 'post',
                        cookie: this.cookie,
                        type: 'form',
                        data: {pairing_code_16: 'yes', 'verification_type': 'domain_list'}
                    }, done);
                });

                // TODO: redirect to /verify page and display an error message
                // to the user?
                it('should return status 500', function () {
                    expect(this.res.statusCode).to.equal(500);
                });

                describe('the pairing code', function () {
                    before(function (done) {
                        var self = this;

                        db.PairingCode.findById(16)
                            .then(function (pairingCode) {
                                self.pairingCode = pairingCode;
                                done();
                            })
                            .catch(function (error) {
                                done(error);
                            });
                    });

                    it('should still be pending', function () {
                        expect(this.pairingCode.state).to.equal('pending');
                    });

                    it('should be associated with the correct client', function () {
                        expect(this.pairingCode.client_id).to.equal(101);
                    });

                    it('should be associated with the correct user', function () {
                        expect(this.pairingCode.user_id).to.equal(3);
                    });

                    it('should be associated with the correct domain', function () {
                        expect(this.pairingCode.domain_id).to.equal(5);
                    });
                });
            });

            context('with a pairing code for another user', function () {
                before(resetDatabase);

                before(function () {
                    // Ensure pairing code has not expired
                    var time = new Date("Wed Apr 09 2014 11:30:10 GMT+0100").getTime();
                    this.clock = sinon.useFakeTimers({now: time, shouldAdvanceTime: true});
                });

                after(function () {
                    this.clock.restore();
                });

                before(function (done) {
                    requestHelper.sendRequest(this, '/verify', {
                        method: 'post',
                        cookie: this.cookie,
                        type: 'form',
                        data: {pairing_code_17: 'yes', 'verification_type': 'domain_list'}
                    }, done);
                });

                // TODO: redirect to /verify page and display an error message
                // to the user?
                it('should return status 500', function () {
                    expect(this.res.statusCode).to.equal(500);
                });

                describe('the database', function () {
                    before(function (done) {
                        var self = this;

                        db.PairingCode.findAll()
                            .then(function (pairingCodes) {
                                self.pairingCodes = pairingCodes;
                                done();
                            })
                            .catch(function (error) {
                                done(error);
                            });
                    });

                    it('should contain 3 pairing codes', function () {
                        expect(this.pairingCodes).to.be.an('array');
                        expect(this.pairingCodes.length).to.equal(3);
                    });
                });
            });
        });

        context('and the user is not authenticated', function () {
            before(resetDatabase);

            before(function (done) {
                requestHelper.sendRequest(this, '/verify', {
                    method: 'post',
                    type: 'form',
                    data: {user_code: '1234'}
                }, done);
            });

            it('should return a status 401', function () {
                expect(this.res.statusCode).to.equal(401);
            });
        });
    });
});
