"use strict";

var generate = require('../../lib/generate');

describe("generate.userCode", function() {
  before(function() {
    this.userCode = generate.userCode();
  });

  it("should return a string of length 8", function() {
    expect(this.userCode.length).to.equal(8);
  });

  it("should return contain only valid characters", function() {
    expect(this.userCode).to.match(/^[ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz]{8}$/);
  });
});
