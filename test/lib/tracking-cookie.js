"use strict";

var config = require('../../config');

var generate = require('../../lib/generate');
var db = require('../../models');

var dbHelper = require('../db-helper');
var requestHelper = require("../request-helper");

var resetDatabase = function (done) {
    dbHelper.clearDatabase(function (err) {
        done(err);
    });
};

describe('GET /auth - for tracking cookie', function () {
    before(function (done) {
        requestHelper.sendRequest(this, '/auth', null, done);
    });

    it('should set a cookie', function () {
        expect(this.res.header['set-cookie']).to.be.an('array');
        expect(this.res.header['set-cookie'].length).to.equal(2);
    });
});

describe('GET /auth - for tracking cookie', function () {
    before(function (done) {
        config.trackingCookie.enabled = false;
        requestHelper.sendRequest(this, '/auth', null, done);
    });

    it('should not set a cookie if config.trackingCookie.enabled is false', function () {
        expect(this.res.header['set-cookie']).to.be.an('array');
        expect(this.res.header['set-cookie'].length).to.equal(1);
    });
});

describe('GET /auth - for ignore parameter', function () {

    var nbUsers = 0;

    before(resetDatabase);

    before(function (done) {
        config.trackingCookie.enabled = true;
        requestHelper.sendRequest(this, '/auth', null, done);
    });

    before(function (done) {
        db.User.count().then(
            function (users) {
                nbUsers = users;
                done();
            },
            done);
    });

    it('should add a new user', function () {
        expect(nbUsers).to.equal(1);
    });
});

describe('GET /auth - for ignore parameter', function () {

    var nbUsers = 0;

    before(resetDatabase);

    before(function (done) {
        config.trackingCookie.enabled = true;
        requestHelper.sendRequest(this, '/auth?ignoreme=true', null, done);
    });

    before(function (done) {
        db.User.count().then(
            function (users) {
                nbUsers = users;
                done();
            },
            done);
    });

    it('should not add a new user', function () {
        expect(nbUsers).to.equal(0);
    });
});