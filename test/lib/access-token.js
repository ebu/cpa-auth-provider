"use strict";

var generate = require('../../lib/generate');

describe("generate.accessToken", function() {
  it("should generate access tokens valid according to RFC6750 section 2.1", function() {
    var accessToken = generate.accessToken();

    // b64token    = 1*( ALPHA / DIGIT /
    //       "-" / "." / "_" / "~" / "+" / "/" ) *"="
    expect(accessToken).to.match(/^[A-Za-z0-9\-._~+/]+=*$/);
  });
});
