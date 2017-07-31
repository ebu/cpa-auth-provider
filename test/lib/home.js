"use strict";

var db = require('../../models');
var config = require('../../config');

var chai = require('chai');
var chaiJquery = require('chai-jquery');
var chaiHttp = require('chai-http');
var i18n4test = require("i18n");

var requestHelper = require('../request-helper');

i18n4test.configure({
    locales:['en'],
    directory: __dirname + '/../../locales'
});

config.title = "";

var resetDatabase = function (done) {
    db.sequelize.query('DELETE FROM Users').then(function () {
        return db.User.create({
            email: 'testuser',
            provider_uid: 'testuser'
        });
    })
        .then(function (user) {
            return user.setPassword('testpassword');
        })
        .then(function () {
                done();
            },
            function (error) {
                done(error);
            });
};

describe('GET /', function () {
    before(resetDatabase);

    context('with a signed in user', function () {
        before(function (done) {
            requestHelper.login(this, done);
        });

        before(function (done) {
            requestHelper.sendRequest(this, '/', {cookie: this.cookie}, done);
        });

        it('should redirect to /home', function () {
            var urlPrefix = requestHelper.urlPrefix;
            expect(this.res.statusCode).to.equal(302);
            expect(this.res.headers).to.have.property('location');
            expect(this.res.headers.location).to.equal(urlPrefix + '/home');
        });
    });

    context('with no signed in user', function () {
        before(function (done) {
            requestHelper.sendRequest(this, '/', null, done);
        });

        it('should redirect to /auth', function () {
            var urlPrefix = requestHelper.urlPrefix;
            expect(this.res.statusCode).to.equal(302);
            expect(this.res.headers).to.have.property('location');
            expect(this.res.headers.location).to.equal(urlPrefix + '/auth');
        });
    });
});

describe('GET home', function() {

    before(resetDatabase);

    context('and let empty title in configuration file', function () {

        before(function (done) {
            requestHelper.sendRequest(this, '/', {cookie: this.cookie}, done);
        });

        it('the title should be the default one : ' + i18n4test.__('LAYOUT_DEFAULT_HEAD_CROSS_PLATFORM_AUTHENTICATION_TITLE'), function () {
            expect(this.$('title').text()).to.equal(i18n4test.__('LAYOUT_DEFAULT_HEAD_CROSS_PLATFORM_AUTHENTICATION_TITLE'));
        });
    });
});