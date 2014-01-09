"use strict";

var generate = require('../../lib/generate');
var requestHelper = require('../request-helper');

// Tests for the End-point implementing the OAuth 2.0 Device Profile
// http://tools.ietf.org/html/draft-recordon-oauth-v2-device-00#page-3


var invalidClientId = '-|13';

describe('POST /token', function() {

  var self = this;
  self.test = {};

  beforeEach(function() {
    sinon.stub(generate, "deviceCode").returns("8ecf4b2a0df2df7fd69df128e0ac4fcc");
    sinon.stub(generate, "userCode").returns("0a264");
  });

  afterEach(function() {
    generate.deviceCode.restore();
    generate.userCode.restore();
  });


  var unsetResponseType = function() { self.test.response_type = null; };
  var setInvalidResponseType = function() { self.test.response_type = '123'; };
  var setValidResponseType = function() { self.test.response_type = 'device_code'; };

  var unsetClientId = function() { self.test.client_id = null; };
  var setInvalidClientId = function() { self.test.client_id = invalidClientId; };
  var setValidClientId = function(done) {
    requestHelper.registerNewClientId(function(err, clientId) {
      if(err || !clientId) {
        done(err);
      } else {
        self.test.client_id = clientId;
        done();
      }
    });
  };

  context('When requesting an authorization', function() {
  // http://tools.ietf.org/html/draft-recordon-oauth-v2-device-00#section-1.4

    beforeEach(function(done) {
      var body = {
        client_id:     self.test.client_id,
        response_type: self.test.response_type
      };

      request
        .post('/token')
        .type('form') // sets Content-Type: application/x-www-form-urlencoded
        .send(body)
        .end(function(err, res) {
          self.err = err;
          self.res = res;
          if (err) {
            done(err);
          } else {
            done();
          }
        });
    });

    context('without response_type', function() {
      //SPEC: Not found in spec http://tools.ietf.org/html/draft-recordon-oauth-v2-device-00#section-1.4

      before(unsetResponseType);

      context('without providing a client_id', function() {
        before(unsetClientId);

        it('should return a status 400', function() {
          expect(self.res.statusCode).to.equal(400);
        });
      });

      context('using an invalid client_id', function() {
        before(setInvalidClientId);

        it('should return a status 400', function() {
          expect(self.res.statusCode).to.equal(400);
        });
      });

      context('using a valid client_id', function() {
        before(setValidClientId);
        it('should return a status 400', function() {
          expect(self.res.statusCode).to.equal(400);
        });
      });
    });

    context('using an invalid response_type', function() {
      before(setInvalidResponseType);

      context('without providing a client_id', function() {
        before(unsetClientId);

        it('should return a status 400', function() {
          expect(self.res.statusCode).to.equal(400);
        });
      });

      context('using an invalid client_id', function() {
        before(setInvalidClientId);

        it('should return a status 400', function() {
          expect(self.res.statusCode).to.equal(400);
        });
      });

      context('using a valid client_id', function() {
        before(setValidClientId);
        it('should return a status 400', function() {
          expect(self.res.statusCode).to.equal(400);
        });
      });
    });

    context('using a valid response_type', function() {
      before(setValidResponseType);

      context('without providing a client_id', function() {
        before(unsetClientId);

        it('should return a status 400', function() {
          expect(self.res.statusCode).to.equal(400);
        });
      });

      context('using an invalid client_id', function() {
        before(setInvalidClientId);

        it('should return a status 400', function() {
          expect(self.res.statusCode).to.equal(400);
        });
      });

      context('using a valid client_id', function() {
        before(setValidClientId);

        it('should return a status 200', function() {
          expect(self.res.statusCode).to.equal(200);
        });

        it('should return JSON', function() {
          expect(self.res.headers['content-type']).to.equal('application/json; charset=utf-8');
        });

        describe('the response body', function() {
          it('should be a JSON object', function() {
            expect(self.res.body).to.be.an('object');
          });

          it('should include the device code', function() {
            expect(self.res.body).to.have.property('device_code');
            expect(self.res.body.device_code).to.equal('8ecf4b2a0df2df7fd69df128e0ac4fcc');
          });

          it('should include the user code', function() {
            expect(self.res.body).to.have.property('user_code');
            expect(self.res.body.user_code).to.equal('0a264');
          });

          it('should include the verification uri', function() {
            expect(self.res.body).to.have.property('verification_uri');
            expect(self.res.body.verification_uri).to.equal('http://example.com/verify');
          });

          // TODO: include optional expires_in value?
          // it('should include expiry information', function() {
          //   expect(res.body).to.have.property('expires_in')
          //   expect(res.body.expires_in).to.equal(3600); // duration in seconds
          // });

          // TODO: include optional interval value?
          // it('should include minimum polling interval', function() {
          //   expect(res.body).to.have.property('interval');
          //   expect(res.body.interval).to.equal(5); // interval in seconds
          // });
        });
      });
    });
  });
});
