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
      secret:           'secret',
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

var sendRequest = function(context, options, done) {
  var body = {
    client_id:     options.client_id,
    response_type: options.response_type,
    service_provider: options.service_provider
  };

  request.post('/token')
    .type('form') // sets Content-Type: application/x-www-form-urlencoded
    .send(body)
    .end(function(err, res) {
      context.res = res;
      done(err);
    });
};

describe('POST /token', function() {
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
  before(createServiceProvider);

  // http://tools.ietf.org/html/draft-recordon-oauth-v2-device-00#section-1.4
  context('When requesting an authorization', function() {
    context('without response_type', function() {
      // SPEC: Not found in spec
      // http://tools.ietf.org/html/draft-recordon-oauth-v2-device-00#section-1.4

      context('without providing a client_id', function() {
        before(function(done) {
          sendRequest(this, { client_id: null, response_type: null }, done);
        });

        it("should return invalid_request error", function() {
          assertions.verifyError(this.res, 400, 'invalid_request');
        });
      });

      context('using an invalid client_id', function() {
        before(function(done) {
          sendRequest(this, { client_id: '-|13', response_type: null }, done);
        });

        it("should return invalid_request error", function() {
          assertions.verifyError(this.res, 400, 'invalid_request');
        });
      });

      context('using a valid client_id', function() {
        before(function(done) {
          sendRequest(this, { client_id: 3, response_type: null }, done);
        });

        it("should return invalid_request error", function() {
          assertions.verifyError(this.res, 400, 'invalid_request');
        });
      });
    });

    context('using an invalid response_type', function() {
      context('without providing a client_id', function() {
        before(function(done) {
          sendRequest(this, { client_id: null, response_type: '123' }, done);
        });

        it("should return invalid_request error", function() {
          assertions.verifyError(this.res, 400, 'invalid_request');
        });
      });

      context('using an invalid client_id', function() {
        before(function(done) {
          sendRequest(this, { client_id: '-|13', response_type: '123' }, done);
        });

        it("should return invalid_request error", function() {
          assertions.verifyError(this.res, 400, 'invalid_request');
        });
      });

      context('using a valid client_id', function() {
        before(function(done) {
          sendRequest(this, { client_id: 3, response_type: '123' }, done);
        });

        it("should return invalid_request error", function() {
          assertions.verifyError(this.res, 400, 'invalid_request');
        });
      });
    });

    context('using a valid response_type', function() {
      context('without providing a client_id', function() {
        before(function(done) {
          sendRequest(this, { client_id: null, response_type: 'device_code' }, done);
        });

        it("should return invalid_request error", function() {
          assertions.verifyError(this.res, 400, 'invalid_request');
        });
      });

      context('using an invalid client_id', function() {
        before(function(done) {
          sendRequest(this, { client_id: '-|13', response_type: 'device_code' }, done);
        });

        it("should return invalid_client error", function() {
          assertions.verifyError(this.res, 400, 'invalid_client');
        });
      });

      context('using a valid client_id', function() {
        before(function(done) {
          sendRequest(this, { client_id: 3, service_provider: 'BBC1', response_type: 'device_code' }, done);
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

          it('should include the device code', function() {
            expect(this.res.body).to.have.property('device_code');
            expect(this.res.body.device_code).to.equal('8ecf4b2a0df2df7fd69df128e0ac4fcc');
          });

          it('should include the user code', function() {
            expect(this.res.body).to.have.property('user_code');
            expect(this.res.body.user_code).to.equal('0a264');
          });

          it('should include the verification uri', function() {
            expect(this.res.body).to.have.property('verification_uri');
            expect(this.res.body.verification_uri).to.equal('http://example.com/verify');
          });

          // TODO: include optional expires_in value?
          it('should include expiry information');
            // expect(this.res.body).to.have.property('expires_in')
            // expect(this.res.body.expires_in).to.equal(3600); // duration in seconds

          // TODO: include optional interval value?
          it('should include minimum polling interval');
            // expect(this.res.body).to.have.property('interval');
            // expect(this.res.body.interval).to.equal(5); // interval in seconds
        });
      });
    });
  });
});
