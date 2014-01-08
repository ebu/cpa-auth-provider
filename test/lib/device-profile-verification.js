"use strict";

var generate = require('../../lib/generate');
var messages = require('../../lib/messages');

describe('GET /verify', function() {

  var self = this;

  beforeEach(function(done) {
    request
      .get('/verify')
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

  context('When requesting the form to validate a user code', function() {

    it('should return a status 200', function() {
      expect(self.res.statusCode).to.equal(200);
    });

    it('should return HTML', function() {
      expect(self.res.headers['content-type']).to.equal('text/html; charset=utf-8');
    });

    describe('the response body', function() {
      it('should display an input with name', function() {
        var $ = cheerio.load(self.res.text);
        expect($('input[name="user_code"]').length).to.equal(1);
      });
    });

  });
});


describe('POST /verify', function() {

  var self = this;
  self.test = {};
  self.test.user_code = '';

  var getClientId = function(done) {

    var registrationRequest = {
      client_name: 'Test client',
      software_id: 'CPA AP Test',
      software_version: '0.0.1'
    };

    request.post('/register').send(registrationRequest).end(function(err, res) {
      if (err) {
        done(err);
      } else {
        self.test.client_id = res.body.client_id;
        done();
      }
    });
  };

  var getUserCode = function(done) {
    getClientId(function(err) {
      if (err) {
        done(err);
      } else {
        var body = {
          client_id:     self.test.client_id,
          response_type: 'device_code'
        };

        request
          .post('/token')
          .type('form')
          .send(body)
          .end(function(err2, res) {
            if (err2) {
              done(err2);
            } else {
              self.test.user_code = res.body.user_code;
              done();
            }
          });
      }
    });
  };

  var setInvalidUserCode = function() { self.test.user_code = '1234'; };
  var setValidUserCode = getUserCode;
  var unsetUserCode = function() { self.test.user_code = null; };


  var validateRequest = function(done) {
    var body = {
      user_code: self.test.user_code
    };

    request
      .post('/verify')
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
  };

  context('When validating a user_code', function() {


    context('without providing a user_code', function() {
      before(unsetUserCode);
      beforeEach(validateRequest);

      it('should return a status 404', function() {
        expect(self.res.statusCode).to.equal(400);
      });

    });


    context('using an invalid user_code', function() {
      before(setInvalidUserCode);
      beforeEach(validateRequest);

      it('should return a status 400', function() {
        expect(self.res.statusCode).to.equal(400);
      });

      it('should return HTML', function() {
        expect(self.res.headers['content-type']).to.equal('text/html; charset=utf-8');
      });

      describe('the response body', function() {
        it('should contain the error message INVALID_USERCODE: ' + messages.INVALID_USERCODE, function() {
          expect(self.res.text).to.contain(messages.INVALID_USERCODE);
        });
      });

    });


    context('using a valid user_code', function() {
      beforeEach(setValidUserCode);
      beforeEach(validateRequest);


      it('should return a status 200', function() {
        expect(self.res.statusCode).to.equal(200);
      });

      it('should return HTML', function() {
        expect(self.res.headers['content-type']).to.equal('text/html; charset=utf-8');
      });


      describe('the response body', function() {
        it('should contain the message SUCCESSFUL_PAIRING: ' + messages.SUCCESSFUL_PAIRING, function() {
          expect(self.res.text).to.contain(messages.SUCCESSFUL_PAIRING);
        });
      });
    });



    context('using an already verified user_code', function() {
      //using the previous user code
      beforeEach(validateRequest);

      it('should return a status 400', function() {
        expect(self.res.statusCode).to.equal(400);
      });

      it('should return HTML', function() {
        expect(self.res.headers['content-type']).to.equal('text/html; charset=utf-8');
      });


      describe('the response body', function() {
        it('should contain the message OBSOLETE_USERCODE: ' + messages.OBSOLETE_USERCODE, function() {
          expect(self.res.text).to.contain(messages.OBSOLETE_USERCODE);
        });
      });
    });

  });
});