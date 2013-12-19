"use strict";

var app = require('../../lib/app');

// Test for the dynamic registration end point


describe('POST /register', function() {

  context("While defining the Content-Type: ", function() {
    it('responds with ok', function() {
      request(app).post('/register').type("application/json").send("{}").end(function(err, res) {
        expect(res.statusCode).to.equal(200);
      });
    });
  });

  context("Without defining the content type", function() {
    it('returns a 400 Bad request error', function() {
      request(app).post('/register').send("{}").end(function(err, res) {
        expect(res.statusCode).to.equal(400);
      });
    });
  });



});
