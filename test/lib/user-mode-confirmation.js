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
    return db.sequelize.query('DELETE FROM Domains');
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
      return db.Domain.create({
        id:           5,
        name:         'example-service.bbc.co.uk',
        access_token: '70fc2cbe54a749c38da34b6a02e8dfbd'
      });
    })
    .then(function() {
      return db.Domain.create({
        id:           134,
        name:         'example-service2.bbc.co.uk',
        access_token: '70fc2cbe54a749c38da34b6a02e8dabc'
      });
    })
    .then(function() {
      var date = new Date("Wed Apr 09 2014 11:00:00 GMT+0100");

      return db.PairingCode.create({
        id:               12,
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
      var date = new Date("Wed Apr 09 2014 11:00:05 GMT+0100");

      return db.PairingCode.create({
        id:               15,
        client_id:        3,
        domain_id:        134,
        device_code:      '123gdd',
        user_code:        '',
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

var resetDatabase = function(done) {
  clearDatabase(function(err) {
    if (err) {
      done(err);
    }
    else {
      initDatabase({ state: 'pending', user_id: 4 }, done);
    }
  });
};

describe('GET /verify', function() {
  before(resetDatabase);
  context('When requesting the form to validate a domain', function() {
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
        it('should display an input with the pairing codes', function() {
          var $ = cheerio.load(this.res.text);
          expect($('input[name="pairing_code_15"]').length).to.equal(2);
          expect($('input[name="pairing_code_15"]')[0].attribs.value).to.equal('yes');
          expect($('input[name="pairing_code_12"]').length).to.equal(2);
          expect($('input[name="pairing_code_12"]')[0].attribs.value).to.equal('yes');
        });
      });
    });

    context('and the user is not authenticated', function() {
      before(function(done) {
        requestHelper.sendRequest(this, '/verify', null, done);
      });

      it('should redirect to the login page', function() {
        expect(this.res.statusCode).to.equal(302);
        // TODO: check redirect location and page to return to after login
      });
    });
  });
});

describe('POST /verify', function() {
  before(resetDatabase);

  context('When validating a domain', function() {
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

      context('and the user allows the domain', function() {
        before(function() {
          // Ensure pairing code has not expired
          var time = new Date("Wed Apr 09 2014 11:30:10 GMT+0100").getTime();
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
            data:   { pairing_code_12: 'yes' }
          }, done);
        });

        it('should return a status 302 with location /verify', function() {
          expect(this.res.statusCode).to.equal(302);
          expect(this.res.headers.location).to.equal('/verify');
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

          it('should have two pairing codes', function() {
            expect(this.pairingCodes).to.be.an('array');
            expect(this.pairingCodes.length).to.equal(2);
          });

          describe('the first pairing code', function() {
            before(function() {
              this.pairingCode = this.pairingCodes[0];
            });

            it('should be marked as verified', function() {
              expect(this.pairingCode.state).to.equal('verified');
            });

            it('should be associated with the correct client', function() {
              expect(this.pairingCode.client_id).to.equal(3);
            });

            it('should be associated with the signed-in user', function() {
              expect(this.pairingCode.user_id).to.equal(4);
            });

            it('should be associated with the correct domain', function() {
              expect(this.pairingCode.domain_id).to.equal(5);
            });
          });

          describe('the second pairing code', function() {
            before(function() {
              this.pairingCode = this.pairingCodes[1];
            });

            it('should still be pending', function() {
              expect(this.pairingCode.state).to.equal('pending');
            });

            it('should be associated with the correct client', function() {
              expect(this.pairingCode.client_id).to.equal(3);
            });

            it('should be associated with the signed-in user', function() {
              expect(this.pairingCode.user_id).to.equal(4);
            });

            it('should be associated with the correct domain', function() {
              expect(this.pairingCode.domain_id).to.equal(134);
            });
          });
        });
      });

      //TODO : context('with an expired user_code')

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
