"use strict";

var generate = require('../../lib/generate');
var messages = require('../../lib/messages');
var requestHelper = require('../request-helper');

describe('GET /verify', function() {

  var self = this;

  beforeEach(function(done) {
    request
      .get('/verify')
      .end(function(err, res) {
        self.err = err;
        self.res = res;
        done(err);
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
  self.test.client_id = '';

  var unsetUserCode = function() { self.test.user_code = null; };
  var setInvalidUserCode = function() { self.test.user_code = '1234'; };
  var setValidUserCode = function(done) {
    requestHelper.requestNewUserCode(function(err, userCode) {
      if(err || !userCode) {
        done(err);
      } else {
        self.test.user_code = userCode;
        done();
      }
    });
  };


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
        done(err);
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

      describe('the database', function() {
        it('should associate the pairing code with the signed-in user');
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
