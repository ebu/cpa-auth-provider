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
    return db.sequelize.query('DELETE FROM ServiceProviders');
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
      secret:           'secret',
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
      return db.ServiceProvider.create({
        id:   5,
        name: 'Example Service Provider'
      });
    })
    .then(function() {
      return db.PairingCode.create({
        client_id:           3,
        service_provider_id: 5,
        device_code:         'abcd1234',
        user_code:           '1234',
        verification_uri:    'http://example.com',
        verified:            opts.verified,
        user_id:             opts.user_id
      });
    })
    .then(function() {
      done();
    },
    function(err) {
      done(err);
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
    context('and the user is not authenticated', function() {
      before(function(done) {
        requestHelper.get(this, '/verify', false, done);
      });

      it('should reply a status 401', function() {
        expect(this.res.statusCode).to.equal(401);
      });
    });

    context('and the user is authenticated', function() {
      before(function(done) {
        requestHelper.get(this, '/verify', true, done);
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
  });
});

describe('POST /verify', function() {
  context('When validating a user_code', function() {
    context('and the user is not authenticated', function() {
      before(resetDatabase);

      before(function(done) {
        requestHelper.postForm(this, '/verify', { user_code: '1234' }, false, done);
      });

      it('should return a status 401', function() {
        expect(this.res.statusCode).to.equal(401);
      });
    });

    context('and the user is authenticated', function() {
      context('without providing a user_code', function() {
        before(resetDatabase);

        before(function(done) {
          requestHelper.postForm(this, '/verify', { user_code: null }, true, done);
        });

        it('should return a status 400', function() {
          expect(this.res.statusCode).to.equal(400);
        });
      });

      context('using an invalid user_code', function() {
        before(resetDatabase);

        before(function(done) {
          requestHelper.postForm(this, '/verify', { user_code: '5678' }, true, done);
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

      context('using a valid user_code', function() {
        before(resetDatabase);

        before(function(done) {
          requestHelper.postForm(this, '/verify', { user_code: '1234' }, true, done);
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

            it('should be associated with the service provider', function() {
              expect(this.pairingCode.service_provider_id).to.equal(5);
            });
          });
        });
      });

      context('using an already verified user_code', function() {
        before(function(done) {
          resetDatabase({ verified: true, user_id: 5 }, done);
        });

        before(function(done) {
          requestHelper.postForm(this, '/verify', { user_code: '1234' }, true, done);
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
    });
  });
});
