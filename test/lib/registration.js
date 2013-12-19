"use strict";


// Test for the dynamic registration end point


describe('POST /register', function() {

  var correctRequest = {
    client_name: 'Test client',
    software_id: 'CPA AP Test',
    software_version: '0.0.1'
  };

  context("While sending the Content-Type: ", function() {
    it('responds with OK and a client_id', function() {
      request.post('/register').type("application/json").send(JSON.stringify(correctRequest)).end(function(err, res) {
        expect(res.statusCode).to.equal(201);
        expect(res.body.client_id).to.be.above(0);
      });
    });
  });

  context("Without defining the content type", function() {
    it('returns a 400 Bad request error', function() {
      request.post('/register').send(correctRequest).end(function(err, res) {
        expect(res.statusCode).to.equal(400);
      });
    });
  });

});
