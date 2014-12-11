"use strict";

var generate = require('../../lib/generate');
var messages = require('../../lib/messages');
var db       = require('../../models');

var requestHelper = require('../request-helper');
var dbHelper      = require('../db-helper');

var initDatabase = function(opts, done) {
  db.Client
    .create({
      id:               100,
      secret:           'e2412cd1-f010-4514-acab-c8af59e5501a',
      name:             'Test client 1',
      software_id:      'CPA AP Test',
      software_version: '0.0.1',
      ip:               '127.0.0.1'
    })
    .then(function() {
      return db.Client.create({
        id:               101,
        secret:           '751ae023-7dc0-4650-b0ff-e48ea627d6b2',
        name:             'Test client 2',
        software_id:      'CPA AP Test',
        software_version: '0.0.1',
        ip:               '127.0.0.1'
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
      return db.User.create({
        id:           3,
        provider_uid: 'testuser',
        display_name: 'Test User',
        password:     'testpassword'
      });
    })
    .then(function() {
      var date = new Date("Wed Apr 09 2014 11:00:00 GMT+0100");

      return db.PairingCode.create({
        id:               50,
        client_id:        100,
        domain_id:        5,
        device_code:      '65ec63a2-df53-4ceb-a938-f94e43b16a5e',
        user_code:        '1234',
        verification_uri: 'http://example.com',
        state:            'pending', // authorization_pending
        created_at:       date,
        updated_at:       date
      });
    })
    .then(function() {
      var date = new Date("Wed Apr 09 2014 11:00:00 GMT+0100");

      return db.PairingCode.create({
        id:               51,
        client_id:        101,
        domain_id:        5,
        device_code:      'c691343f-0ac0-467d-8659-5041cfc3dc4a',
        user_code:        '5678',
        verification_uri: 'http://example.com',
        state:            'verified',
        user_id:          3,
        created_at:       date,
        updated_at:       date
      });
    })
    .then(function() {
      var date = new Date("Wed Apr 09 2014 11:00:00 GMT+0100");

      return db.PairingCode.create({
        id:               52,
        client_id:        102,
        domain_id:        5,
        device_code:      '320b4ce5-24cd-4e8e-a845-3ee0e5cc927b',
        user_code:        'RYBkEpqE',
        verification_uri: 'http://example.com',
        state:            'pending',
        user_id:          3,
        created_at:       date,
        updated_at:       date
      });
    })
    .then(function() {
      var date = new Date("Wed Apr 09 2014 11:00:00 GMT+0100");

      return db.PairingCode.create({
        id:               53,
        client_id:        101,
        domain_id:        5,
        device_code:      '3860fa73-f98f-4c99-a34c-29e0b5c79b84',
        user_code:        'dfydN789',
        verification_uri: 'http://example.com',
        state:            'denied',
        user_id:          3,
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

describe('GET /user/devices', function() {
  context('When requesting the list of devices', function() {
    context('and the user is authenticated', function() {
      before(resetDatabase);
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
          expect(this.$('h1').text()).to.equal('Devices (' + 3 + ')')
        });

        it('should contain a table with 3 elements (+ header)', function() {
          expect(this.$('tr').length).to.equal(4);
        });

        describe('the second device in the table', function() {
          it('should have the correct id number', function() {
            expect(this.$('tr').eq(2).children('td').eq(0).text()).to.equal('101');
          });

          it('should have the correct name', function() {
            expect(this.$('tr').eq(2).children('td').eq(1).text()).to.equal('Test client 2');
          });

          it('should belong to the correct user', function() {
            expect(this.$('tr').eq(2).children('td').eq(2).text()).to.equal('Test User');
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

