"use strict";

var db       = require('../../models');
var generate = require('../../lib/generate');

var assertions = require('../assertions');
var requestHelper = require('../request-helper');

// Tests for the End-point implementing the OAuth 2.0 Device Profile
// http://tools.ietf.org/html/draft-recordon-oauth-v2-device-00#page-3

var clearDatabase = function(done) {
  db.sequelize.query('DELETE FROM Clients').then(function() {
    done();
  },
  function(error) {
    done(error);
  });
};

var createClient = function(done) {
  db.Client
    .create({
      id:               3,
      secret:           'a0fe0231-0220-4d45-8431-1fd374998d78',
      name:             'Test client',
      software_id:      'CPA AP Test',
      software_version: '0.0.1',
      ip:               '127.0.0.1'
    })
    .then(function() {
      done();
    },
    function(err) {
      done(err);
    });
};

var createScope = function(done) {
  var data = {
    id:     1,
    name:   'example-service.bbc.co.uk'
  };

  db.Scope
    .create(data)
    .complete(function(err, scope) {
      done();
    });
};

describe('POST /associate', function() {
  before(function() {
    sinon.stub(generate, "deviceCode").returns("8ecf4b2a0df2df7fd69df128e0ac4fcc");
    sinon.stub(generate, "userCode").returns("0a264");
  });

  after(function() {
    generate.deviceCode.restore();
    generate.userCode.restore();
  });

  before(clearDatabase);
  before(createClient);
  before(createScope);

  context('with valid parameters', function() {
    before(function(done) {
      var data = {
        client_id:        3,
        client_secret:    'a0fe0231-0220-4d45-8431-1fd374998d78',
        scope:            'example-service.bbc.co.uk',
      };

      requestHelper.sendRequest(this, '/associate', {
        method: 'post',
        type:   'json',
        data:   data
      }, done);
    });

    it('should return a status 200', function() {
      expect(this.res.statusCode).to.equal(200);
    });

    // See example request in
    // http://tools.ietf.org/html/draft-recordon-oauth-v2-device-00#section-1.4

    it("should return a Cache-Control: no-store header", function() {
      expect(this.res.headers).to.have.property('cache-control');
      expect(this.res.headers['cache-control']).to.equal('no-store');
    });

    it("should return a Pragma: no-cache header", function() {
      expect(this.res.headers).to.have.property('pragma');
      expect(this.res.headers.pragma).to.equal('no-cache');
    });

    it('should return JSON', function() {
      expect(this.res.headers['content-type']).to.equal('application/json; charset=utf-8');
    });

    describe('the response body', function() {
      it('should be a JSON object', function() {
        expect(this.res.body).to.be.an('object');
      });

      // TODO: remove test
      it('should include the device code', function() {
        expect(this.res.body).to.not.have.property('device_code');
      });

      it('should include the user code', function() {
        expect(this.res.body).to.have.property('user_code');
        expect(this.res.body.user_code).to.equal('0a264');
      });

      it('should include the verification uri', function() {
        expect(this.res.body).to.have.property('verification_uri');
        expect(this.res.body.verification_uri).to.equal('http://example.com/verify');
      });

      it('should include the expiry (time to live) of the user code', function() {
        expect(this.res.body).to.have.property('expires_in');
        expect(this.res.body.expires_in).to.equal(3600); // duration in seconds
      });

      it('should include the minimum polling interval', function() {
        expect(this.res.body).to.have.property('interval');
        expect(this.res.body.interval).to.equal(5); // interval in seconds
      });
    });

    context('with incorrect content type', function() {
      before(function(done) {
        var data = {
          client_id:     3,
          client_secret: 'a0fe0231-0220-4d45-8431-1fd374998d78',
          scope:         'example-service.bbc.co.uk',
        };

        requestHelper.sendRequest(this, '/associate', {
          method: 'post',
          type:   'form', // should be 'json'
          data:   data
        }, done);
      });

      it("should return invalid_request error", function() {
        assertions.verifyError(this.res, 400, 'invalid_request');
      });
    });

    context('with missing client_id', function() {
      before(function(done) {
        var data = {
          client_id:     null,
          client_secret: 'a0fe0231-0220-4d45-8431-1fd374998d78',
          scope:         'example-service.bbc.co.uk',
        };

        requestHelper.sendRequest(this, '/associate', {
          method: 'post',
          type:   'json',
          data:   data
        }, done);
      });

      it("should return invalid_request error", function() {
        assertions.verifyError(this.res, 400, 'invalid_request');
      });
    });

    context('with an invalid client_id', function() {
      before(function(done) {
        var data = {
          client_id:     '-|13',
          client_secret: 'a0fe0231-0220-4d45-8431-1fd374998d78',
          scope:         'example-service.bbc.co.uk'
        };

        requestHelper.sendRequest(this, '/associate', {
          method: 'post',
          type:   'json',
          data:   data
        }, done);
      });

      it("should return invalid_client error", function() {
        assertions.verifyError(this.res, 400, 'invalid_client');
      });
    });

    context('with an unknown client_id', function() {
      before(function(done) {
        var data = {
          client_id:     4,
          client_secret: 'a0fe0231-0220-4d45-8431-1fd374998d78',
          scope:         'example-service.bbc.co.uk'
        };

        requestHelper.sendRequest(this, '/associate', {
          method: 'post',
          type:   'json',
          data:   data
        }, done);
      });

      it("should return invalid_client error", function() {
        assertions.verifyError(this.res, 400, 'invalid_client');
      });
    });

    context('with missing scope', function() {
      before(function(done) {
        var data = {
          client_id:     3,
          client_secret: 'a0fe0231-0220-4d45-8431-1fd374998d78'
          // scope:         'example-service.bbc.co.uk'
        };

        requestHelper.sendRequest(this, '/associate', {
          method: 'post',
          type:   'json',
          data:   data
        }, done);
      });

      it("should return an invalid_request error", function() {
        assertions.verifyError(this.res, 400, 'invalid_request');
      });
    });

    context('with an unknown scope', function() {
      before(function(done) {
        var data = {
          client_id:     3,
          client_secret: 'a0fe0231-0220-4d45-8431-1fd374998d78',
          scope:         'unknown'
        };

        requestHelper.sendRequest(this, '/associate', {
          method: 'post',
          type:   'json',
          data:   data
        }, done);
      });

      it("should return an invalid_request error", function() {
        assertions.verifyError(this.res, 400, 'invalid_request');
      });
    });
  });
});
