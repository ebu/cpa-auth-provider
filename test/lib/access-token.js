"use strict";

var db       = require('../../models');
var generate = require('../../lib/generate');

var _ = require('lodash');

var sendPostRequest = function(context, options, done) {
  request
    .post(options.path)
    .type(options.type || 'form') // sets Content-Type: application/x-www-form-urlencoded
    .send(options.data)
    .end(function(err, res) {
      context.res = res;
      done(err);
    });
};

var resetDatabase = function(done) {
  db.sequelize.query('DELETE FROM PairingCodes').then(function() {
    return db.sequelize.query('DELETE FROM ServiceAccessTokens');
  })
  .then(function() {
    done();
  },
  function(error) {
    done(error);
  });
};

var createPairingCode = function(attributes, done) {
  var data = {
    client_id:        attributes.clientId,
    device_code:      '8ecf4b2a0df2df7fd69df128e0ac4fcc',
    user_code:        '0a264',
    verification_uri: 'http://www.example.com/verify',
    verified:         attributes.verified
  };

  db.PairingCode
    .create(data)
    .success(function(pairingCode) {
      done();
    });
};

var verifyError = function(res, error) {
  expect(res.headers['content-type']).to.equal('application/json; charset=utf-8');
  expect(res.body).to.be.an('object');
  expect(res.body).to.have.property('error');
  expect(res.body.error).to.equal(error);
};

describe("POST /token", function() {
  before(function() {
    sinon.stub(generate, 'accessToken').returns('aed201ffb3362de42700a293bdebf694');
  });

  after(function() {
    generate.accessToken.restore();
  });

  context("Polling to obtain an access token", function() {
    context("with incorrect Content-Type", function() {
      before(function(done) {
        var requestBody = {
          client_id:  '101',
          grant_type: 'authorization_code',
          code:       '8ecf4b2a0df2df7fd69df128e0ac4fcc'
        };

        sendPostRequest(this, { path: '/token', type: 'json', data: requestBody }, done);
      });

      it("should return status 400", function() {
        expect(this.res.statusCode).to.equal(400);
      });

      it("should return an invalid_request error", function() {
        verifyError(this.res, 'invalid_request');
      });
    });

    context("with missing client_id", function() {
      before(function(done) {
        var requestBody = {
          // client_id:  '101',
          grant_type: 'authorization_code',
          code:       '8ecf4b2a0df2df7fd69df128e0ac4fcc'
        };

        sendPostRequest(this, { path: '/token', data: requestBody }, done);
      });

      it("should return status 400", function() {
        expect(this.res.statusCode).to.equal(400);
      });

      it("should return an invalid_request error", function() {
        verifyError(this.res, 'invalid_request');
      });
    });

    context("with an invalid client_id", function() {
      before(function(done) {
        var requestBody = {
          client_id:  'unknown',
          grant_type: 'authorization_code',
          code:       '8ecf4b2a0df2df7fd69df128e0ac4fcc'
        };

        sendPostRequest(this, { path: '/token', data: requestBody }, done);
      });

      it("should return status 400", function() {
        expect(this.res.statusCode).to.equal(400);
      });

      it("should return an invalid_client error", function() {
        verifyError(this.res, 'invalid_client');
      });
    });

    context("with missing grant_type", function() {
      before(function(done) {
        var requestBody = {
          client_id:  '101',
          // grant_type: 'authorization_code',
          code:       '8ecf4b2a0df2df7fd69df128e0ac4fcc'
        };

        sendPostRequest(this, { path: '/token', data: requestBody }, done);
      });

      it("should return status 400", function() {
        expect(this.res.statusCode).to.equal(400);
      });

      it("should return an invalid_request error", function() {
        verifyError(this.res, 'invalid_request');
      });
    });

    context("with an invalid grant_type", function() {
      before(function(done) {
        var requestBody = {
          client_id:  '101',
          grant_type: 'unknown',
          code:       '8ecf4b2a0df2df7fd69df128e0ac4fcc'
        };

        sendPostRequest(this, { path: '/token', data: requestBody }, done);
      });

      it("should return status 400", function() {
        expect(this.res.statusCode).to.equal(400);
      });

      it("should return an unsupported_grant_type error", function() {
        verifyError(this.res, 'unsupported_grant_type');
      });
    });

    context("with a valid client_id", function() {
      context("when the authorization request is pending", function() {
        context("when the authorization code is valid", function() {
          before(resetDatabase);

          before(function(done) {
            createPairingCode({ clientId: 100, verified: false }, done);
          });

          before(function(done) {
            var requestBody = {
              client_id:  '100',
              grant_type: 'authorization_code',
              code:       '8ecf4b2a0df2df7fd69df128e0ac4fcc'
            };

            sendPostRequest(this, { path: '/token', data: requestBody }, done);
          });

          it("should return status 400", function() {
            expect(this.res.statusCode).to.equal(400);
          });

          it("should return an authorization_pending error", function() {
            verifyError(this.res, 'authorization_pending');
          });
        });

        context("when the authorization code is invalid", function() {
          before(resetDatabase);

          before(function(done) {
            createPairingCode({ clientId: 100, verified: false }, done);
          });

          before(function(done) {
            var requestBody = {
              client_id:  '100',
              grant_type: 'authorization_code',
              code:       'invalid'
            };

            sendPostRequest(this, { path: '/token', data: requestBody }, done);
          });

          it("should return status 400", function() {
            expect(this.res.statusCode).to.equal(400);
          });

          it("should return an invalid_client error", function() {
            verifyError(this.res, 'invalid_client');
          });
        });
      });

      // RFC 6749, section 5.1
      context("when the authorization request is successful", function() {
        context("when the authorization code is valid", function() {
          before(resetDatabase);

          before(function(done) {
            createPairingCode({ clientId: 101, verified: true }, done);
          });

          before(function(done) {
            var requestBody = {
              client_id:  '101',
              grant_type: 'authorization_code',
              code:       '8ecf4b2a0df2df7fd69df128e0ac4fcc'
            };

            sendPostRequest(this, { path: '/token', data: requestBody }, done);
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

            it("should include a valid refresh token"); // TODO: optional: refresh_token
            it("should include the lifetime of the access token"); // TODO: recommended: expires_in
            it("should include the scope of the access token"); // TODO: optional(?): scope
          });

          describe("the database", function() {
            before(function(done) {
              var self = this;

              db.ServiceAccessToken.findAll()
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
              expect(this.pairingCodes.length).to.equal(0);
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

              it("should be associated with the correct client device", function() {
                expect(this.accessTokens[0].client_id).to.equal(101);
              });

              it("should be associated with the correct user");

              it("should be associated with the correct service provider");
            });
          });
        });

        context("when the authorization code is invalid", function() {
          before(resetDatabase);

          before(function(done) {
            createPairingCode({ clientId: 101, verified: true }, done);
          });

          before(function(done) {
            var requestBody = {
              client_id:  '101',
              grant_type: 'authorization_code',
              code:       'invalid'
            };

            sendPostRequest(this, { path: '/token', data: requestBody }, done);
          });

          it("should return status 400", function() {
            expect(this.res.statusCode).to.equal(400);
          });

          it("should return invalid_client error", function() {
            verifyError(this.res, 'invalid_client');
          });
        });

        context("with missing authorization code", function() {
          before(resetDatabase);

          before(function(done) {
            createPairingCode({ clientId: 101, verified: true }, done);
          });

          before(function(done) {
            var requestBody = {
              client_id:  '101',
              grant_type: 'authorization_code',
              // code:       '8ecf4b2a0df2df7fd69df128e0ac4fcc'
            };

            sendPostRequest(this, { path: '/token', data: requestBody }, done);
          });

          it("should return status 400", function() {
            expect(this.res.statusCode).to.equal(400);
          });

          it("should return invalid_request error", function() {
            verifyError(this.res, 'invalid_request');
          });
        });
      });
    });

    context("when the client polls too quickly", function() {
      it("should return status 400");
      it("should return slow_down error");
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
