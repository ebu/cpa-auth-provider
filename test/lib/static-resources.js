"use strict";

var requestHelper = require('../request-helper');

describe('Static resources', function() {

  var resources = ['/js/jquery.js', '/css/bootstrap.css', '/js/bootstrap.js'];

  resources.forEach(function(resourcePath) {
    beforeEach(function(done) {
      requestHelper.sendRequest(this, resourcePath, null, done);
    });

    it('should successfully return ' + resourcePath + ' with status 200', function() {
      expect(this.res.statusCode).to.equal(200);
    });
  });
});
