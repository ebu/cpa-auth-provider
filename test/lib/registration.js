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


      it('should return status 201', function(){
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

describe('GET /register/client_id', function() {
  // Reference : http://tools.ietf.org/html/draft-ietf-oauth-dyn-reg-14#section-5.1

  context("When reading information about a client without access_token and with an invalid client_id", function() {
    it('should reply 401', function(done) {
      request.get('/register/' + invalidClientId).end(function(err, res) {
        if (err) {
          done(err);
        } else {

          expect(res.statusCode).to.equal(401);

          done();
        }
      });
    });
  });


  context("When reading information about a client with an invalid access_token and with an invalid client_id", function() {
    it('replies 401', function(done) {
      request.get('/register/' + invalidClientId).set('Authorization', 'Bearer ' + invalidAccessToken).end(function(err, res) {
        if (err) {
          done(err);
        } else {

          expect(res.statusCode).to.equal(401);

          done();
        }
      });
    });
  });


  context("When reading information about a client with a valid access_token and with an invalid client_id", function() {

    it('replies 401', function(done) {
      request.get('/register/' + invalidClientId).set('Authorization', 'Bearer ' + validAccessToken).end(function(err, res) {
        if (err) {
          done(err);
        } else {

          expect(res.statusCode).to.equal(401);

          done();
        }
      });
    });
  });


  context("When reading information about a client without access_token and with a valid client_id", function() {

    it('replies 401', function(done) {
      request.get('/register/' + validClientId).end(function(err, res) {
        if (err) {
          done(err);
        } else {

          expect(res.statusCode).to.equal(401);
          expect(res.headers['www-authenticate'].indexOf("error=")).to.equal(-1);

          done();
        }

      });
    });
  });


  context("When reading information about a client with a invalid access_token and with a valid client_id", function() {

    it('replies 401', function(done) {
      request.get('/register/' + validClientId).set('Authorization', 'Bearer ' + invalidAccessToken).end(function(err, res) {
        if (err) {
          done(err);
        } else {

          expect(res.statusCode).to.equal(401);
          expect(res.headers['www-authenticate'].indexOf('error="invalid_token"')).to.not.equal(-1);
          done();
        }

      });
    });
  });


  context("When reading information about a client with a valid access_token and with a valid client_id", function() {

    it('replies 200 and the Client Informations', function(done) {
      request.get('/register/' + validClientId).set('Authorization', 'Bearer ' + validAccessToken).end(function(err, res) {
        if (err) {
          done(err);
        } else {

          expect(res.statusCode).to.equal(200);
          expect(res.body).to.have.property('client_id');
          expect(res.body).to.have.property('registration_access_token');
          expect(res.body).to.have.property('registration_client_uri');

          done();
        }

      });
    });
  });

});


describe('GET /register?client_id=#clientId', function() {
  // Reference : http://tools.ietf.org/html/draft-ietf-oauth-dyn-reg-14#section-5.1

  context("When reading information about a client without access_token and with an invalid client_id", function() {
    it('should reply 401', function(done) {
      request.get('/register?client_id=' + invalidClientId).end(function(err, res) {
        if (err) {
          done(err);
        } else {

          expect(res.statusCode).to.equal(401);

          done();
        }
      });
    });
  });


  context("When reading information about a client with an invalid access_token and with an invalid client_id", function() {
    it('replies 401', function(done) {
      request.get('/register?client_id=' + invalidClientId).set('Authorization', 'Bearer ' + invalidAccessToken).end(function(err, res) {
        if (err) {
          done(err);
        } else {

          expect(res.statusCode).to.equal(401);

          done();
        }
      });
    });
  });


  context("When reading information about a client with a valid access_token and with an invalid client_id", function() {

    it('replies 401', function(done) {
      request.get('/register?client_id=' + invalidClientId).set('Authorization', 'Bearer ' + validAccessToken).end(function(err, res) {
        if (err) {
          done(err);
        } else {

          expect(res.statusCode).to.equal(401);

          done();
        }
      });
    });
  });


  context("When reading information about a client without access_token and with a valid client_id", function() {

    it('replies 401', function(done) {
      request.get('/register?client_id=' + validClientId).end(function(err, res) {
        if (err) {
          done(err);
        } else {

          expect(res.statusCode).to.equal(401);
          expect(res.headers['www-authenticate'].indexOf("error=")).to.equal(-1);

          done();
        }

      });
    });
  });


  context("When reading information about a client with a invalid access_token and with a valid client_id", function() {

    it('replies 401', function(done) {
      request.get('/register?client_id=' + validClientId).set('Authorization', 'Bearer ' + invalidAccessToken).end(function(err, res) {
        if (err) {
          done(err);
        } else {

          expect(res.statusCode).to.equal(401);
          expect(res.headers['www-authenticate'].indexOf('error="invalid_token"')).to.not.equal(-1);
          done();
        }

      });
    });
  });


  context("When reading information about a client with a valid access_token and with a valid client_id", function() {

    it('replies 200 and the Client Informations', function(done) {
      request.get('/register?client_id=' + validClientId).set('Authorization', 'Bearer ' + validAccessToken).end(function(err, res) {
        if (err) {
          done(err);
        } else {

          expect(res.statusCode).to.equal(200);
          expect(res.body).to.have.property('client_id');
          expect(res.body).to.have.property('registration_access_token');
          expect(res.body).to.have.property('registration_client_uri');

          done();
        }

      });
    });
  });

});


describe('GET /register', function() {
  // Reference : http://tools.ietf.org/html/draft-ietf-oauth-dyn-reg-14#section-5.1

  context("When reading information about a client without client_id", function() {
    it('should reply 401', function(done) {
      request.get('/register').end(function(err, res) {
        if (err) {
          done(err);
        } else {

          expect(res.statusCode).to.equal(401);

          done();
        }
      });
    });
  });

});


describe('PUT /register', function() {

  context("When updating configuration information about a client", function() {
    it('should reply 501 (Unimplemented)', function(done) {
      request.put('/register').end(function(err, res) {
        if (err) {
          done(err);
        } else {

          expect(res.statusCode).to.equal(501);

          done();
        }
      });
    });
  });

});


describe('DELETE /register', function() {

  context("When deleting configuration information about a client", function() {
    it('should reply 501 (Unimplemented)', function(done) {
      request.del('/register').end(function(err, res) {
        if (err) {
          done(err);
        } else {

          expect(res.statusCode).to.equal(501);

          done();
        }
      });
    });
  });

});