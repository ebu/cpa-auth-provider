"use strict";

var generate = require('../../lib/generate');
var messages = require('../../lib/messages');
var requestHelper = require('../request-helper');

describe('GET /verify', function() {

  var self = this;


  context('When requesting the form to validate a user code', function() {
    context('and the user is not authenticated', function() {

      before(function(done) {
        requestHelper.get(self, '/verify', false, done);
      });

      it('should reply a status 401', function() {
        expect(self.res.statusCode).to.equal(401);
      });

    });

    context('and the user is authenticated', function() {
      before(function(done) {
        requestHelper.get(self, '/verify', true, done);
      });

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
});


describe('POST /verify', function() {

  var self = this;
  var invalidUserCode = '1234';
  var validUserCode = null;
  var setValidUserCode = function(done) {
    requestHelper.requestNewUserCode(function(err, userCode) {
      if(err || !userCode) {
        done(err);
      } else {
        validUserCode = userCode;
        done();
      }
    });
  };
  before(setValidUserCode);

  context('When validating a user_code', function() {
    context('and the user is not authenticated', function() {
      before(function(done) {
        requestHelper.postForm(self, '/verify', {user_code: null}, false, done);
      });

      it('should return a status 401', function() {
        expect(self.res.statusCode).to.equal(401);
      });
    });

    context('and the user is authenticated', function() {
      context('without providing a user_code', function() {
        before(function(done) {
          requestHelper.postForm(self, '/verify', {user_code: null}, true, done);
        });


        it('should return a status 400', function() {
          expect(self.res.statusCode).to.equal(400);
        });
      });

      context('using an invalid user_code', function() {
        before(function(done) {
          requestHelper.postForm(self, '/verify', {user_code: invalidUserCode}, true, done);
        });

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
        before(function(done) {
          requestHelper.postForm(self, '/verify', {user_code: validUserCode}, true, done);
        });

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
        before(function(done) {
          requestHelper.postForm(self, '/verify', {user_code: validUserCode}, true, done);
        });


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
});
