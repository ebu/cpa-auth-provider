"use strict";

var db       = require('../../models');
var generate = require('../../lib/generate');

var sendPostRequest = function(context, options, done) {
  var req = request.post(options.path)
    .type(options.type || 'form'); // sets Content-Type: application/x-www-form-urlencoded

  if (options.data) {
    req.send(options.data);
  }

  req.end(function(err, res) {
    context.res = res;
    done(err);
  });
};

var resetDatabase = function(done) {
  db.sequelize.query('DELETE FROM ServiceAccessTokens').then(function() {
    return db.ServiceAccessToken.create({
      token: 'aed201ffb3362de42700a293bdebf694',
      service_provider_id: 1,
      client_id: 1,
      user_id: 1
    });
  })
  .then(function() {
    done();
  },
  function(error) {
    done(error);
  });
};

var createServiceProvider = function(done) {
  var data = {
    id:     1,
    name:   'BBC1'
  };

  db.ServiceProvider
    .create(data)
    .complete(function(err, serviceProvider) {
      done();
    });
};

var verifyError = function(res, error) {
  expect(res.headers['content-type']).to.equal('application/json; charset=utf-8');
  expect(res.body).to.be.an('object');
  expect(res.body).to.have.property('error');
  expect(res.body.error).to.equal(error);
};

describe("Access token verification", function() {
  before(resetDatabase);
  before(createServiceProvider);

  context("given a valid access token", function() {
    before(function(done) {
      var request = {
        path: '/authorized',
        data: {
          token: 'aed201ffb3362de42700a293bdebf694',
          service_provider_id: 1
        }
      };

      sendPostRequest(this, request, done);
    });

    it("should return status 200", function() {
      expect(this.res.statusCode).to.equal(200);
    });
  });

  context("given an invalid access token", function() {
    before(function(done) {
      var request = {
        path: '/authorized',
        data: {
          token: 'unknown',
          service_provider_id: 1
        }
      };

      sendPostRequest(this, request, done);
    });

    it("should return status 401", function() {
      expect(this.res.statusCode).to.equal(401);
    });

    it("should return an 'unauthorized' error", function() {
      verifyError(this.res, 'unauthorized');
    });
  });

  context("given an expired access token", function() {
    it("should return status 401");
  });

  context("with missing access token", function() {
    before(function(done) {
      var request = {
        path: '/authorized',
        data: {
          service_provider_id: 1
        }
      };

      sendPostRequest(this, request, done);
    });

    it("should return status 400", function() {
      expect(this.res.statusCode).to.equal(400);
    });

    it("should return an 'invalid_request' error", function() {
      verifyError(this.res, 'invalid_request');
    });
  });

  context("with invalid service provider id", function() {
    before(function(done) {
      var request = {
        path: '/authorized',
        data: {
          token: 'aed201ffb3362de42700a293bdebf694',
          service_provider_id: 2
        }
      };

      sendPostRequest(this, request, done);
    });

    it("should return status 401", function() {
      expect(this.res.statusCode).to.equal(401);
    });

    it("should return an 'unauthorized' error", function() {
      verifyError(this.res, 'unauthorized');
    });
  });

  context("with missing service provider id", function() {
    before(function(done) {
      var request = {
        path: '/authorized',
        data: {
          token: 'aed201ffb3362de42700a293bdebf694'
        }
      };

      sendPostRequest(this, request, done);
    });

    it("should return status 400", function() {
      expect(this.res.statusCode).to.equal(400);
    });

    it("should return an 'invalid_request' error", function() {
      verifyError(this.res, 'invalid_request');
    });
  });
});
