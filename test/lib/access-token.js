"use strict";

var db = require('../../models');
var _ = require('lodash');
var async = require('async');

function sendPostRequest(context, path, data, done) {
  request
    .post(path)
    .type('form') // sets Content-Type: application/x-www-form-urlencoded
    .send(data)
    .end(function(err, res) {
      context.res = res;
      done(err);
    });
};

function createRequestBody(clientId, grantType) {
  var requestBody = {};

  if (!_.isUndefined(clientId)) {
    requestBody.client_id = clientId;
  }

  if (!_.isUndefined(grantType)) {
    requestBody.grant_type = grantType;
  }

  return requestBody;
}

function resetDatabase(done) {
  // TODO: sequelize lacks a method to delete all records from a table.
  // -- DELETE FROM pairingCodes;

  db.PairingCode.findAll().success(function(pairingCodes) {
    async.each(
      pairingCodes,
      function(obj, callback) {
        obj.destroy().success(function() {
          callback();
        });
      },
      done
    );
  });
}

function createPairingCode(attributes, done) {
  var data = {
    ClientId:         attributes.clientId,
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
}

describe("POST /token", function() {
  beforeEach(resetDatabase);

  context("Polling to obtain an access token", function() {
    context("with a missing client_id", function() {
      before(function(done) {
        var requestBody = createRequestBody(undefined, 'authorization_code');

        sendPostRequest(this, '/token', requestBody, done);
      });

      it("should return status 400", function() {
        expect(this.res.statusCode).to.equal(400);
      });
    });

    context("with an invalid client_id", function() {
      before(function(done) {
        var requestBody = createRequestBody('unknown', 'authorization_code');

        sendPostRequest(this, '/token', requestBody, done);
      });

      it("should return status 400", function() {
        expect(this.res.statusCode).to.equal(400);
      });
    });

    context("with an invalid grant_type", function() {
      before(function(done) {
        var requestBody = createRequestBody('101', 'unknown');

        sendPostRequest(this, '/token', requestBody, done);
      });

      it("should return status 400", function() {
        expect(this.res.statusCode).to.equal(400);
      });
    });

    context("with a valid client_id", function() {
      context("when the authorization request is pending", function() {
        before(function(done) {
          var self = this;

          createPairingCode({ clientId: 100, verified: false }, done);
        });

        before(function(done) {
          var requestBody = createRequestBody('100', 'authorization_code');

          sendPostRequest(this, '/token', requestBody, done);
        });

        it("should return status 400", function() {
          expect(this.res.statusCode).to.equal(400);
        });

        it("should return a JSON object", function() {
          expect(this.res.headers['content-type']).to.equal('application/json; charset=utf-8');
          expect(this.res.body).to.be.an('object');
        });

        it("should return authorization_pending error", function() {
          expect(this.res.body).to.have.property('error');
          expect(this.res.body.error).to.equal('authorization_pending');
        });
      });
    });

    // RFC 6749, section 5.1
    context("when the authorization request is successful", function() {
      before(function(done) {
        createPairingCode({ clientId: 101, verified: true }, done);
      });

      before(function(done) {
        var requestBody = createRequestBody('101', 'authorization_code');

        sendPostRequest(this, '/token', requestBody, done);
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
        expect(this.res.headers['pragma']).to.equal('no-cache');
      });

      it("should return a JSON object", function() {
        expect(this.res.headers['content-type']).to.equal('application/json; charset=utf-8');
        expect(this.res.body).to.be.an('object');
      });

      describe("the response body", function() {
        it("should include a valid access token");
        it("should include the token type");

        // it("should include a valid refresh token"); // optional: refresh_token
        // it("should include the lifetime of the access token"); // optional: expires_in
        // it("should include the scope of the access token"); // optional(?): scope
      });
    });

    context("when the client polls too quickly", function() {
      it("should return status 400");
      it("should return slow_down error");
    });
  });
});
