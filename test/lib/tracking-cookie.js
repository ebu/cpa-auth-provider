"use strict";

var requestHelper = require("../request-helper");

describe('GET /auth - for tracking cookie', function() {
	before(function(done) {
		requestHelper.sendRequest(this, '/auth', null, done);
	});

	it('should set a cookie', function() {
		expect(this.res.header['set-cookie']).to.be.an('array');
		expect(this.res.header['set-cookie'].length).to.equal(2);
	});
});
