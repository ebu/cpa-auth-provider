"use strict";

var generate = require('../../lib/generate');
var messages = require('../../lib/messages');
var db       = require('../../models');

var requestHelper = require('../request-helper');
var dbHelper      = require('../db-helper');

var initDatabase = function(opts, done) {
  db.User
    .create({
      id:           3,
      provider_uid: 'testuser',
      display_name: 'Test User'
    })
    .then(function(user) {
      return user.setPassword('testpassword');
    })    
    .then(function() {
      return db.Client.create({
        id:               100,
        secret:           'e2412cd1-f010-4514-acab-c8af59e5501a',
        name:             'Test client 1',
        software_id:      'CPA AP Test',
        software_version: '0.0.1',
        ip:               '127.0.0.1',
        user_id:          3
      });
    })
    .then(function() {
      return db.Client.create({
        id:               101,
        secret:           '751ae023-7dc0-4650-b0ff-e48ea627d6b2',
        name:             'Test client 2',
        software_id:      'CPA AP Test',
        software_version: '0.0.1',
        ip:               '127.0.0.1',
        user_id:          3
      });
    })
    .then(function() {
      return db.Client.create({
        id:               102,
        secret:           '21cced5a-3574-444c-98e9-5f1ba06995da',
        name:             'Test client 3',
        software_id:      'CPA AP Test',
        software_version: '0.0.1',
        ip:               '127.0.0.1',
        user_id:          3
      });
    })
    .then(function() {
      return db.Client.create({
        id:               103,
        secret:           '21cced5a-3574-444c-98e9-5f1ba06995da',
        name:             'Test client 3',
        software_id:      'CPA AP Test',
        software_version: '0.0.1',
        ip:               '127.0.0.1',
        user_id:          2
      });
    })
    .then(function() {
      return db.Domain.create({
        id:           1,
        display_name: 'Example',
        name:         'example-service.ebu.io',
        access_token: '70fc2cbe54a749c38da34b6a02e8dfbd'
      });
    })
    .then(function() {
      return db.Domain.create({
        id:           2,
        display_name: 'Another Example',
        name:         'another-example-service.com',
        access_token: '831ba433eeaf49dabc5c3089b306d10f'
      });
    })
    .then(function() {
      return db.AccessToken.create({
        id:        1000,
        token:     '4afebe6ef96a946b6993ffffe39702b0',
        domain_id: 2,
        client_id: 100
      });
    })
    .then(function() {
      return db.AccessToken.create({
        id:        1001,
        token:     'aed201ffb3362de42700a293bdebf694',
        domain_id: 1,
        client_id: 101,
        user_id:   3
      });
    })
    .then(function() {
      return db.AccessToken.create({
        id:        1002,
        token:     'af03736940844fccb0147f12a9d188fb',
        domain_id: 1,
        client_id: 102
      });
    })
    .then(function() {
      return db.AccessToken.create({
        id:        1003,
        token:     '8a7be6ef96a946b6993b1c79a39702b0',
        domain_id: 1,
        client_id: 5
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

describe('GET /user/devices', function() {
  context('When requesting the list of devices', function() {
    context('and the user is authenticated', function() {
      before(resetDatabase);
      before(function(done) {
        requestHelper.login(this, done);
      });

      before(function(done) {
        requestHelper.sendRequest(this, '/user/devices', {
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
        it('should display a title containing the number of devices', function() {
          expect(this.$('h1').length).to.equal(1);
          expect(this.$('h1').text()).to.equal('Devices (' + 3 + ')');
        });

        it('should contain a table with 3 elements (+ header)', function() {
          expect(this.$('tr').length).to.equal(4);
        });

        describe('the devices in the table', function() {
          it('should have the correct id numbers', function() {
            expect(this.$('tr').eq(1).children('td').eq(0).text()).to.equal('100');
            expect(this.$('tr').eq(2).children('td').eq(0).text()).to.equal('101');
            expect(this.$('tr').eq(3).children('td').eq(0).text()).to.equal('102');
          });

          it('should have the correct names', function() {
            expect(this.$('tr').eq(1).children('td').eq(1).text()).to.equal('Test client 1');
            expect(this.$('tr').eq(2).children('td').eq(1).text()).to.equal('Test client 2');
            expect(this.$('tr').eq(3).children('td').eq(1).text()).to.equal('Test client 3');
          });

          it('should belong to the correct user', function() {
            expect(this.$('tr').eq(1).children('td').eq(2).text()).to.equal('Test User');
            expect(this.$('tr').eq(2).children('td').eq(2).text()).to.equal('Test User');
            expect(this.$('tr').eq(3).children('td').eq(2).text()).to.equal('Test User');
          });

          it('should be authorized on the correct domain', function() {
            expect(this.$('tr').eq(1).children('td').eq(3).text()).to.contain('another-example-service.com');
            expect(this.$('tr').eq(2).children('td').eq(3).text()).to.contain('example-service.ebu.io');
            expect(this.$('tr').eq(3).children('td').eq(3).text()).to.contain('example-service.ebu.io');
          });
        });
      });
    });

    context('and the user is not authenticated', function() {
      before(function(done) {
        requestHelper.sendRequest(this, '/user/devices', null, done);
      });

      it('should deny access', function() {
        expect(this.res.statusCode).to.equal(401);
      });
    });
  });
});

describe('DELETE /user/client/:id', function() {
  context('When revoking a client', function() {
    context('and the user is authenticated', function() {
      before(resetDatabase);

      before(function(done) {
        requestHelper.login(this, done);
      });

      context('using a valid client id', function() {
        context('and the user is the owner of the client', function() {

          before(function(done) {
            requestHelper.sendRequest(this, '/user/client/102', {
              method: 'delete',
              cookie: this.cookie,
            }, done);
          });

          it('should return a status 200', function() {
            expect(this.res.statusCode).to.equal(200);
          });

          describe('the database', function() {
            before(function(done) {
              var self = this;

              db.Client.findAll()
                .success(function(clients) {
                  self.clients = clients;

                  db.AccessToken.findAll()
                    .success(function(accessTokens) {
                      self.accessTokens = accessTokens;

                      done();
                    })
                    .error(function(error) {
                      done(error);
                    });
                })
                .error(function(error) {
                  done(error);
                });
            });

            it('should have three clients', function() {
              expect(this.clients).to.be.an('array');
              expect(this.clients.length).to.equal(3);
            });

            it('should have three access tokens', function() {
              expect(this.accessTokens).to.be.an('array');
              expect(this.accessTokens.length).to.equal(3);
            });
          });
        });

        context('and the user is not the owner of the token', function() {
          before(resetDatabase);

          before(function(done) {
            requestHelper.sendRequest(this, '/user/client/103', {
              method: 'delete',
              cookie: this.cookie,
            }, done);
          });

          it('should return a status 404', function() {
            expect(this.res.statusCode).to.equal(404);
          });
        });
      });

      context('using a invalid client id', function() {
        before(resetDatabase);

        before(function(done) {
          requestHelper.sendRequest(this, '/user/client/1203214', {
            method: 'delete',
            cookie: this.cookie,
          }, done);
        });

        it('should return a status 404', function() {
          expect(this.res.statusCode).to.equal(404);
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
