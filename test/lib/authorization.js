"use strict";

var db       = require('../../models');
var generate = require('../../lib/generate');

var assertions    = require('../assertions');
var requestHelper = require('../request-helper');

var resetDatabase = function(done) {
  db.sequelize.query('DELETE FROM ServiceAccessTokens').then(function() {
    return db.ServiceAccessToken.create({
      token: 'aed201ffb3362de42700a293bdebf694',
      service_provider_id: 1,
      client_id: 2,
      user_id: 3
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

var createUser = function(done) {
  var data = {
    id:           3,
    display_name: 'Joe Bloggs',
    photo_url:    'http://static.bbci.co.uk/frameworks/barlesque/2.59.12/orb/4/img/bbc-blocks-dark.png'
  };

  db.User
    .create(data)
    .complete(function(err, user) {
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
  before(createUser);

  context("given a valid access token", function() {
    before(function(done) {
      var data = {
        token: 'aed201ffb3362de42700a293bdebf694',
        service_provider_id: 'BBC1'
      };

      requestHelper.sendRequest(this, '/authorized', {
        method: 'post',
        type:   'form',
        data:   data
      }, done);
    });

    it("should return status 200", function() {
      expect(this.res.statusCode).to.equal(200);
    });

    it("should return a JSON object", function() {
      expect(this.res.headers['content-type']).to.equal('application/json; charset=utf-8');
      expect(this.res.body).to.be.an('object');
    });

    describe("the returned data", function() {
      it("should include the user id", function() {
        expect(this.res.body).to.have.property('user_id');
        expect(this.res.body.user_id).to.equal(3);
      });

      it("should include the client id", function() {
        expect(this.res.body).to.have.property('client_id');
        expect(this.res.body.client_id).to.equal(2);
      });

      it("should include the display name", function() {
        expect(this.res.body).to.have.property('display_name');
        expect(this.res.body.display_name).to.equal('Joe Bloggs');
      });

      it("should include the photo url", function() {
        expect(this.res.body).to.have.property('photo_url');
        expect(this.res.body.photo_url).to.equal('http://static.bbci.co.uk/frameworks/barlesque/2.59.12/orb/4/img/bbc-blocks-dark.png');
      });
    });
  });

  context("given an invalid access token", function() {
    before(function(done) {
      var data = {
        token: 'unknown',
        service_provider_id: 'unknown'
      };

      requestHelper.sendRequest(this, '/authorized', {
        method: 'post',
        type:   'form',
        data:   data
      }, done);
    });

    it("should return an 'unauthorized' error", function() {
      assertions.verifyError(this.res, 401, 'unauthorized');
    });
  });

  context("given an expired access token", function() {
    it("should return status 401");
  });

  context("with missing access token", function() {
    before(function(done) {
      var data = {
        service_provider_id: 'BBC1'
      };

      requestHelper.sendRequest(this, '/authorized', {
        method: 'post',
        type:   'form',
        data:   data
      }, done);
    });

    it("should return an 'invalid_request' error", function() {
      assertions.verifyError(this.res, 400, 'invalid_request');
    });
  });

  context("with invalid service provider id", function() {
    before(function(done) {
      var data = {
        token: 'aed201ffb3362de42700a293bdebf694',
        service_provider_id: 'unknown'
      };

      requestHelper.sendRequest(this, '/authorized', {
        method: 'post',
        type:   'form',
        data:   data
      }, done);
    });

    it("should return an 'unauthorized' error", function() {
      assertions.verifyError(this.res, 401, 'unauthorized');
    });
  });

  context("with missing service provider id", function() {
    before(function(done) {
      var data = {
        token: 'aed201ffb3362de42700a293bdebf694'
      };

      requestHelper.sendRequest(this, '/authorized', {
        method: 'post',
        type:   'form',
        data:   data
      }, done);
    });

    it("should return an 'invalid_request' error", function() {
      assertions.verifyError(this.res, 400, 'invalid_request');
    });
  });
});
