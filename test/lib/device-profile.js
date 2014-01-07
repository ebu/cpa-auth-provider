"use strict";


// Tests for the End-point implementing the OAuth 2.0 Device Profile
// http://tools.ietf.org/html/draft-recordon-oauth-v2-device-00#page-3



var correctRegistrationRequest = {
  client_name: 'Test client',
  software_id: 'CPA AP Test',
  software_version: '0.0.1'
};


var buildRequestBody = function(clientId, responseType) {
  var body = '';
  if (clientId) {
    body += 'client_id=' + encodeURIComponent(clientId) + '&';
  }
  if (responseType) {
    body += 'response_type=' + encodeURIComponent(responseType) + '&';
  }
  return body;
};


var validClientId = '';
var validDeviceCode = '';
var validUserCode = '';
var invalidClientId = '-|13';

describe.only('POST /token', function() {

  var self = this;
  self.test = {};

  var getClientId = function(done) {
    request.post('/register').send(correctRegistrationRequest).end(function(err, res) {
      if (err) {
        done(err);
      } else {
        self.test.client_id = res.body.client_id;
        done();
      }
    });
  };

  var setInvalidResponseType = function() { self.test.response_type = '123'; };
  var setValidResponseType = function() { self.test.response_type = 'device_code'; };
  var unsetResponseType = function() { self.test.response_type = null; };

  var setInvalidClientId = function() { self.test.client_id = invalidClientId; };
  var setValidClientId = getClientId;
  var unsetClientId = function() { self.test.client_id = null; };

  context('When requesting an authorization', function() {
  // http://tools.ietf.org/html/draft-recordon-oauth-v2-device-00#section-1.4

    beforeEach(function(done) {
      var body = buildRequestBody(self.test.client_id, self.test.response_type);
      console.log('-->', body);
      request
        .post('/token')
        .type('application/x-www-form-urlencoded')
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

        it('should respond with the correct information', function() {
          expect(self.res.body).to.have.property('device_code');
          expect(self.res.body).to.have.property('user_code');
          expect(self.res.body).to.have.property('verification_uri');
          //          expect(res.body).to.have.property('expires_in'); --> optional
          //          expect(res.body).to.have.property('interval'); --> optional

          validDeviceCode = self.res.body.device_code;
          validUserCode = self.res.body.user_code;
        });

      });
    });
  });
});