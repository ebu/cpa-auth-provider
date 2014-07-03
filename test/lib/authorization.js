"use strict";

var db       = require('../../models');
var generate = require('../../lib/generate');

var assertions    = require('../assertions');
var requestHelper = require('../request-helper');

var resetDatabase = function(done) {
  db.sequelize.query('DELETE FROM AccessTokens').then(function() {
    return db.AccessToken.create({
      token:     'aed201ffb3362de42700a293bdebf694',
      domain_id: 1,
      client_id: 2,
      user_id:   3
    });
  })
  .then(function() {
    return db.AccessToken.create({
      token:     'af03736940844fccb0147f12a9d188fb',
      domain_id: 1,
      client_id: 4
    });
  })
  .then(function() {
    db.AccessToken.create({
      token:     '8a7be6ef96a946b6993b1c79a39702b0',
      domain_id: 1,
      client_id: 5
    });
  })
  .then(function() {
    done();
  },
  function(error) {
    done(error);
  });
};

var createDomain = function(done) {
  var data = {
    id:   1,
    name: 'example-service.bbc.co.uk',
    access_token: '70fc2cbe54a749c38da34b6a02e8dfbd'
  };

  db.Domain
    .create(data)
    .complete(function(err, domain) {
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

describe("POST /authorized", function() {
  before(function() {
    // The access token should expire 30 days after it was created
    var time = new Date("Wed Apr 09 2014 11:00:00 GMT+0100").getTime();
    this.clock = sinon.useFakeTimers(time, "Date");
  });

  after(function() {
    this.clock.restore();
  });

  before(resetDatabase);
  before(createDomain);
  before(createUser);

  context("with a valid user mode access token", function() {
    before(function(done) {
      var data = {
        access_token: 'aed201ffb3362de42700a293bdebf694',
        domain:       'example-service.bbc.co.uk'
      };

      requestHelper.sendRequest(this, '/authorized', {
        method:      'post',
        type:        'json',
        data:        data,
        accessToken: '70fc2cbe54a749c38da34b6a02e8dfbd'
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

  context("with a valid client mode access token", function() {
    before(function(done) {
      var data = {
        access_token: 'af03736940844fccb0147f12a9d188fb',
        domain:       'example-service.bbc.co.uk'
      };

      requestHelper.sendRequest(this, '/authorized', {
        method:      'post',
        type:        'json',
        data:        data,
        accessToken: '70fc2cbe54a749c38da34b6a02e8dfbd'
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
      it("should not include a user id", function() {
        expect(this.res.body).to.not.have.property('user_id');
      });

      it("should include the client id", function() {
        expect(this.res.body).to.have.property('client_id');
        expect(this.res.body.client_id).to.equal(4);
      });

      it("should not include a display name", function() {
        expect(this.res.body).to.not.have.property('display_name');
      });

      it("should not include a photo url", function() {
        expect(this.res.body).to.not.have.property('photo_url');
      });
    });
  });

  context("with incorrect content type", function() {
    before(function(done) {
      var data = {
        access_token: 'aed201ffb3362de42700a293bdebf694',
        domain:       'example-service.bbc.co.uk'
      };

      requestHelper.sendRequest(this, '/authorized', {
        method:      'post',
        type:        'form', // should be 'json'
        data:        data,
        accessToken: '70fc2cbe54a749c38da34b6a02e8dfbd'
      }, done);
    });

    it("should return an 'invalid_request' error", function() {
      assertions.verifyError(this.res, 400, 'invalid_request');
    });
  });

  context("with an invalid client access token", function() {
    before(function(done) {
      var data = {
        access_token: 'unknown',
        domain:       'example-service.bbc.co.uk'
      };

      requestHelper.sendRequest(this, '/authorized', {
        method:      'post',
        type:        'json',
        data:        data,
        accessToken: '70fc2cbe54a749c38da34b6a02e8dfbd'
      }, done);
    });

    it("should return a 'not_found' error", function() {
      assertions.verifyError(this.res, 404, 'not_found');
    });
  });

  context("with an expired access token", function() {
    before(function() {
      // The access token should expire 30 days after it was created
      var time = new Date("Fri May 9 2014 11:00:00 GMT+0100").getTime();
      this.clock = sinon.useFakeTimers(time, "Date");
    });

    after(function() {
      this.clock.restore();
    });

    before(function(done) {
      var data = {
        access_token: '8a7be6ef96a946b6993b1c79a39702b0',
        domain:       'example-service.bbc.co.uk'
      };

      requestHelper.sendRequest(this, '/authorized', {
        method:      'post',
        type:        'json',
        data:        data,
        accessToken: '70fc2cbe54a749c38da34b6a02e8dfbd'
      }, done);
    });

    it("should return a 'not_found' error", function() {
      assertions.verifyError(this.res, 404, 'not_found');
    });
  });

  context("with missing client access token", function() {
    before(function(done) {
      var data = {
        // access_token: 'aed201ffb3362de42700a293bdebf694',
        domain: 'example-service.bbc.co.uk'
      };

      requestHelper.sendRequest(this, '/authorized', {
        method:      'post',
        type:        'json',
        data:        data,
        accessToken: '70fc2cbe54a749c38da34b6a02e8dfbd'
      }, done);
    });

    it("should return an 'invalid_request' error", function() {
      assertions.verifyError(this.res, 400, 'invalid_request');
    });
  });

  context("with invalid domain", function() {
    before(function(done) {
      var data = {
        access_token: 'aed201ffb3362de42700a293bdebf694',
        domain:       'unknown'
      };

      requestHelper.sendRequest(this, '/authorized', {
        method:      'post',
        type:        'json',
        data:        data,
        accessToken: '70fc2cbe54a749c38da34b6a02e8dfbd'
      }, done);
    });

    it("should return an 'unauthorized' error", function() {
      assertions.verifyError(this.res, 401, 'unauthorized');
    });
  });

  context("with missing domain", function() {
    before(function(done) {
      var data = {
        access_token: 'aed201ffb3362de42700a293bdebf694'
        // domain: 'example-service.bbc.co.uk'
      };

      requestHelper.sendRequest(this, '/authorized', {
        method:      'post',
        type:        'json',
        data:        data,
        accessToken: '70fc2cbe54a749c38da34b6a02e8dfbd'
      }, done);
    });

    it("should return an 'invalid_request' error", function() {
      assertions.verifyError(this.res, 400, 'invalid_request');
    });
  });

  context("with an extra parameter", function() {
    before(function(done) {
      var data = {
        access_token: 'aed201ffb3362de42700a293bdebf694',
        domain:       'example-service.bbc.co.uk',
        extra:        'test'
      };

      requestHelper.sendRequest(this, '/authorized', {
        method:      'post',
        type:        'json',
        data:        data,
        accessToken: '70fc2cbe54a749c38da34b6a02e8dfbd'
      }, done);
    });

    it("should return an 'invalid_request' error", function() {
      assertions.verifyError(this.res, 400, 'invalid_request');
    });
  });
});
