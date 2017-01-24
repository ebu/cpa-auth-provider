"use strict";

var generate = require('../../lib/generate');

describe("generate.cryptoCode", function() {
  before(function() {
    this.userCode = generate.cryptoCode(10);
  });

  it("should return a string of length 10", function() {
    expect(this.userCode.length).to.equal(10);
  });

  it("should return contain only valid characters", function() {
    expect(this.userCode).to.match(/^[ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz1234567890]{10}$/);
  });
});
