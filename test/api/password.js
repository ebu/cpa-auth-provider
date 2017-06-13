"use strict";

var generate = require('../../lib/generate');
var messages = require('../../lib/messages');
var db = require('../../models');

var requestHelper = require('../request-helper');
var dbHelper = require('../db-helper');

var config = require('../../config');

var CLIENT = {
	id: 1,
	client_id: "ClientA",
	client_secret: "ClientSecret",
	name: "OAuth 2.0 Client",
	redirect_uri: 'http://localhost'
};
var USER = {
	id: 123,
	email: 'test@test.com',
	email_verified: true,
	account_uid: 'RandomUid',
	password: 'a'
};

var USER2 = {
	id: 234,
	email: 'some@one.else',
	email_verified: true,
	account_uid: 'AnotherUid',
	password: 'b'
};

var UNVERIFIED_USER = {
	id: 345,
	email: 'unknown@no.where',
	email_verified: false,
	account_uid: 'YetAnotherUid',
	password: 'c'
};

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

function createUser(userTemplate) {
	return new Promise(
		function (resolve, reject) {
			db.User.create(userTemplate).then(
				function (user) {
					user.setPassword(userTemplate.password).then(resolve, reject);
				},
				reject);
		}
	);
}

function createFakeUser(done) {
	createUser(USER).then(
		function () {
			return createUser(USER2);
		}
	).then(
		function() {
			return createUser(UNVERIFIED_USER);
		}
	).then(
		function () {
			return done();
		}
	).catch(done);
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

// test password
describe('POST /user/password', function () {
	var url = '/user/password';

	context('without a client_id', function () {
		before(resetDatabase);
		before(createFakeUser);

		before(function (done) {
			requestHelper.sendRequest(this, url, {
				method: 'post',
				cookie: this.cookie,
				type: 'form',
				data: {
					request_type: 'set-password',
					username: USER.email,
					current_password: USER.password,
					new_password: 'ComplexNewPassword'
				}
			}, done);
		});

		it('should reject the request', function () {
			expect(this.res.statusCode).equal(400);
		});
	});

	// ---------------------------------------------------------------------
	// -- SET-PASSWORD
	// ---------------------------------------------------------------------
	context('request_type \'set-password\'', function () {
		context('with wrong current password', function () {
			before(resetDatabase);
			before(createFakeUser);

			before(function (done) {
				requestHelper.sendRequest(this, url, {
					method: 'post',
					cookie: this.cookie,
					type: 'form',
					data: {
						client_id: CLIENT.client_id,
						request_type: 'set-password',
						username: USER.email,
						current_password: USER2.password,
						new_password: 'ComplexNewPassword'
					}
				}, done);
			});

			it('should reject the request', function () {
				expect(this.res.statusCode).equal(400);
			});
		});

		context('with unknown username', function() {
			before(resetDatabase);
			before(createFakeUser);

			before(function (done) {
				requestHelper.sendRequest(this, url, {
					method: 'post',
					cookie: this.cookie,
					type: 'form',
					data: {
						client_id: CLIENT.client_id,
						request_type: 'set-password',
						username: 'somethingextra' + USER.email,
						current_password: USER.password,
						new_password: 'ComplexNewPassword'
					}
				}, done);
			});

			it('should reject the request', function () {
				expect(this.res.statusCode).equal(400);
			});
		});

		context('with proper authentication', function() {
			before(resetDatabase);
			before(createFakeUser);

			before(function (done) {
				requestHelper.sendRequest(this, url, {
					method: 'post',
					cookie: this.cookie,
					type: 'form',
					data: {
						client_id: CLIENT.client_id,
						request_type: 'set-password',
						username: USER.email,
						current_password: USER.password,
						new_password: 'ComplexNewPassword'
					}
				}, done);
			});

			it('should return status 200', function () {
				expect(this.res.statusCode).equal(200);
			});

			it('should send success', function() {
				expect(this.res.body.success).equal(true);
			});
		});

		context('with proper authentication for 2nd user', function() {
			before(resetDatabase);
			before(createFakeUser);

			before(function (done) {
				requestHelper.sendRequest(this, url, {
					method: 'post',
					cookie: this.cookie,
					type: 'form',
					data: {
						client_id: CLIENT.client_id,
						request_type: 'set-password',
						username: USER2.email,
						current_password: USER2.password,
						new_password: 'AnotherNewPassword'
					}
				}, done);
			});

			it('should return status 200', function () {
				expect(this.res.statusCode).equal(200);
			});

			it('should send success', function() {
				expect(this.res.body.success).equal(true);
			});
		});

		context('with proper authentication for unverified user', function() {
			before(resetDatabase);
			before(createFakeUser);

			before(function (done) {
				requestHelper.sendRequest(this, url, {
					method: 'post',
					cookie: this.cookie,
					type: 'form',
					data: {
						client_id: CLIENT.client_id,
						request_type: 'set-password',
						username: UNVERIFIED_USER.email,
						current_password: UNVERIFIED_USER.password,
						new_password: 'AnotherNewPassword'
					}
				}, done);
			});

			it('should return status 200', function () {
				expect(this.res.statusCode).equal(200);
			});

			it('should send success', function() {
				expect(this.res.body.success).equal(true);
			});
		});
	});

	// ---------------------------------------------------------------------
	// -- REQUEST-PASSWORD-EMAIL
	// ---------------------------------------------------------------------
	context('request_type \'request-password-email\'', function () {
		context('with unknown username', function () {
			before(resetDatabase);
			before(createFakeUser);

			before(function (done) {
				requestHelper.sendRequest(this, url, {
					method: 'post',
					cookie: this.cookie,
					type: 'form',
					data: {
						client_id: CLIENT.client_id,
						request_type: 'request-password-email',
						username: 'wrong' + USER.email
					}
				}, done);
			});

			it('should reject the request', function () {
				expect(this.res.statusCode).equal(400);
			});

			it('should give USER_NOT_FOUND message', function() {
				expect(this.res.body.success).equal(false);
				expect(this.res.body.reason).equal('USER_NOT_FOUND');
			});
		});

		context('with proper username for verified user', function() {
			before(resetDatabase);
			before(createFakeUser);

			before(function (done) {
				requestHelper.sendRequest(this, url, {
					method: 'post',
					cookie: this.cookie,
					type: 'form',
					data: {
						client_id: CLIENT.client_id,
						request_type: 'request-password-email',
						username: USER.email
					}
				}, done);
			});

			it('should return status 200', function () {
				expect(this.res.statusCode).equal(200);
			});

			it('should send success', function() {
				expect(this.res.body.success).equal(true);
			});
		});

		context('with proper username for 2nd user', function() {
			before(resetDatabase);
			before(createFakeUser);

			before(function (done) {
				requestHelper.sendRequest(this, url, {
					method: 'post',
					cookie: this.cookie,
					type: 'form',
					data: {
						client_id: CLIENT.client_id,
						request_type: 'request-password-email',
						username: USER2.email
					}
				}, done);
			});

			it('should return status 200', function () {
				expect(this.res.statusCode).equal(200);
			});

			it('should send success', function() {
				expect(this.res.body.success).equal(true);
			});
		});

		context('with proper username for unverified user', function() {
			before(resetDatabase);
			before(createFakeUser);

			before(function (done) {
				requestHelper.sendRequest(this, url, {
					method: 'post',
					cookie: this.cookie,
					type: 'form',
					data: {
						client_id: CLIENT.client_id,
						request_type: 'request-password-email',
						username: UNVERIFIED_USER.email
					}
				}, done);
			});

			it('should return status 200', function () {
				expect(this.res.statusCode).equal(200);
			});

			it('should send success true', function() {
				expect(this.res.body.success).equal(true);
			});
		});
	});
});
