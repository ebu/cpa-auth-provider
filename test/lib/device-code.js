"use strict";

var generate = require('../../lib/generate');

describe("generate.deviceCode", function() {
  it("should return a uuid", function() {
    var deviceCode = generate.deviceCode();

    expect(deviceCode).to.match(/^[0-9A-Fa-f]{8}(?:\-[0-9A-Fa-f]{4}){3}\-[0-9A-Fa-f]{12}$/);
  });
});
