"use strict";

var db       = require('../../models');
var generate = require('../../lib/generate');

var assertions    = require('../assertions');
var requestHelper = require('../request-helper');

var clearDatabase = function(done) {
  db.sequelize.query('DELETE FROM Scopes').then(function() {
    return db.sequelize.query('DELETE FROM Clients');
  })
  .then(function() {
    return db.sequelize.query('DELETE FROM ServiceAccessTokens');
  })
  .then(function() {
    done();
  },
  function(error) {
    done(new Error(JSON.stringify(error)));
  });
};

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
      return db.Scope.create({
        id:           5,
        name:         'example-service.bbc.co.uk',
        display_name: 'BBC Radio'
      });
    })
    .then(function() {
      done();
    },
    function(error) {
      done(new Error(JSON.stringify(error)));
    });
};

describe('POST /token', function() {
  context("when the client requests an access token (client mode)", function() {
    before(function() {
      sinon.stub(generate, 'accessToken').returns('aed201ffb3362de42700a293bdebf6123');
    });

    after(function() {
      generate.accessToken.restore();
    });

    before(clearDatabase);
    before(initDatabase);

    context('with valid parameters', function() {
      before(function(done) {
        var body = {
          grant_type:    'authorization_code',
          client_id:     100,
          client_secret: 'e2412cd1-f010-4514-acab-c8af59e5501a',
          scope:         'example-service.bbc.co.uk'
        };

        requestHelper.sendRequest(this, '/token', {
          method: 'post',
          type:   'json',
          data:   body
        }, done);
      });

      it('should reply with a status code 200', function() {
        expect(this.res.statusCode).to.equal(200);
      });

      it('should be return a JSON object', function() {
        expect(this.res.headers['content-type']).to.equal('application/json; charset=utf-8');
        expect(this.res.body).to.be.an('object');
      });

      describe("the response body", function() {
        it("should include a valid access token", function() {
          expect(this.res.body).to.have.property('token');
          expect(this.res.body.token).to.equal('aed201ffb3362de42700a293bdebf6123');
        });

        it("should include the token type", function() {
          expect(this.res.body).to.have.property('token_type');
          expect(this.res.body.token_type).to.equal('bearer');
        });

        it("should include a description", function() {
          expect(this.res.body).to.have.property('description');
          expect(this.res.body.description).to.equal('This radio at BBC Radio');
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

          db.ServiceAccessToken.findAll()
            .then(function(accessTokens) {
              self.accessTokens = accessTokens;
              done();
            },
            function(error) {
              done(error);
            });
        });

        it("should contain a new access token", function() {
          // jshint expr: true
          expect(this.accessTokens).to.be.ok;
          expect(this.accessTokens).to.be.an('array');
          expect(this.accessTokens.length).to.equal(1);
        });

        describe("the access token", function() {
          it("should have correct value", function() {
            expect(this.accessTokens[0].token).to.equal('aed201ffb3362de42700a293bdebf6123');
          });

          it("should be associated with the correct client", function() {
            expect(this.accessTokens[0].client_id).to.equal(100);
          });

          it("should not be associated with a user", function(){
            expect(this.accessTokens[0].user_id).to.equal(null);
          });

          it("should be associated with the correct scope", function() {
            expect(this.accessTokens[0].scope_id).to.equal(5);
          });
        });
      });
    });

    context('with incorrect content type', function() {
      before(function(done) {
        var body = {
          grant_type:    'authorization_code',
          client_id:     100,
          client_secret: 'e2412cd1-f010-4514-acab-c8af59e5501a',
          scope:         'example-service.bbc.co.uk'
        };

        requestHelper.sendRequest(this, '/token', {
          method: 'post',
          type:   'form', // should be 'json'
          data:   body
        }, done);
      });

      it("should return an invalid_request error", function() {
        assertions.verifyError(this.res, 400, 'invalid_request');
      });
    });

    context('with missing client_id', function() {
      before(function(done) {
        var body = {
          grant_type:    'authorization_code',
          // client_id:     100,
          client_secret: 'e2412cd1-f010-4514-acab-c8af59e5501a',
          scope:         'example-service.bbc.co.uk'
        };

        requestHelper.sendRequest(this, '/token', {
          method: 'post',
          type:   'json',
          data:   body
        }, done);
      });

      it("should return an invalid_request error", function() {
        assertions.verifyError(this.res, 400, 'invalid_request');
      });
    });

    context('with incorrect client_id', function() {
      before(function(done) {
        var body = {
          grant_type:    'authorization_code',
          client_id:     'unknown',
          client_secret: 'e2412cd1-f010-4514-acab-c8af59e5501a',
          scope:         'example-service.bbc.co.uk'
        };

        requestHelper.sendRequest(this, '/token', {
          method: 'post',
          type:   'json',
          data:   body
        }, done);
      });

      it("should return an invalid_client error", function() {
        assertions.verifyError(this.res, 400, 'invalid_client');
      });
    });

    context('with missing client_secret', function() {
      before(function(done) {
        var body = {
          grant_type:    'authorization_code',
          client_id:     100,
          // client_secret: 'e2412cd1-f010-4514-acab-c8af59e5501a',
          scope:         'example-service.bbc.co.uk'
        };

        requestHelper.sendRequest(this, '/token', {
          method: 'post',
          type:   'json',
          data:   body
        }, done);
      });

      it("should return an invalid_request error", function() {
        assertions.verifyError(this.res, 400, 'invalid_request');
      });
    });

    context('with incorrect client_secret', function() {
      before(function(done) {
        var body = {
          grant_type:    'authorization_code',
          client_id:     100,
          client_secret: 'unknown',
          scope:         'example-service.bbc.co.uk'
        };

        requestHelper.sendRequest(this, '/token', {
          method: 'post',
          type:   'json',
          data:   body
        }, done);
      });

      it("should return an invalid_client error", function() {
        assertions.verifyError(this.res, 400, 'invalid_client');
      });
    });

    context('with missing scope', function() {
      before(function(done) {
        var body = {
          grant_type:    'authorization_code',
          client_id:     100,
          client_secret: 'e2412cd1-f010-4514-acab-c8af59e5501a'
          // scope:         'example-service.bbc.co.uk'
        };

        requestHelper.sendRequest(this, '/token', {
          method: 'post',
          type:   'json',
          data:   body
        }, done);
      });

      it("should return an invalid_request error", function() {
        assertions.verifyError(this.res, 400, 'invalid_request');
      });
    });

    context('with incorrect scope', function() {
      before(function(done) {
        var body = {
          grant_type:    'authorization_code',
          client_id:     100,
          client_secret: 'e2412cd1-f010-4514-acab-c8af59e5501a',
          scope:         'unknown'
        };

        requestHelper.sendRequest(this, '/token', {
          method: 'post',
          type:   'json',
          data:   body
        }, done);
      });

      it("should return an invalid_client error", function() {
        assertions.verifyError(this.res, 400, 'invalid_client');
      });
    });
  });
});
