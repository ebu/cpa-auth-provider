"use strict";

var db       = require('../../models');
var generate = require('../../lib/generate');

var assertions    = require('../assertions');
var requestHelper = require('../request-helper');

var cheerio = require('cheerio');

var clearDatabase = function(done) {
  db.sequelize.query('DELETE FROM Scopes').then(function() {
    return db.sequelize.query('DELETE FROM Clients');
  })
  .then(function() {
    return db.sequelize.query('DELETE FROM AccessTokens');
  })
  .then(function() {
    done();
  },
  function(error) {
    done(new Error(JSON.stringify(error)));
  });
};

var initDatabase = function(done) {
  db.Client
    .create({
      id:                 100,
      secret:             'e2412cd1-f010-4514-acab-c8af59e5501a',
      name:               'Test client',
      software_id:        'CPA AP Test',
      software_version:   '0.0.1',
      ip:                 '127.0.0.1',
      registration_type:  'static'
    })
    .then(function() {
      return db.Scope.create({
        id:           5,
        name:         'example-service.bbc.co.uk',
        display_name: 'BBC Radio'
      });
    })
    .then(function() {
      done();
    },
    function(error) {
      done(new Error(JSON.stringify(error)));
    });
};

describe('GET /authorize', function() {
  context("when the client redirects the resource owner for authorization", function() {
    before(function() {
//      sinon.stub(generate, 'accessToken').returns('aed201ffb3362de42700a293bdebf6123');
    });

    after(function() {
//      generate.accessToken.restore();
    });

    before(clearDatabase);
    before(initDatabase);

    context('with valid parameters', function() {

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
        var path = '/authorize?' +
          'response_type=code' +
          '&client_id=100' +
          '&redirect_uri=' + encodeURI('https://example-client.bbc.co.uk/callback');

        requestHelper.sendRequest(this, path, {
          method: 'get',
          cookie: this.cookie
        }, done);
      });

      it('should reply with a status code 200', function() {
        expect(this.res.statusCode).to.equal(200);
      });

      it('should return HTML', function() {
        expect(this.res.headers['content-type']).to.equal('text/html; charset=utf-8');
      });

      describe('the response body', function() {
        it('should contain hidden inputs with request informations', function() {
          var $ = cheerio.load(this.res.text);
          expect($('input[name="client_id"]').length).to.equal(1);
          expect($('input[name="client_id"]')[0].attribs.value).to.equal('100');
          expect($('input[name="redirect_uri"]').length).to.equal(1);
          expect($('input[name="scope"]').length).to.equal(1);
          expect($('input[name="state"]').length).to.equal(1);
        });

        it('should display the button authorize', function() {
          var $ = cheerio.load(this.res.text);
          expect($('input[value="Allow"]').length).to.equal(1);
        });

        it('should display the button cancel', function() {
          var $ = cheerio.load(this.res.text);
          expect($('input[value="Deny"]').length).to.equal(1);
        });
      });

      context('with invalid client_id', function() {

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
          var path = '/authorize?' +
            'response_type=code' +
            '&client_id=in' +
            '&redirect_uri=' + encodeURI('https://example-client.bbc.co.uk/callback');

          requestHelper.sendRequest(this, path, {
            method: 'get',
            cookie: this.cookie
          }, done);
        });

        it("should return an invalid_request error", function() {
          assertions.verifyError(this.res, 400, 'invalid_request');
        });
      });
    });
  });
});
