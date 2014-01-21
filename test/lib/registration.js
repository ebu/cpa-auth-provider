"use strict";

// Test for the dynamic registration end point

var lodash = require('lodash');
var requestHelper = require('../request-helper');

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

  context('When registering a client', function() {
    // Reference : http://tools.ietf.org/html/draft-ietf-oauth-dyn-reg-14#section-5.1

    context('while providing a wrong Content-Type', function() {
      before(function(done) {
        requestHelper.postForm(this, '/register', JSON.stringify(correctRegistrationRequest), false, done);
      });

      it('should return status 400', function() {
        expect(this.res.statusCode).to.equal(400);
      });
    });

    context('when providing a correct request', function() {
      before(function(done) {
        requestHelper.postJSON(this, '/register', correctRegistrationRequest, false, done);
      });

      it('should return status 201', function() {
        expect(this.res.statusCode).to.equal(201);
      });

      it('should respond with complete client information', function() {
        expect(this.res.body).to.have.property('client_id');
        expect(this.res.body).to.have.property('registration_access_token');
        expect(this.res.body).to.have.property('registration_client_uri');

        validAccessToken = this.res.body.registration_access_token;
        validClientId = this.res.body.client_id;
      });
    });
  });
});

describe('GET /register with client_id (in path or as GET parameter)', function() {

  // Variable used to pass values between sequential tests.
  var self = this;

  var sendReadRequest = function(params, done) {
      var req_url = (params.type !== 'GET')? '/register/' + params.client_id : '/register?client_id=' + params.client_id;

      if(params.authorization) {
        requestHelper.getWithOptions(self, req_url, {'authorization': params.authorization}, done);
      } else {
        requestHelper.get(self, req_url, false, done);
      }
  };

  var runRegistrationReadTest = function(label, sendRequest) {

    describe('GET ' + label, function() {
      // Reference : http://tools.ietf.org/html/draft-ietf-oauth-dyn-reg-14#section-5.1

      context('When reading information about a client', function() {
        context('without access_token', function() {
          context('with an invalid client_id', function() {
            before(function(done){
              sendRequest({'authorization': null, 'client_id': invalidClientId}, done);
            });

            it('should return status 401', function() {
              expect(self.res.statusCode).to.equal(401);
            });

          });

          context('with a valid client_id', function() {
            before(function(done){
              sendRequest({'authorization': null, 'client_id': validClientId}, done);
            });

            it('should return status 401', function() {
              expect(self.res.statusCode).to.equal(401);
            });

            it('should not contain an error message in the header', function() {
              expect(self.res.headers['www-authenticate'].indexOf("error=")).to.equal(-1);
            });

          });

        });
      });


      context('with an invalid access_token', function() {
        context('with an invalid client_id', function() {
          before(function(done){
            sendRequest({'authorization': invalidAccessToken, 'client_id': invalidClientId}, done);
          });


          it('should return status 401', function() {
            expect(self.res.statusCode).to.equal(401);
          });
        });

        context('with a valid client_id', function() {
          before(function(done){
            sendRequest({'authorization': invalidAccessToken, 'client_id': validClientId}, done);
          });

          it('should return status 401', function() {
            expect(self.res.statusCode).to.equal(401);
          });

          it('should contain an error message in the header', function() {
            expect(self.res.headers['www-authenticate'].indexOf('error="invalid_token"')).to.not.equal(-1);
          });
        });
      });

      context('with a valid access_token', function() {

        context('with an invalid client_id', function() {
          before(function(done){
            sendRequest({'authorization': validAccessToken, 'client_id': invalidClientId}, done);
          });

          it('should return status 401', function() {
            expect(self.res.statusCode).to.equal(401);
          });

        });

        context('with a valid client_id', function() {
          before(function(done){
            sendRequest({'authorization': validAccessToken, 'client_id': validClientId}, done);
          });

          it('should return status 200', function() {
            expect(self.res.statusCode).to.equal(200);
          });

          it('should respond with the client information', function() {
            expect(self.res.body).to.have.property('client_id');
            expect(self.res.body.client_id).to.equal(validClientId);
            expect(self.res.body).to.have.property('registration_access_token');
            expect(self.res.body).to.have.property('registration_client_uri');
          });

        });
      });

    });
  };

  //URI parameters
  runRegistrationReadTest('/register/:client_id', sendReadRequest);
  //GET parameters
  runRegistrationReadTest('/register?client_id=:client_id', function(params, done) {
      sendReadRequest(lodash.extend(params, {type:'GET'}), done);
    });
});

describe('PUT /register', function() {
  context("When updating configuration information about a client", function() {
    before(function(done) {
      requestHelper.sendPutRequest(this, '/register', done);
    });

    it('should reply 501 (Unimplemented)', function() {
      expect(this.res.statusCode).to.equal(501);
    });
  });
});

describe('DELETE /register', function() {
  context('When deleting configuration information about a client', function() {
    before(function(done) {
      requestHelper.sendDeleteRequest(this, '/register', done);
    });

    it('should reply 501 (Unimplemented)', function() {
      expect(this.res.statusCode).to.equal(501);
    });
  });
});
