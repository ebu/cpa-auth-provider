"use strict";


// Tests for the End-point implementing the OAuth 2.0 Device Profile
// http://tools.ietf.org/html/draft-recordon-oauth-v2-device-00#page-3



var correctRegistrationRequest = {
  client_name: 'Test client',
  software_id: 'CPA AP Test',
  software_version: '0.0.1'
};


var getClientId = function(callback) {
  request.post('/register').send(correctRegistrationRequest).end(function(err, res) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, res.body.client_id);
    }
  });
};

var validClientId = '';
var validDeviceCode = '';
var validUserCode = '';
var invalidClientId = '-|13';

describe('POST /token', function() {

  context("When requesting an authorization for a client using an invalid client_id", function() {
    it('should reply an error: 400', function(done) {
      //SPEC: Not found in spec http://tools.ietf.org/html/draft-recordon-oauth-v2-device-00#section-1.4

      var body = 'client_id=' + encodeURIComponent(invalidClientId) + '&response_type=' + encodeURIComponent('device_code');

      request.post('/token').type('application/x-www-form-urlencoded').send(body).end(function(err, res) {
        if (err) {
          done(err);
        } else {
          expect(res.statusCode).to.equal(400);
          done();
        }
      });
    });
  });


  context("When requesting an authorization for a client without client_id", function() {
    it('should reply an error: 400', function(done) {
      //SPEC: Not found in spec http://tools.ietf.org/html/draft-recordon-oauth-v2-device-00#section-1.4

      var body = '&response_type=' + encodeURIComponent('device_code');

      request.post('/token').type('application/x-www-form-urlencoded').send(body).end(function(err, res) {
        if (err) {
          done(err);
        } else {
          expect(res.statusCode).to.equal(400);
          done();
        }
      });
    });
  });


  context("When requesting an authorization for a client without parameters", function() {
    it('should reply an error: 400', function(done) {
      //SPEC: Not found in spec http://tools.ietf.org/html/draft-recordon-oauth-v2-device-00#section-1.4

      request.post('/token').type('application/x-www-form-urlencoded').send('').end(function(err, res) {
        if (err) {
          done(err);
        } else {
          expect(res.statusCode).to.equal(400);
          done();
        }
      });
    });
  });


  context("When requesting an authorization for a client using a valid client_id but without response_type", function() {
    //SPEC: Not found in spec http://tools.ietf.org/html/draft-recordon-oauth-v2-device-00#section-1.4

    it('should reply an error: 400', function(done) {

      getClientId(function(err, clientId) {
        if (err) {
          done(err);
        } else {

          validClientId = clientId;
          var body = 'client_id=' + encodeURIComponent(clientId);

          request.post('/token').type('application/x-www-form-urlencoded').send(body).end(function(err2, res) {
            if (err2) {
              done(err2);
            } else {
              expect(res.statusCode).to.equal(400);

              done();
            }

          });
        }
      });
    });
  });

  context("When requesting an authorization for a client using a valid client_id", function() {
    // http://tools.ietf.org/html/draft-recordon-oauth-v2-device-00#section-1.4

    it('replies 200 with a verification code and an end-user code. (application/json format)', function(done) {

      getClientId(function(err, clientId) {
        if (err) {
          done(err);
        } else {

          validClientId = clientId;
          var body = 'client_id=' + encodeURIComponent(clientId) + '&response_type=' + encodeURIComponent('device_code');

          request.post('/token').type('application/x-www-form-urlencoded').send(body).end(function(err2, res) {
            if (err2) {
              done(err2);
            } else {
              expect(res.statusCode).to.equal(200);
              expect(res.body).to.have.property('device_code');
              expect(res.body).to.have.property('user_code');
              expect(res.body).to.have.property('verification_uri');
    //          expect(res.body).to.have.property('expires_in'); --> optional
    //          expect(res.body).to.have.property('interval'); --> optional

              validDeviceCode = res.body.device_code;
              validUserCode = res.body.user_code;

              done();
            }

          });
        }
      });
    });
  });
});
