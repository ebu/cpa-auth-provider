"use strict";

var generate = require('../../lib/generate');
var db = require('../../models');

var requestHelper = require('../request-helper');
var dbHelper = require('../db-helper');


var TAKEN_USERNAME = 'test@te.st';

var initDatabase = function(opts, done) {
	db.User.create({
			id:           3,
			provider_uid: 'testuser',
			email: TAKEN_USERNAME,
			display_name: 'Test User'
		})
		.then(function(user) {
		    return db.LocalLogin.create({
                user_id: user.id,
                login: TAKEN_USERNAME
            });
        })
        .then(function(login) {
			return login.setPassword('testpassword');
		})
		.then(function() {
				done();
			},
			function(error) {
				done(new Error(JSON.stringify(error)));
			});
};

var resetDatabase = function(opts, done) {
	if (!done) {
		done = opts;
		opts = { state: 'pending', user_id: null };
	}

	dbHelper.clearDatabase(function(err) {
		if (err) {
			done(err);
		}
		else {
			initDatabase(opts, done);
		}
	});
};

describe('POST /check/username', function() {
	context('when checking if a username exists', function() {
		context('and it has been taken', function() {
			before(resetDatabase);

			before(function(done) {
				requestHelper.sendRequest(this, '/check/username', {
					method: 'post',
					data: { username: TAKEN_USERNAME }
				}, done);
			});

			it('should return a status 200', function() {
				expect(this.res.statusCode).equal(200);
			});

			it('should claim it exists', function() {
				expect(this.res.body.exists).equal(true);
				expect(this.res.body.available).equal(false);
			});
		});

		context('and it has not been taken', function() {
			before(function(done) {
				requestHelper.sendRequest(this, '/check/username',
					{ method: 'post', data: { username: 'no@where.com' } },
					done);
			});

			it('should return a status 200', function() {
				expect(this.res.statusCode).equal(200);
			});

			it('should state it does not exist', function() {
				expect(this.res.body.exists).equal(false);
				expect(this.res.body.available).equal(true);
			});
		});
	});
});

describe('GET /check/username', function() {
	context('when requesting', function() {
		before(resetDatabase);

		before(function(done) {
			requestHelper.sendRequest(this, '/check/username', {
				method: 'get',
				data: { username: TAKEN_USERNAME }
			}, done);
		});

		it('should return a status Not Found (404)', function() {
			expect(this.res.statusCode).equal(404);
		});
	});
});

