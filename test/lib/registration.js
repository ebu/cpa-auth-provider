"use strict";


// Test for the dynamic registration end point

var lodash = require('lodash');

var validAccessToken = "";
var validClientId = "";
var invalidClientId = "@&-1";
var invalidAccessToken = "12345";


describe('POST /register', function() {

  var correctRegistrationRequest = {
    client_name: 'Test client',
    software_id: 'CPA AP Test',
    software_version: '0.0.1'
  };

  var self = this;

  context('When registering a client', function() {
    // Reference : http://tools.ietf.org/html/draft-ietf-oauth-dyn-reg-14#section-5.1

    context('while providing a wrong Content-Type', function() {

      before(function(done) {
        request.post('/register')
          .send(JSON.stringify(correctRegistrationRequest))
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

      it('should return status 400', function() {
        expect(self.res.statusCode).to.equal(400);
      });

      it('should respond with JSON', function() {
        expect(self.res.headers['content-type']).to.equal('application/json; charset=utf-8');
      });
    });


    context('when providing a correct request', function() {

      before(function(done) {
        request.post('/register')
          .send(correctRegistrationRequest)
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


      it('should return status 201', function() {
        expect(self.res.statusCode).to.equal(201);
      });

      it('should respond with complete client information', function() {
        expect(self.res.body).to.have.property('client_id');
        expect(self.res.body).to.have.property('registration_access_token');
        expect(self.res.body).to.have.property('registration_client_uri');

        validAccessToken = self.res.body.registration_access_token;
        validClientId = self.res.body.client_id;
      });
    });
  });
});

describe('GET /register with client_id (in path or as GET parameter)', function() {

  //Variable used to pass values between sequential tests.
  var self = this;
  self.test = {};

  //Set of function to define asynchronously variable used in before and beforeEach functions
  var setInvalidAccessToken = function() { self.test.access_token = invalidAccessToken; };
  var setValidAccessToken = function() { self.test.access_token = validAccessToken; };
  var setInvalidClientId = function() { self.test.client_id = invalidClientId; };
  var setValidClientId = function() { self.test.client_id = validClientId; };

  //Test set for requests
  var testRequestWithoutAccessToken = function() {

    context('with an invalid client_id', function() {
      before(setInvalidClientId);

      it('should return status 401', function() {
        expect(self.res.statusCode).to.equal(401);
      });

    });

    context('with a valid client_id', function() {//ok
      before(setValidClientId);

      it('should return status 401', function() {
        expect(self.res.statusCode).to.equal(401);
      });

      it('should not contain an error message in the header', function() {
        expect(self.res.headers['www-authenticate'].indexOf("error=")).to.equal(-1);
      });

    });
  };

  var testRequestWithAccessToken = function() {

    context('with an invalid access_token', function() {

      before(setInvalidAccessToken);

      context('with an invalid client_id', function() {
        before(setInvalidClientId);

        it('should return status 401', function() {
          expect(self.res.statusCode).to.equal(401);
        });
      });

      context('with a valid client_id', function() {
        before(setValidClientId);

        it('should return status 401', function() {
          expect(self.res.statusCode).to.equal(401);
        });

        it('should contain an error message in the header', function() {
          expect(self.res.headers['www-authenticate'].indexOf('error="invalid_token"')).to.not.equal(-1);
        });
      });
    });

    context('with a valid access_token', function() {
      before(setValidAccessToken);

      context('with an invalid client_id', function() {
        before(setInvalidClientId);

        it('should return status 401', function() {
          expect(self.res.statusCode).to.equal(401);
        });

      });

      context('with a valid client_id', function() {
        before(setValidClientId);

        it('should return status 200', function() {
          expect(self.res.statusCode).to.equal(200);
        });

        it('should respond with the client information', function() {
          expect(self.res.body).to.have.property('client_id');
          expect(self.res.body.client_id).to.equal(self.test.client_id);
          expect(self.res.body).to.have.property('registration_access_token');
          expect(self.res.body).to.have.property('registration_client_uri');
        });

      });
    });
  };

  describe('GET /register/:client_id', function() {
    // Reference : http://tools.ietf.org/html/draft-ietf-oauth-dyn-reg-14#section-5.1


    context('When reading information about a client', function() {
      context('without access_token', function() {

        beforeEach(function(done) {
          request
            .get('/register/' + self.test.client_id)
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

        testRequestWithoutAccessToken();
      });

      context('with access_token', function() {
        beforeEach(function(done) {
          request
            .get('/register/' + self.test.client_id)
            .set('Authorization', 'Bearer ' + self.test.access_token)
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

        testRequestWithAccessToken();
      });

    });
  });



  describe('GET /register?client_id=:client_id', function() {
    // Reference : http://tools.ietf.org/html/draft-ietf-oauth-dyn-reg-14#section-5.1


    context('When reading information about a client', function() {
      context('without access_token', function() {

        beforeEach(function(done) {
          request
            .get('/register?client_id=' + self.test.client_id)
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

        testRequestWithoutAccessToken();

      });

      context('with access_token', function() {
        beforeEach(function(done) {
          request
            .get('/register?client_id=' + self.test.client_id)
            .set('Authorization', 'Bearer ' + self.test.access_token)
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

        testRequestWithAccessToken();
      });

    });
  });
});



describe('PUT /register', function() {

  var self = this;

  context("When updating configuration information about a client", function() {

    before(function(done) {
      request
        .put('/register')
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

    it('should reply 501 (Unimplemented)', function() {
      expect(self.res.statusCode).to.equal(501);
    });
  });

});



describe('DELETE /register', function() {

  var self = this;

  context('When deleting configuration information about a client', function() {

    before(function(done) {
      request
        .del('/register')
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

    it('should reply 501 (Unimplemented)', function() {
      expect(self.res.statusCode).to.equal(501);
    });
  });
});
