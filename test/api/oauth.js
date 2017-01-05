"use strict";

var generate = require('../../lib/generate');
var messages = require('../../lib/messages');
var db = require('../../models');

var requestHelper = require('../request-helper');
var dbHelper = require('../db-helper');

var config = require('../../config');
var jwtHelper = require('../../lib/jwt-helper');

var CLIENT = {
	id: 1,
	client_id: "ClientA",
	client_secret: "ClientSecret",
	name: "OAuth 2.0 Client",
	redirect_uri: 'http://localhost'
};
var USER = {
	email: 'test@test.com',
	account_uid: 'RandomUid',
	password: 'a'
};

var URL_PREFIX = config.urlPrefix;

function createOAuth2Client(done) {
	db.OAuth2Client.create(CLIENT).then(
		function () {
			return done();
		},
		function (err) {
			return done(err);
		}
	);
}

function createFakeUser(done) {
	db.User.create(USER).then(
		function (user) {
			user.setPassword(USER.password).then(
				function (user) {
					return done();
				},
				done);
		},
		done
	);
}

var resetDatabase = function (done) {
	dbHelper.clearDatabase(function (err) {
		if (err) {
			return done(err);
		} else {
			createOAuth2Client(
				function () {
					done();
				}
			);
		}
	});
};

// test resource owner password
describe('POST /oauth2/token', function () {
	var url = '/oauth2/token';
	context('without a client_id', function () {
		before(resetDatabase);

		before(function (done) {
			requestHelper.sendRequest(this, url, {
				method: 'post',
				cookie: this.cookie,
				type: 'form',
				data: {grant_type: 'password', username: USER.email, password: USER.password}
			}, done);
		});

		it('should reject the request', function () {
			expect(this.res.statusCode).equal(401);
		});
	});

	context(
		'with a bad client_id/client_secret',
		function () {
			before(resetDatabase);
			before(function (done) {
				requestHelper.sendRequest(this, url, {
					method: 'post',
					cookie: this.cookie,
					type: 'form',
					data: {
						grant_type: 'password',
						username: USER.email,
						password: USER.password,
						client_id: '_' + CLIENT.client_id,
						client_secret: CLIENT.client_secret
					}
				}, done);
			});

			it('should reject the request', function () {
				expect(this.res.statusCode).equal(401);
			});
		}
	);

	context('using grant_type: \'password\'', function () {
		before(resetDatabase);
		before(createFakeUser);

		before(function (done) {
			requestHelper.sendRequest(this, url, {
				method: 'post',
				cookie: this.cookie,
				type: 'form',
				data: {
					grant_type: 'password',
					username: USER.email,
					password: USER.password,
					client_id: CLIENT.client_id,
					client_secret: CLIENT.client_secret
				}
			}, done);
		});

		it('should return a success', function () {
			expect(this.res.statusCode).equal(200);
		});

		it('should have proper access token', function () {
			var data = jwtHelper.decode(this.res.body.access_token, CLIENT.client_secret);
			expect(data.typ).equal('access');
			expect(data.cli).equal(CLIENT.client_id);
			expect(data.sub).not.equal(undefined);
			expect(data.exp).not.equal(undefined);
			// expect(this.res.body.access_token).equal('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJjcGEiLCJhdWQiOiJjcGEiLCJleHAiOjEzOTcwNzcyMDAwMDAsInN1YiI6MzA3LCJ0eXAiOiJhY2Nlc3MiLCJjbGkiOjEsInZmeSI6IjEifQ.9L7uCyfNoV3kPaUl1JuJdwJuItYC70azIg9vhFri40s');
		});

		it('should have expires_in set correctly', function () {
			expect(this.res.body.expires_in).equal(36000);
		});

		it('should have token type Bearer', function () {
			expect(this.res.body.token_type).equal('Bearer');
		});
	});

	context(
		'using grant_type \'password\' with bad user login',
		function () {
			before(resetDatabase);
			before(createFakeUser);

			before(function (done) {
				requestHelper.sendRequest(
					this,
					url,
					{
						method: 'post',
						cookie: this.cookie,
						type: 'form',
						data: {
							grant_type: 'password',
							username: 'abc+' + USER.email,
							password: USER.password,
							client_id: CLIENT.client_id,
							client_secret: CLIENT.client_secret
						}
					},
					done);
			});

			it('should reject with bad request', function () {
				expect(this.res.statusCode).equal(400);
			});
			it('should give error name', function () {
				expect(this.res.body.error).equal('invalid_request');
			});
		}
	);
});

describe('POST /oauth2/login', function () {
	var url = '/oauth2/login';
	context('without a client_id', function () {
		before(resetDatabase);

		before(function (done) {
			requestHelper.sendRequest(this, url, {
				method: 'post',
				cookie: this.cookie,
				type: 'form',
				data: {grant_type: 'password', username: USER.email, password: USER.password}
			}, done);
		});

		it('should reject the request', function () {
			expect(this.res.statusCode).equal(400);
		});
	});

	context(
		'with a bad client_id',
		function () {
			before(resetDatabase);
			before(function (done) {
				requestHelper.sendRequest(this, url, {
					method: 'post',
					cookie: this.cookie,
					type: 'form',
					data: {
						grant_type: 'password',
						username: USER.email,
						password: USER.password,
						client_id: '_' + CLIENT.client_id
					}
				}, done);
			});

			it('should reject the request', function () {
				expect(this.res.statusCode).equal(400);
			});
		}
	);

	context('using grant_type: \'password\'', function () {
		before(resetDatabase);
		before(createFakeUser);

		before(function (done) {
			requestHelper.sendRequest(this, url, {
				method: 'post',
				cookie: this.cookie,
				type: 'form',
				data: {
					grant_type: 'password',
					username: USER.email,
					password: USER.password,
					client_id: CLIENT.client_id
				}
			}, done);
		});

		it('should return a success', function () {
			expect(this.res.statusCode).equal(200);
		});

		it('should have proper access token', function () {
			var data = jwtHelper.decode(this.res.body.access_token, CLIENT.client_secret);
			expect(data.typ).equal('access');
			expect(data.cli).equal(CLIENT.client_id);
			expect(data.sub).not.equal(undefined);
			expect(data.exp).not.equal(undefined);
			// expect(this.res.body.access_token).equal('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJjcGEiLCJhdWQiOiJjcGEiLCJleHAiOjEzOTcwNzcyMDAwMDAsInN1YiI6MzA5LCJ0eXAiOiJhY2Nlc3MiLCJjbGkiOjEsInZmeSI6IjEifQ.a2wd3w3pkh1TRIb3EFo0yH99n5GL6lNtVgHT0YR11lI');
		});

		it('should have expires_in set correctly', function () {
			expect(this.res.body.expires_in).equal(36000);
		});

		it('should have token type Bearer', function () {
			expect(this.res.body.token_type).equal('Bearer');
		});
	});

	context(
		'using grant_type \'password\' with bad user login',
		function () {
			before(resetDatabase);
			before(createFakeUser);

			before(function (done) {
				requestHelper.sendRequest(
					this,
					url,
					{
						method: 'post',
						cookie: this.cookie,
						type: 'form',
						data: {
							grant_type: 'password',
							username: 'abc+' + USER.email,
							password: USER.password,
							client_id: CLIENT.client_id
						}
					},
					done);
			});

			it('should reject with bad request', function () {
				expect(this.res.statusCode).equal(400);
			});
			it('should give error name', function () {
				expect(this.res.body.error).equal('invalid_request');
			});
		}
	);

	context(
		'using grant_type \'refresh_token\' with bad token',
		function () {
			before(resetDatabase);
			before(createFakeUser);

			before(function (done) {
				requestHelper.sendRequest(
					this,
					url,
					{
						method: 'post',
						cookie: this.cookie,
						type: 'form',
						data: {
							grant_type: 'refresh_token',
							refresh_token: 'no.sense.here',
							client_id: CLIENT.client_id
						}
					},
					done);
			});

			it('should reject with bad request', function () {
				expect(this.res.statusCode).equal(400);
			});
			it('should give error name', function () {
				expect(this.res.body.error).equal('invalid_request');
			});
		}
	);

	context(
		'using grant_type \'refresh_token\' with valid token',
		function () {
			var validToken;

			before(resetDatabase);
			before(createFakeUser);

			before(function (done) {
				var self = this;
				requestHelper.sendRequest(
					this,
					url,
					{
						method: 'post',
						cookie: this.cookie,
						type: 'form',
						data: {
							grant_type: 'password',
							username: USER.email,
							password: USER.password,
							client_id: CLIENT.client_id
						}
					},
					function () {
						validToken = self.res.body.refresh_token;
						return done();
					});
			});

			before(function (done) {
				requestHelper.sendRequest(
					this,
					url,
					{
						method: 'post',
						cookie: this.cookie,
						type: 'form',
						data: {
							grant_type: 'refresh_token',
							refresh_token: validToken,
							client_id: CLIENT.client_id
						}
					},
					done);
			});

			it('should accept with 200', function () {
				expect(this.res.statusCode).equal(200);
			});
			it('should provide access token', function () {
				var data = jwtHelper.decode(this.res.body.access_token, CLIENT.client_secret);
				expect(data.typ).equal('access');
				expect(data.cli).equal(CLIENT.client_id);
				expect(data.sub).not.equal(undefined);
				expect(data.exp).not.equal(undefined);
				// expect(this.res.body.access_token).equal('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJjcGEiLCJhdWQiOiJjcGEiLCJleHAiOjEzOTcwNzcyMDAwMDAsInN1YiI6MzEyLCJ0eXAiOiJhY2Nlc3MiLCJjbGkiOjEsInZmeSI6IjEifQ.Kl6JhiyUdVB85aP3hivG_mCCRXin-gpwMbDzsSRcq5w');
			});
		}
	);
});

describe('GET /oauth2/dialog/authorize', function () {
	context('using response_type \'code\'', function () {
		var baseUrl = '/oauth2/dialog/authorize?response_type=code&state=a';
		context('without a client_id', function () {
			before(resetDatabase);

			before(function (done) {
				requestHelper.sendRequest(
					this,
					baseUrl,
					{
						method: 'get',
						cookie: this.cookie,
						type: 'form',
						data: {response_type: 'code', state: 'a'}
					},
					done
				);
			});

			it('should reject the request', function () {
				expect(this.res.statusCode).equal(400);
			});
		});

		context('with wrong client_id', function () {
			before(resetDatabase);

			before(function (done) {
				requestHelper.sendRequest(
					this,
					baseUrl + '&client_id=' + encodeURIComponent('a' + CLIENT.client_id) + '&redirect_uri=' + encodeURIComponent('http://localhost'),
					{},
					done
				);
			});

			it('should reject the request', function () {
				expect(this.res.statusCode).equal(500);
			});
		});

		context('with proper client_id', function () {
			before(resetDatabase);

			before(function (done) {
				requestHelper.sendRequest(
					this,
					baseUrl + '&client_id=' + encodeURIComponent(CLIENT.client_id) + '&redirect_uri=' + encodeURIComponent(CLIENT.redirect_uri),
					{},
					done
				);
			});

			it('should redirect to login page', function () {
				expect(this.res.statusCode).equal(302);
			});

			it('should redirect to login page', function () {
				expect(this.res.headers.location).equal(URL_PREFIX + '/auth');
			});
		});
	});

	context('using response_type \'token\'', function () {
		var baseUrl = '/oauth2/dialog/authorize?response_type=token&state=a';
		context('without a client_id', function () {
			before(resetDatabase);

			before(function (done) {
				requestHelper.sendRequest(
					this,
					baseUrl,
					{
						method: 'get',
						cookie: this.cookie,
						type: 'form',
						data: {response_type: 'code', state: 'a'}
					},
					done
				);
			});

			it('should reject the request', function () {
				expect(this.res.statusCode).equal(400);
			});
		});

		context('with wrong client_id', function () {
			before(resetDatabase);

			before(function (done) {
				requestHelper.sendRequest(
					this,
					baseUrl + '&client_id=' + encodeURIComponent('a' + CLIENT.client_id) + '&redirect_uri=' + encodeURIComponent('http://localhost'),
					{},
					done
				);
			});

			it('should reject the request', function () {
				expect(this.res.statusCode).equal(500);
			});
		});

		context('with proper client_id', function () {
			before(resetDatabase);

			before(function (done) {
				requestHelper.sendRequest(
					this,
					baseUrl + '&client_id=' + encodeURIComponent(CLIENT.client_id) + '&redirect_uri=' + encodeURIComponent(CLIENT.redirect_uri),
					{},
					done
				);
			});

			it('should redirect to login page', function () {
				expect(this.res.statusCode).equal(302);
			});

			it('should redirect to login page', function () {
				expect(this.res.headers.location).equal(URL_PREFIX + '/auth');
			});
		});
	});
});