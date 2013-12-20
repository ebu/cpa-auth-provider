"use strict";


// Test for the dynamic registration end point

describe('POST /register', function() {

  var correctRequest = {
    client_name: 'Test client',
    software_id: 'CPA AP Test',
    software_version: '0.0.1'
  };

  context("While sending the Content-Type: ", function() {
    it('responds with 201 and a client_id', function(done) {
      request.post('/register').type("application/json").send(JSON.stringify(correctRequest)).end(function(err, res) {
        if (err) {
          done(err);
        } else {
          expect(res.statusCode).to.equal(201);
          done();
        }
      });
    });
  });

  context("Without defining the content type", function() {
    it('returns a 400 Bad request error', function(done) {
      request.post('/register').send(JSON.stringify(correctRequest)).end(function(err, res) {
        if (err) {
          done(err);
        } else {
          expect(res.statusCode).to.equal(400);
          done();
        }
      });
    });
  });


});
