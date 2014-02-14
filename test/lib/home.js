"use strict";

var db = require('../../models');

var requestHelper = require('../request-helper');

var resetDatabase = function(done) {
  db.sequelize.query('DELETE FROM Users').then(function() {
    return db.User.create({
      provider_uid: 'testuser',
      password: 'testpassword'
    });
  })
  .then(function() {
    done();
  },
  function(error) {
    done(error);
  });
};

describe('GET /', function() {
  before(resetDatabase);

  context('with a signed in user', function() {
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
      requestHelper.sendRequest(this, '/', { cookie: this.cookie }, done);
    });

    it('should redirect to /verify', function() {
      expect(this.res.statusCode).to.equal(302);
      expect(this.res.headers).to.have.property('location');
      expect(this.res.headers.location).to.equal('/verify');
    });
  });

  context('with no signed in user', function() {
    before(function(done) {
      requestHelper.sendRequest(this, '/', null, done);
    });

    it('should redirect to /auth', function() {
      expect(this.res.statusCode).to.equal(302);
      expect(this.res.headers).to.have.property('location');
      expect(this.res.headers.location).to.equal('/auth');
    });
  });
});
