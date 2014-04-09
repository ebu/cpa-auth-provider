"use strict";

var cheerio = require('cheerio');

var generate = require('../../lib/generate');
var messages = require('../../lib/messages');
var db       = require('../../models');

var requestHelper = require('../request-helper');

var clearDatabase = function(done) {
  db.sequelize.query('DELETE FROM Clients').then(function() {
    return db.sequelize.query('DELETE FROM PairingCodes');
  })
  .then(function() {
    return db.sequelize.query('DELETE FROM Users');
  })
  .then(function() {
    return db.sequelize.query('DELETE FROM Scopes');
  })
  .then(function() {
    done();
  },
  function(error) {
    done(error);
  });
};

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
        provider_uid: 'testuser',
        password: 'testpassword'
      });
    })
    .then(function() {
      return db.Scope.create({
        id:   5,
        name: 'example-service.bbc.co.uk'
      });
    })
    .then(function() {
      var date = new Date("Wed Apr 09 2014 11:00:00 GMT+0100");

      return db.PairingCode.create({
        client_id:        3,
        scope_id:         5,
        device_code:      'abcd1234',
        user_code:        '1234',
        verification_uri: 'http://example.com',
        verified:         opts.verified,
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
    opts = { verified: false, user_id: null };
  }

  clearDatabase(function(err) {
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
      before(function(done) {
        var self = this;

        request
          .post('/login')
          .type('form')
          .send({ username: 'testuser', password: 'testpassword' })
          .end(function(err, res) {
            self.cookie = res.headers['set-cookie'];
            done(err);
          });
      });

      before(function(done) {
        requestHelper.sendRequest(this, '/verify', { cookie: this.cookie }, done);
      });

      it('should return a status 200', function() {
        expect(this.res.statusCode).to.equal(200);
      });

      it('should return HTML', function() {
        expect(this.res.headers['content-type']).to.equal('text/html; charset=utf-8');
      });

      describe('the response body', function() {
        it('should display an input with name', function() {
          var $ = cheerio.load(this.res.text);
          expect($('input[name="user_code"]').length).to.equal(1);
        });
      });
    });

    context('and the user is not authenticated', function() {
      before(function(done) {
        requestHelper.sendRequest(this, '/verify', null, done);
      });

      it('should reply a status 401', function() {
        expect(this.res.statusCode).to.equal(401);
      });
    });
  });
});

describe('POST /verify', function() {
  before(resetDatabase);

  context('When validating a user_code', function() {
    context('and the user is authenticated', function() {
      before(function(done) {
        var self = this;

        request
          .post('/login')
          .type('form')
          .send({ username: 'testuser', password: 'testpassword' })
          .end(function(err, res) {
            self.cookie = res.headers['set-cookie'];
            done(err);
          });
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
              expect(this.pairingCode.verified).to.equal(true);
            });

            it('should be associated with the correct client', function() {
              expect(this.pairingCode.client_id).to.equal(3);
            });

            it('should be associated with the signed-in user', function() {
              expect(this.pairingCode.user_id).to.equal(4);
            });

            it('should be associated with the correct scope', function() {
              expect(this.pairingCode.scope_id).to.equal(5);
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
          resetDatabase({ verified: true, user_id: 5 }, done);
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
        before(function() {
          // The pairing code should expire one hour it was created
          var time = new Date("Wed Apr 09 2014 12:00:00 GMT+0100").getTime();
          this.clock = sinon.useFakeTimers(time, "Date");
        });

        after(function() {
          this.clock.restore();
        });

        before(resetDatabase);

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
