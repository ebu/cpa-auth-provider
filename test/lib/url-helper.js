"use strict";

var urlHelper = require('../../lib/url-helper');

describe("urlHelper.addQueryParameters", function() {
  it("should add a query parameter", function() {
    var url = urlHelper.addQueryParameters('http://example.com/test', {result: 'success'});
    expect(url).to.equal('http://example.com/test?result=success');
  });

  it("should add a query parameter and preserve other parameters", function() {
    var url = urlHelper.addQueryParameters('http://example.com/test?p=1', {result: 'success'});
    expect(url).to.equal('http://example.com/test?p=1&result=success');
  });

  it("should add multiple query parameters", function() {
    var url = urlHelper.addQueryParameters('http://example.com/test', {result: 'success', info: 'ok'});
    expect(url).to.equal('http://example.com/test?result=success&info=ok');
  });
});
