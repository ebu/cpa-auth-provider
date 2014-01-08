"use strict";

describe("POST /token", function() {
  context("Polling to obtain an access token", function() {
    context("when the authorization request is pending", function() {
      it("should return status 400");
      it("should return authorization_pending error");
    });

    context("when the client polls too quickly", function() {
      it("should return status 400");
      it("should return slow_down error");
    });

    // RFC 6749, section 5.1
    context("when the authorization request is successful", function() {
      it("should return status 200");
      it("should return a Cache-Control: no-store header");
      it("should return a JSON object");

      describe("the response body", function() {
        it("should include a valid access token");
        it("should include the token type");

        // it("should include a valid refresh token"); // optional: refresh_token
        // it("should include the lifetime of the access token"); // optional: expires_in
        // it("should include the scope of the access token"); // optional(?): scope
      });
    });
  });
});
