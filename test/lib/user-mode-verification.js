"use strict";

var generate = require('../../lib/generate');
var messages = require('../../lib/messages');
var db       = require('../../models');

var requestHelper = require('../request-helper');
var dbHelper      = require('../db-helper');

var initDatabase = function(opts, done) {
  db.Client
    .create({
      id:               3,
      secret:           'a0fe0231-0220-4d45-8431-1fd374998d78',
      name:             'Test client',
      software_id:      'CPA AP Test',
      software_version: '0.0.1',
      ip:               '127.0.0.1'
    })
    .then(function() {
      return db.User.create({
        id:           4,
        provider_uid: 'https://facebook.com/user',
        enable_sso:   true
      });
    })
    .then(function() {
      return db.User.create({
        id:           5,
        provider_uid: 'testuser',
        password:     'testpassword'
      });
    })
    .then(function() {
      return db.Domain.create({
        id:           5,
        name:         'example-service.bbc.co.uk',
        access_token: '70fc2cbe54a749c38da34b6a02e8dfbd'
      });
    })
    .then(function() {
      var date = new Date("Wed Apr 09 2014 11:00:00 GMT+0100");

      return db.PairingCode.create({
        client_id:        3,
        domain_id:        5,
        device_code:      'abcd1234',
        user_code:        '1234',
        verification_uri: 'http://example.com',
        state:            opts.state,
        user_id:          opts.user_id,
        created_at:       date,
        updated_at:       date
      });
    })
    .then(function() {
      done();
    },
    function(error) {
      done(new Error(JSON.stringify(error)));
    });
};

var resetDatabase = function(opts, done) {
  if (!done) {
    done = opts;
    opts = { state: 'pending', user_id: null };
  }

  dbHelper.clearDatabase(function(err) {
    if (err) {
      done(err);
    }
    else {
      initDatabase(opts, done);
    }
  });
};

describe('GET /verify', function() {
  context('When requesting the form to validate a user code', function() {
    context('and the user is authenticated', function() {
      before(resetDatabase);
      before(function(done) {
        requestHelper.login(this, done);
      });

      before(function(done) {
        requestHelper.sendRequest(this, '/verify', {
          cookie:   this.cookie,
          parseDOM: true
        }, done);
      });

      it('should return a status 200', function() {
        expect(this.res.statusCode).to.equal(200);
      });

      it('should return HTML', function() {
        expect(this.res.headers['content-type']).to.equal('text/html; charset=utf-8');
      });

      describe('the response body', function() {
        it('should display an input with name', function() {
          expect(this.$('input[name="user_code"]').length).to.equal(1);
        });
      });
    });

    context('and the user is not authenticated', function() {
      before(function(done) {
        requestHelper.sendRequest(this, '/verify', null, done);
      });

      it('should redirect to the login page', function() {
        var urlPrefix = requestHelper.urlPrefix;
        expect(this.res.statusCode).to.equal(302);
        expect(this.res.headers.location).to.equal(urlPrefix + "/auth");
        // TODO: check redirect location and page to return to after login
      });
    });
  });
});

describe('POST /verify', function() {
  before(function() {
    var time = new Date("Wed Apr 09 2014 11:00:00 GMT+0100").getTime();
    this.clock = sinon.useFakeTimers(time, "Date");
  });

  after(function() {
    this.clock.restore();
  });

  before(resetDatabase);

  context('When validating a user_code', function() {
    context('and the user is authenticated', function() {
      before(function(done) {
        requestHelper.login(this, done);
      });

      context('using a valid user_code', function() {
        before(function() {
          // Ensure pairing code has not expired
          var time = new Date("Wed Apr 09 2014 11:30:00 GMT+0100").getTime();
          this.clock = sinon.useFakeTimers(time, "Date");
        });

        after(function() {
          this.clock.restore();
        });

        before(function(done) {
          requestHelper.sendRequest(this, '/verify', {
            method: 'post',
            cookie: this.cookie,
            type:   'form',
            data:   { user_code: '1234' }
          }, done);
        });

        it('should return a status 200', function() {
          expect(this.res.statusCode).to.equal(200);
        });

        it('should return HTML', function() {
          expect(this.res.headers['content-type']).to.equal('text/html; charset=utf-8');
        });

        describe('the response body', function() {
          it('should contain the message SUCCESSFUL_PAIRING: ' + messages.SUCCESSFUL_PAIRING, function() {
            expect(this.res.text).to.contain(messages.SUCCESSFUL_PAIRING);
          });
        });

        describe('the database', function() {
          before(function(done) {
            var self = this;

            db.PairingCode.findAll()
              .success(function(pairingCodes) {
                self.pairingCodes = pairingCodes;
                done();
              })
              .error(function(error) {
                done(error);
              });
          });

          it('should have one pairing code', function() {
            expect(this.pairingCodes).to.be.an('array');
            expect(this.pairingCodes.length).to.equal(1);
          });

          describe('the pairing code', function() {
            before(function() {
              this.pairingCode = this.pairingCodes[0];
            });

            it('should contain the correct user code', function() {
              expect(this.pairingCode.user_code).to.equal('1234');
            });

            it('should be marked as verified', function() {
              expect(this.pairingCode.state).to.equal('verified');
            });

            it('should be associated with the correct client', function() {
              expect(this.pairingCode.client_id).to.equal(3);
            });

            it('should be associated with the signed-in user', function() {
              expect(this.pairingCode.user_id).to.equal(5);
            });

            it('should be associated with the correct domain', function() {
              expect(this.pairingCode.domain_id).to.equal(5);
            });
          });
        });
      });

      context('with a missing user_code', function() {
        before(resetDatabase);

        before(function(done) {
          requestHelper.sendRequest(this, '/verify', {
            method: 'post',
            cookie: this.cookie,
            type:   'form',
            data:   {}
          }, done);
        });

        it('should return a status 400', function() {
          expect(this.res.statusCode).to.equal(400);
        });
      });

      context('with an invalid user_code', function() {
        before(resetDatabase);

        before(function(done) {
          requestHelper.sendRequest(this, '/verify', {
            method: 'post',
            cookie: this.cookie,
            type:   'form',
            data:   { user_code: '5678' }
          }, done);
        });

        it('should return a status 400', function() {
          expect(this.res.statusCode).to.equal(400);
        });

        it('should return HTML', function() {
          expect(this.res.headers['content-type']).to.equal('text/html; charset=utf-8');
        });

        describe('the response body', function() {
          it('should contain the error message INVALID_USERCODE: ' + messages.INVALID_USERCODE, function() {
            expect(this.res.text).to.contain(messages.INVALID_USERCODE);
          });
        });
      });

      context('with an already verified user_code', function() {
        before(function(done) {
          resetDatabase({ state: 'verified', user_id: 5 }, done);
        });

        before(function(done) {
          requestHelper.sendRequest(this, '/verify', {
            method: 'post',
            cookie: this.cookie,
            type:   'form',
            data:   { user_code: '1234' }
          }, done);
        });

        it('should return a status 400', function() {
          expect(this.res.statusCode).to.equal(400);
        });

        it('should return HTML', function() {
          expect(this.res.headers['content-type']).to.equal('text/html; charset=utf-8');
        });

        describe('the response body', function() {
          it('should contain the message OBSOLETE_USERCODE: ' + messages.OBSOLETE_USERCODE, function() {
            expect(this.res.text).to.contain(messages.OBSOLETE_USERCODE);
          });
        });
      });

      context('with an expired user_code', function() {
        before(function(done) {
          var self = this;

          // Set creation time of the pairing code
          var time = new Date("Wed Apr 09 2014 11:00:00 GMT+0100").getTime();
          this.clock = sinon.useFakeTimers(time, "Date");

          resetDatabase(function() {
            self.clock.restore();
            // The pairing code should expire one hour after it was created
            var time = new Date("Wed Apr 09 2014 12:00:00 GMT+0100").getTime();
            self.clock = sinon.useFakeTimers(time, "Date");

            done();
          });
        });

        after(function() {
          this.clock.restore();
        });

        before(function(done) {
          requestHelper.sendRequest(this, '/verify', {
            method: 'post',
            cookie: this.cookie,
            type:   'form',
            data:   { user_code: '1234' }
          }, done);
        });

        it('should return a status 400', function() {
          expect(this.res.statusCode).to.equal(400);
        });

        it('should return HTML', function() {
          expect(this.res.headers['content-type']).to.equal('text/html; charset=utf-8');
        });

        describe('the response body', function() {
          it('should contain the message EXPIRED_USERCODE: ' + messages.EXPIRED_USERCODE, function() {
            expect(this.res.text).to.contain(messages.EXPIRED_USERCODE);
          });
        });
      });
    });

    context('and the user is not authenticated', function() {
      before(resetDatabase);

      before(function(done) {
        requestHelper.sendRequest(this, '/verify', {
          method: 'post',
          type:   'form',
          data:   { user_code: '1234' }
        }, done);
      });

      it('should return a status 401', function() {
        expect(this.res.statusCode).to.equal(401);
      });
    });
  });
});
