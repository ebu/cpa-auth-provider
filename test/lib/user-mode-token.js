"use strict";

var db       = require('../../models');
var generate = require('../../lib/generate');

var assertions    = require('../assertions');
var requestHelper = require('../request-helper');

var _ = require('lodash');

var clearDatabase = function(done) {
  db.sequelize.query('DELETE FROM PairingCodes')
    .then(function() {
      return db.sequelize.query('DELETE FROM AccessTokens');
    })
    .then(function() {
      return db.sequelize.query('DELETE FROM Clients');
    })
    .then(function() {
      return db.sequelize.query('DELETE FROM Users');
    })
    .then(function() {
      return db.sequelize.query('DELETE FROM Scopes');
    })
    .then(function() {
      done();
    },
    function(error) {
      done(error);
    });
};

/**
 * For testing, create two clients, each with its own pairing code. One
 * pairing code is pending user verification, and the other has already
 * been verified.
 */

var initDatabase = function(done) {
  db.Client
    .create({
      id:               100,
      secret:           'e2412cd1-f010-4514-acab-c8af59e5501a',
      name:             'Test client',
      software_id:      'CPA AP Test',
      software_version: '0.0.1',
      ip:               '127.0.0.1'
    })
    .then(function() {
      return db.Client.create({
        id:               101,
        secret:           '751ae023-7dc0-4650-b0ff-e48ea627d6b2',
        name:             'Test client',
        software_id:      'CPA AP Test',
        software_version: '0.0.1',
        ip:               '127.0.0.1'
      });
    })
    .then(function() {
      return db.Scope.create({
        id:           5,
        name:         'example-service.bbc.co.uk',
        display_name: 'BBC Radio'
      });
    })
    .then(function() {
      return db.User.create({
        id:           3,
        provider_uid: 'testuser',
        display_name: 'Test User',
        password:     'testpassword'
      });
    })
    .then(function() {
      var date = new Date("Wed Apr 09 2014 11:00:00 GMT+0100");

      return db.PairingCode.create({
        id:               50,
        client_id:        100,
        scope_id:         5,
        device_code:      '65ec63a2-df53-4ceb-a938-f94e43b16a5e',
        user_code:        '1234',
        verification_uri: 'http://example.com',
        verified:         false, // authorization_pending
        created_at:       date,
        updated_at:       date
      });
    })
    .then(function() {
      var date = new Date("Wed Apr 09 2014 11:00:00 GMT+0100");

      return db.PairingCode.create({
        id:               51,
        client_id:        101,
        scope_id:         5,
        device_code:      'c691343f-0ac0-467d-8659-5041cfc3dc4a',
        user_code:        '5678',
        verification_uri: 'http://example.com',
        verified:         true,
        user_id:          3,
        created_at:       date,
        updated_at:       date
      });
    })
    .then(function() {
      done();
    },
    function(error) {
      done(new Error(JSON.stringify(error)));
    });
};

var resetDatabase = function(done) {
  clearDatabase(function() {
    initDatabase(function() {
      done();
    });
  });
};

describe("POST /token", function() {
  before(function() {
    sinon.stub(generate, 'accessToken').returns('aed201ffb3362de42700a293bdebf694');
  });

  after(function() {
    generate.accessToken.restore();
  });

  context("when the client polls to obtain an access token (user mode)", function() {
    context("and the device code is pending user verification", function() {
      context("and the client provides valid parameters", function() {
        before(resetDatabase);

        before(function() {
          // Ensure pairing code has not expired
          var time = new Date("Wed Apr 09 2014 11:30:00 GMT+0100").getTime();
          this.clock = sinon.useFakeTimers(time, "Date");
        });

        after(function() {
          this.clock.restore();
        });

        before(function(done) {
          var requestBody = {
            grant_type:    'authorization_code',
            client_id:     '100',
            client_secret: 'e2412cd1-f010-4514-acab-c8af59e5501a',
            device_code:   '65ec63a2-df53-4ceb-a938-f94e43b16a5e',
            scope:         'example-service.bbc.co.uk'
          };

          requestHelper.sendRequest(this, '/token', {
            method: 'post',
            type:   'json',
            data:   requestBody
          }, done);
        });

        it("should return status 202", function() {
          expect(this.res.statusCode).to.equal(202);
        });

        describe("the response body", function() {
          it("should return a JSON object", function() {
            expect(this.res.headers['content-type']).to.equal('application/json; charset=utf-8');
            expect(this.res.body).to.be.an('object');
          });

          it("should contain 'reason': 'authorization_pending'", function() {
            expect(this.res.body).to.deep.equal({ 'reason': 'authorization_pending' });
          });
        });
      });

      context("and the client polls too quickly", function() {
        it("should return status 400");
        it("should return slow_down error");
      });
    });

    context("and the user has input the correct user code", function() {
      context("and the client provides valid parameters", function() {
        before(resetDatabase);

        before(function() {
          // Ensure pairing code has not expired
          var time = new Date("Wed Apr 09 2014 11:30:00 GMT+0100").getTime();
          this.clock = sinon.useFakeTimers(time, "Date");
        });

        after(function() {
          this.clock.restore();
        });

        before(function(done) {
          var requestBody = {
            grant_type:    'authorization_code',
            client_id:     '101', // client with verified pairing code
            client_secret: '751ae023-7dc0-4650-b0ff-e48ea627d6b2',
            device_code:   'c691343f-0ac0-467d-8659-5041cfc3dc4a',
            scope:         'example-service.bbc.co.uk'
          };

          requestHelper.sendRequest(this, '/token', {
            method: 'post',
            type:   'json',
            data:   requestBody
          }, done);
        });

        it("should return status 200", function() {
          expect(this.res.statusCode).to.equal(200);
        });

        it("should return a Cache-Control: no-store header", function() {
          expect(this.res.headers).to.have.property('cache-control');
          expect(this.res.headers['cache-control']).to.equal('no-store');
        });

        it("should return a Pragma: no-cache header", function() {
          expect(this.res.headers).to.have.property('pragma');
          expect(this.res.headers.pragma).to.equal('no-cache');
        });

        it("should return a JSON object", function() {
          expect(this.res.headers['content-type']).to.equal('application/json; charset=utf-8');
          expect(this.res.body).to.be.an('object');
        });

        describe("the response body", function() {
          it("should include a valid access token", function() {
            expect(this.res.body).to.have.property('token');
            expect(this.res.body.token).to.equal('aed201ffb3362de42700a293bdebf694');
          });

          it("should include the token type", function() {
            expect(this.res.body).to.have.property('token_type');
            expect(this.res.body.token_type).to.equal('bearer');
          });

          it("should include a description", function() {
            expect(this.res.body).to.have.property('description');
            expect(this.res.body.description).to.equal('Test User at BBC Radio');
          });

          it("should include a short description", function() {
            expect(this.res.body).to.have.property('short_description');
            expect(this.res.body.short_description).to.equal('BBC Radio');
          });

          it("should include the scope", function() {
            expect(this.res.body).to.have.property('scope');
            expect(this.res.body.scope).to.equal('example-service.bbc.co.uk');
          });

          it("should include a valid refresh token"); // TODO: optional: refresh_token
          it("should include the lifetime of the access token"); // TODO: recommended: expires_in
          it("should include the scope of the access token"); // TODO: optional(?): scope
        });

        describe("the database", function() {
          before(function(done) {
            var self = this;

            db.AccessToken.findAll()
              .then(function(accessTokens) {
                self.accessTokens = accessTokens;
                return db.PairingCode.findAll();
              })
              .then(function(pairingCodes) {
                self.pairingCodes = pairingCodes;
                done();
              },
              function(error) {
                done(error);
              });
          });

          it("should delete the pairing code", function() {
            // jshint expr: true
            expect(this.pairingCodes).to.be.ok;
            expect(this.pairingCodes).to.be.an('array');
            expect(this.pairingCodes.length).to.equal(1);
            expect(this.pairingCodes[0].id).to.equal(50);
          });

          it("should contain a new access token", function() {
            // jshint expr: true
            expect(this.accessTokens).to.be.ok;
            expect(this.accessTokens).to.be.an('array');
            expect(this.accessTokens.length).to.equal(1);
          });

          describe("the access token", function() {
            it("should have correct value", function() {
              expect(this.accessTokens[0].token).to.equal('aed201ffb3362de42700a293bdebf694');
            });

            it("should be associated with the correct client", function() {
              expect(this.accessTokens[0].client_id).to.equal(101);
            });

            it("should be associated with the correct user", function() {
              expect(this.accessTokens[0].user_id).to.equal(3);
            });

            it("should be associated with the correct scope", function() {
              expect(this.accessTokens[0].scope_id).to.equal(5);
            });
          });
        });
      });
    });

    context("with incorrect content type", function() {
      before(resetDatabase);

      before(function(done) {
        var requestBody = {
          grant_type:    'authorization_code',
          client_id:     '100',
          client_secret: 'e2412cd1-f010-4514-acab-c8af59e5501a',
          device_code:   '65ec63a2-df53-4ceb-a938-f94e43b16a5e',
          scope:         'example-service.bbc.co.uk'
        };

        requestHelper.sendRequest(this, '/token', {
          method: 'post',
          type:   'form', // should be 'json'
          data:   requestBody
        }, done);
      });

      it("should return an invalid_request error", function() {
        assertions.verifyError(this.res, 400, 'invalid_request');
      });
    });

    context("with missing grant_type", function() {
      before(resetDatabase);

      before(function(done) {
        var requestBody = {
          // grant_type:    'authorization_code',
          client_id:     '100',
          client_secret: 'e2412cd1-f010-4514-acab-c8af59e5501a',
          device_code:   '65ec63a2-df53-4ceb-a938-f94e43b16a5e',
          scope:         'example-service.bbc.co.uk'
        };

        requestHelper.sendRequest(this, '/token', {
          method: 'post',
          type:   'json',
          data:   requestBody
        }, done);
      });

      it("should return an invalid_request error", function() {
        assertions.verifyError(this.res, 400, 'invalid_request');
      });
    });

    context("with invalid grant_type", function() {
      before(resetDatabase);

      before(function(done) {
        var requestBody = {
          grant_type:    'invalid',
          client_id:     '100',
          client_secret: 'e2412cd1-f010-4514-acab-c8af59e5501a',
          device_code:   '65ec63a2-df53-4ceb-a938-f94e43b16a5e',
          scope:         'example-service.bbc.co.uk'
        };

        requestHelper.sendRequest(this, '/token', {
          method: 'post',
          type:   'json',
          data:   requestBody
        }, done);
      });

      it("should return an unsupported_grant_type error", function() {
        assertions.verifyError(this.res, 400, 'unsupported_grant_type');
      });
    });

    context("with missing client_id", function() {
      before(resetDatabase);

      before(function(done) {
        var requestBody = {
          grant_type:    'authorization_code',
          // client_id:     '100',
          client_secret: 'e2412cd1-f010-4514-acab-c8af59e5501a',
          device_code:   '65ec63a2-df53-4ceb-a938-f94e43b16a5e',
          scope:         'example-service.bbc.co.uk'
        };

        requestHelper.sendRequest(this, '/token', {
          method: 'post',
          type:   'json',
          data:   requestBody
        }, done);
      });

      it("should return an invalid_request error", function() {
        assertions.verifyError(this.res, 400, 'invalid_request');
      });
    });

    context("with incorrect client_id", function() {
      before(resetDatabase);

      before(function(done) {
        var requestBody = {
          grant_type:    'authorization_code',
          client_id:     'unknown',
          client_secret: 'e2412cd1-f010-4514-acab-c8af59e5501a',
          device_code:   '65ec63a2-df53-4ceb-a938-f94e43b16a5e',
          scope:         'example-service.bbc.co.uk'
        };

        requestHelper.sendRequest(this, '/token', {
          method: 'post',
          type:   'json',
          data:   requestBody
        }, done);
      });

      it("should return an invalid_client error", function() {
        assertions.verifyError(this.res, 400, 'invalid_client');
      });
    });

    context("with missing client_secret", function() {
      before(resetDatabase);

      before(function(done) {
        var requestBody = {
          grant_type:    'authorization_code',
          client_id:     '100',
          // client_secret: 'e2412cd1-f010-4514-acab-c8af59e5501a',
          device_code:   '65ec63a2-df53-4ceb-a938-f94e43b16a5e',
          scope:         'example-service.bbc.co.uk'
        };

        requestHelper.sendRequest(this, '/token', {
          method: 'post',
          type:   'json',
          data:   requestBody
        }, done);
      });

      it("should return an invalid_request error", function() {
        assertions.verifyError(this.res, 400, 'invalid_request');
      });
    });

    context("with incorrect client_secret", function() {
      before(resetDatabase);

      before(function(done) {
        var requestBody = {
          grant_type:    'authorization_code',
          client_id:     '100',
          client_secret: 'unknown',
          device_code:   '65ec63a2-df53-4ceb-a938-f94e43b16a5e',
          scope:         'example-service.bbc.co.uk'
        };

        requestHelper.sendRequest(this, '/token', {
          method: 'post',
          type:   'json',
          data:   requestBody
        }, done);
      });

      it("should return an invalid_client error", function() {
        assertions.verifyError(this.res, 400, 'invalid_client');
      });
    });

    // Note: don't test for missing device_code - this would be
    // a client-mode access token request.

    context("with incorrect device_code", function() {
      before(resetDatabase);

      before(function(done) {
        var requestBody = {
          grant_type:    'authorization_code',
          client_id:     '100',
          client_secret: 'e2412cd1-f010-4514-acab-c8af59e5501a',
          device_code:   'unknown',
          scope:         'example-service.bbc.co.uk'
        };

        requestHelper.sendRequest(this, '/token', {
          method: 'post',
          type:   'json',
          data:   requestBody
        }, done);
      });

      it("should return an invalid_client error", function() {
        assertions.verifyError(this.res, 400, 'invalid_client');
      });
    });

    context("with missing scope", function() {
      before(resetDatabase);

      before(function(done) {
        var requestBody = {
          grant_type:    'authorization_code',
          client_id:     '100',
          client_secret: 'e2412cd1-f010-4514-acab-c8af59e5501a',
          device_code:   '65ec63a2-df53-4ceb-a938-f94e43b16a5e',
          // scope:         'example-service.bbc.co.uk'
        };

        requestHelper.sendRequest(this, '/token', {
          method: 'post',
          type:   'json',
          data:   requestBody
        }, done);
      });

      it("should return an invalid_request error", function() {
        assertions.verifyError(this.res, 400, 'invalid_request');
      });
    });

    context("with incorrect scope", function() {
      before(resetDatabase);

      before(function(done) {
        var requestBody = {
          grant_type:    'authorization_code',
          client_id:     '100',
          client_secret: 'e2412cd1-f010-4514-acab-c8af59e5501a',
          device_code:   '65ec63a2-df53-4ceb-a938-f94e43b16a5e',
          scope:         'unknown'
        };

        requestHelper.sendRequest(this, '/token', {
          method: 'post',
          type:   'json',
          data:   requestBody
        }, done);
      });

      it("should return an invalid_client error", function() {
        assertions.verifyError(this.res, 400, 'invalid_client');
      });
    });

    context("when the pairing code has expired", function() {
      before(resetDatabase);

      before(function() {
        // The pairing code should expire one hour after it was created
        var time = new Date("Wed Apr 09 2014 12:00:00 GMT+0100").getTime();
        this.clock = sinon.useFakeTimers(time, "Date");
      });

      after(function() {
        this.clock.restore();
      });

      before(function(done) {
        var requestBody = {
          grant_type:    'authorization_code',
          client_id:     '101', // client with verified pairing code
          client_secret: '751ae023-7dc0-4650-b0ff-e48ea627d6b2',
          device_code:   'c691343f-0ac0-467d-8659-5041cfc3dc4a',
          scope:         'example-service.bbc.co.uk'
        };

        requestHelper.sendRequest(this, '/token', {
          method: 'post',
          type:   'json',
          data:   requestBody
        }, done);
      });

      it("should return an 'expired' error", function() {
        assertions.verifyError(this.res, 400, 'expired');
      });
    });
  });
});

describe("generate.accessToken", function() {
  it("should generate access tokens valid according to RFC6750 section 2.1", function() {
    var accessToken = generate.accessToken();

    // b64token    = 1*( ALPHA / DIGIT /
    //       "-" / "." / "_" / "~" / "+" / "/" ) *"="
    expect(accessToken).to.match(/^[A-Za-z0-9\-._~+/]+=*$/);
  });
});
