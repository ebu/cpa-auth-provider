"use strict";

// Test for the dynamic registration end point

var _ = require('lodash');

var db = require('../../models');

var assertions    = require('../assertions');
var requestHelper = require('../request-helper');

var clearDatabase = function(done) {
  db.sequelize.query('DELETE FROM Clients').then(function() {
    return db.sequelize.query('DELETE FROM RegistrationAccessTokens');
  })
  .then(function() {
    done();
  },
  function(error) {
    done(error);
  });
};

var initDatabase = function(done) {
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
      return db.RegistrationAccessToken.create({
        token:     '8ecf4b2a0df2df7fd69df128e0ac4fcc',
        scope:     'test',
        client_id: 3
      });
    })
    .then(function() {
      done();
    },
    function(err) {
      done(new Error(JSON.stringify(err)));
    });
};

describe('POST /register', function() {
  context('When registering a client', function() {
    // Reference : http://tools.ietf.org/html/draft-ietf-oauth-dyn-reg-14#section-5.1

    context('while providing a wrong Content-Type', function() {
      before(clearDatabase);

      before(function(done) {
        var data = {
          client_name: 'Test client',
          software_id: 'CPA AP Test',
          software_version: '0.0.1'
        };

        requestHelper.postForm(this, '/register', { data: JSON.stringify(data) }, done);
      });

      it('should return status 400', function() {
        expect(this.res.statusCode).to.equal(400);
      });
    });

    context('when providing a correct request', function() {
      before(clearDatabase);

      before(function(done) {
        var data = {
          client_name: 'Test client',
          software_id: 'CPA AP Test',
          software_version: '0.0.1'
        };

        requestHelper.postJSON(this, '/register', { data: data }, done);
      });

      it('should return status 201', function() {
        expect(this.res.statusCode).to.equal(201);
      });

      it('should respond with JSON', function() {
        expect(this.res.headers['content-type']).to.equal('application/json; charset=utf-8');
      });

      describe("the response body", function() {
        it("should include the client id", function() {
          expect(this.res.body).to.have.property('client_id');
          expect(this.res.body.client_id).to.match(/^\d+$/);
        });

        it("should include the registration access token", function() {
          expect(this.res.body).to.have.property('registration_access_token');
          expect(this.res.body.registration_access_token).to.match(/^[0-9a-f]{32}$/);
        });

        it("should include the registration client uri", function() {
          expect(this.res.body).to.have.property('registration_client_uri');
          expect(this.res.body.registration_client_uri).to.equal('http://example.com/registration_client_uri');
        });
      });

      describe("the database", function() {
        before(function(done) {
          var self = this;

          db.RegistrationAccessToken.findAll().then(function(tokens) {
            self.tokens = tokens;
          })
          .then(function() {
            return db.Client.findAll();
          })
          .then(function(clients) {
            self.clients = clients;
            done();
          },
          function(error) {
            done(error);
          });
        });

        // jshint expr: true
        it("should contain a client", function() {
          expect(this.clients).to.be.ok;
          expect(this.clients.length).to.equal(1);
        });

        describe("the client", function() {
          before(function() { this.client = this.clients[0]; });

          it("should have the correct attributes", function() {
            expect(this.client.name).to.equal('Test client');
            expect(this.client.software_id).to.equal('CPA AP Test');
            expect(this.client.software_version).to.equal('0.0.1');
          });
        });

        // jshint expr: true
        it("should contain a registration access token", function() {
          expect(this.tokens).to.be.ok;
          expect(this.tokens.length).to.equal(1);
        });

        describe("the registration access token", function() {
          before(function() { this.token = this.tokens[0]; });

          it("should be associated with the correct client", function() {
            expect(this.token.client_id).to.equal(this.clients[0].id);
          });

          it("should have valid value", function() {
            expect(this.token.token).to.match(/^[0-9a-f]{32}$/);
          });
        });
      });
    });

    var fields = ['client_name', 'software_id', 'software_version'];

    fields.forEach(function(field) {
      context('with missing ' + field + ' field', function() {
        before(clearDatabase);

        before(function(done) {
          var data = {
            client_name: 'Test client',
            software_id: 'CPA AP Test',
            software_version: '0.0.1'
          };

          delete data[field];

          requestHelper.postJSON(this, '/register', { data: data }, done);
        });

        it('should return status 400', function() {
          expect(this.res.statusCode).to.equal(400);
        });
      });
    });

    fields.forEach(function(field) {
      context('with blank ' + field + ' field', function() {
        before(clearDatabase);

        before(function(done) {
          var data = {
            client_name: 'Test client',
            software_id: 'CPA AP Test',
            software_version: '0.0.1'
          };

          data[field] = '';

          requestHelper.postJSON(this, '/register', { data: data }, done);
        });

        it('should return status 400', function() {
          expect(this.res.statusCode).to.equal(400);
        });
      });
    });
  });
});

// GET /register tests

var sendReadRequest = function(context, params, done) {
  var url;

  if (params.type !== 'GET') {
    url = '/register/' + params.client_id;
  }
  else {
    url = '/register?client_id=' + params.client_id;
  }

  if (params.authorization) {
    requestHelper.getWithOptions(
      context,
      url,
      { authorization: params.authorization },
      done
    );
  }
  else {
    requestHelper.get(context, url, false, done);
  }
};

// Test with both URI parameters and GET parameters
var testCases = [
  {
    label: '/register/:client_id',
    sendRequest: sendReadRequest
  },
  {
    label: '/register?client_id=:client_id',
    sendRequest: function(context, params, done) {
      sendReadRequest(context, _.extend(params, { type: 'GET' }), done);
    }
  }
];

testCases.forEach(function(testCase) {
  describe('GET ' + testCase.label, function() {
    // Reference : http://tools.ietf.org/html/draft-ietf-oauth-dyn-reg-14#section-5.1

    before(clearDatabase);
    before(initDatabase);

    context('When reading information about a client', function() {
      context('without access_token', function() {
        context('with an invalid client_id', function() {
          before(function(done){
            testCase.sendRequest(this, { authorization: null, client_id: 'unknown' }, done);
          });

          it("should return 'unauthorized' error", function() {
            assertions.verifyError(this.res, 401, 'unauthorized');
          });
        });

        context('with a valid client_id', function() {
          before(function(done){
            testCase.sendRequest(this, { authorization: null, client_id: 3 }, done);
          });

          it("should return 'unauthorized' error", function() {
            assertions.verifyError(this.res, 401, 'unauthorized');
          });

          it('should not contain an error message in the header', function() {
            expect(this.res.headers['www-authenticate'].indexOf("error=")).to.equal(-1);
          });
        });
      });
    });

    context('with an invalid access_token', function() {
      context('with an invalid client_id', function() {
        before(function(done){
          testCase.sendRequest(this, { authorization: 'invalid', client_id: 'unknown' }, done);
        });

        it("should return 'unauthorized' error", function() {
          assertions.verifyError(this.res, 401, 'unauthorized');
        });
      });

      context('with a valid client_id', function() {
        before(function(done){
          testCase.sendRequest(this, { authorization: 'invalid', client_id: 3 }, done);
        });

        it('should return status 401', function() {
          expect(this.res.statusCode).to.equal(401);
        });

        it('should contain an error message in the header', function() {
          expect(this.res.headers['www-authenticate'].indexOf('error="invalid_token"')).to.not.equal(-1);
        });
      });
    });

    context('with a valid access_token', function() {
      context('with an invalid client_id', function() {
        before(function(done){
          testCase.sendRequest(this, { authorization: '8ecf4b2a0df2df7fd69df128e0ac4fcc', client_id: 'unknown' }, done);
        });

        it('should return status 401', function() {
          expect(this.res.statusCode).to.equal(401);
        });
      });

      context('with a valid client_id', function() {
        before(function(done){
          testCase.sendRequest(this, { authorization: '8ecf4b2a0df2df7fd69df128e0ac4fcc', client_id: 3 }, done);
        });

        it('should return status 200', function() {
          expect(this.res.statusCode).to.equal(200);
        });

        it('should respond with JSON', function() {
          expect(this.res.headers['content-type']).to.equal('application/json; charset=utf-8');
        });

        describe("the response body", function() {
          it("should include the client id", function() {
            expect(this.res.body).to.have.property('client_id');
            expect(this.res.body.client_id).to.be.a('string');
            expect(this.res.body.client_id).to.equal('3');
          });

          it("should include the registration access token", function() {
            expect(this.res.body).to.have.property('registration_access_token');
            expect(this.res.body.registration_access_token).to.equal('8ecf4b2a0df2df7fd69df128e0ac4fcc');
          });

          it("should include the registration client uri", function() {
            expect(this.res.body).to.have.property('registration_client_uri');
            expect(this.res.body.registration_client_uri).to.equal('http://example.com/registration_client_uri');
          });
        });
      });
    });
  });
});

describe('PUT /register', function() {
  context("When updating configuration information about a client", function() {
    before(function(done) {
      requestHelper.sendPutRequest(this, '/register', done);
    });

    it('should reply 501 (Unimplemented)', function() {
      expect(this.res.statusCode).to.equal(501);
    });
  });
});

describe('DELETE /register', function() {
  context('When deleting configuration information about a client', function() {
    before(function(done) {
      requestHelper.sendDeleteRequest(this, '/register', done);
    });

    it('should reply 501 (Unimplemented)', function() {
      expect(this.res.statusCode).to.equal(501);
    });
  });
});
