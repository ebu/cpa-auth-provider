"use strict";

var generate = require('../../lib/generate');
var messages = require('../../lib/messages');
var db = require('../../models');

var requestHelper = require('../request-helper');
var dbHelper = require('../db-helper');

var resetDatabase = function (done) {
    dbHelper.clearDatabase(function (err) {
        done(err);
    });
};

var INCORRECT_LOGIN_OR_PASS = 'The user name or password is incorrect';


// Test signup

describe('POST /api/local/signup', function () {

    context('When unauthenticated user signup with bad recaptcha', function () {

        before(resetDatabase);

        before(function (done) {
            requestHelper.sendRequest(this, '/api/local/signup', {
                method: 'post',
                cookie: this.cookie,
                type: 'form',
                data: {email: 'qsdf@qsdf.fr', password: 'qsdf', 'g-recaptcha-response': 'qsdf'}
            }, done);
        });

        it('should return a success false', function () {
            console.log('msg:' + this.res.body.msg);
            console.log('success:' + this.res.body.success);
            expect(this.res.statusCode).to.equal(200);
            expect(this.res.body.success).to.equal(false);
            expect(this.res.body.msg).to.equal("Something went wrong with the reCAPTCHA");
        });

    });

    context('When unauthenticated user signup with good recaptcha', function () {

        before(resetDatabase);

        before(function (done) {
            requestHelper.sendRequest(this, '/api/local/signup', {
                method: 'post',
                cookie: this.cookie,
                type: 'form',
                data: {
                    email: 'qsdf2@qsdf.fr',
                    password: 'qsdf',
                    'g-recaptcha-response': '03AHJ_VuumGMJjbAPsRZf8KVVS_KR3uNwheBf3XefbSN9RmY1wnFvpTUYM5SHAoDeodK4a8cqBElvDA3rJPEu-z18r7ZlmMF1BUbDKnZsGvJqlnv7pwFofpoSyz9ltPWgH95Opovv8Yxw1yRwWnqgpw3242sR3q-EQkoqdJIZJBOziKRrtcgHOs8cMzKnvPlO5_LCT1Xf5e3AxsHsbbPSilME2WygfMELGrbq30Kb3rOL65RVg_gsuTMqxArOa9AQHxpGTx-IzYoWpjMmmCG5S1jna73xtkIB0dQuuv-J0on7U5yspn0UBNpaVslp5xa7PEjJSAQxU6yY4D8EnC2DsqnZT6bvxLNVRVJiX6HCjYnX7BvF1PRTaxrmJrZSd5yUjLxAG_QNroSwOF_hQhBprtQkSOIdEL1FlxG9PKy4wUttq3xRpgvBewOUiVMSa-m8Zr74CpsKnmU3aANqjPjDS15LjZ4zUY-qIYVQbRcw0FjBsOFwO7nqtlBfQC4ebKSgOfh31S2qXIcEY7mCxdj9MIxyqdalLwrFogrBzrQvH9CCkNizmTno0gWtWbE-obpB_EXgQ87du2FRADpHOhGmq-ic0yPZfs27an5xJrcuCOcTLOnED_RYzLETpyJ6ckYvlRsOGyGUbr-60wiLKb8ipeQkidPtMQqwd3c7bmDtk6BcIBEdm80tj_D-1YVxUdDtVmJw99RofQyVOoP2JVun0fquw4ylp_XimetVlvfjONpbmjRiRpaPUcosu0aQwZw20VTd10WFBfqIA3LUR2bKdG_JM2ODxPUg7FMVRMHIOOL0zUwxXdHSJeH8ek-vpOhJuh3vLeG3norWT1AEBOHpdHoFvlPB08u98b0cwzgJElpETn4rAdz7ad6vJL7Gee5wR0jJcqZPIdmCMZjBC4U7REletboN5JeYvK6ZMlG43o5uNAN4GH8h5VPQ'
                }
            }, done);
        });

        it('should return a success false', function () {
            console.log('msg:' + this.res.body.msg);
            console.log('success:' + this.res.body.success);
            expect(this.res.statusCode).to.equal(200);
            expect(this.res.body.success).to.equal(true);
            expect(this.res.body.msg).to.equal("Successfully created new user.");
        });

    });

    context('When unauthenticated user signup without password', function () {

        before(resetDatabase);

        before(function (done) {
            requestHelper.sendRequest(this, '/api/local/signup', {
                method: 'post',
                cookie: this.cookie,
                type: 'form',
                data: {
                    email: 'qsdf2@qsdf.fr',
                    'g-recaptcha-response': '03AHJ_VuumGMJjbAPsRZf8KVVS_KR3uNwheBf3XefbSN9RmY1wnFvpTUYM5SHAoDeodK4a8cqBElvDA3rJPEu-z18r7ZlmMF1BUbDKnZsGvJqlnv7pwFofpoSyz9ltPWgH95Opovv8Yxw1yRwWnqgpw3242sR3q-EQkoqdJIZJBOziKRrtcgHOs8cMzKnvPlO5_LCT1Xf5e3AxsHsbbPSilME2WygfMELGrbq30Kb3rOL65RVg_gsuTMqxArOa9AQHxpGTx-IzYoWpjMmmCG5S1jna73xtkIB0dQuuv-J0on7U5yspn0UBNpaVslp5xa7PEjJSAQxU6yY4D8EnC2DsqnZT6bvxLNVRVJiX6HCjYnX7BvF1PRTaxrmJrZSd5yUjLxAG_QNroSwOF_hQhBprtQkSOIdEL1FlxG9PKy4wUttq3xRpgvBewOUiVMSa-m8Zr74CpsKnmU3aANqjPjDS15LjZ4zUY-qIYVQbRcw0FjBsOFwO7nqtlBfQC4ebKSgOfh31S2qXIcEY7mCxdj9MIxyqdalLwrFogrBzrQvH9CCkNizmTno0gWtWbE-obpB_EXgQ87du2FRADpHOhGmq-ic0yPZfs27an5xJrcuCOcTLOnED_RYzLETpyJ6ckYvlRsOGyGUbr-60wiLKb8ipeQkidPtMQqwd3c7bmDtk6BcIBEdm80tj_D-1YVxUdDtVmJw99RofQyVOoP2JVun0fquw4ylp_XimetVlvfjONpbmjRiRpaPUcosu0aQwZw20VTd10WFBfqIA3LUR2bKdG_JM2ODxPUg7FMVRMHIOOL0zUwxXdHSJeH8ek-vpOhJuh3vLeG3norWT1AEBOHpdHoFvlPB08u98b0cwzgJElpETn4rAdz7ad6vJL7Gee5wR0jJcqZPIdmCMZjBC4U7REletboN5JeYvK6ZMlG43o5uNAN4GH8h5VPQ'
                }
            }, done);
        });

        it('should return a success false', function () {
            console.log('msg:' + this.res.body.msg);
            console.log('success:' + this.res.body.success);
            expect(this.res.statusCode).to.equal(200);
            expect(this.res.body.success).to.equal(false);
            expect(this.res.body.msg).to.equal("Please pass email and password.");
        });

    });

    context('When unauthenticated user signup without mail', function () {

        before(resetDatabase);

        before(function (done) {
            requestHelper.sendRequest(this, '/api/local/signup', {
                method: 'post',
                cookie: this.cookie,
                type: 'form',
                data: {
                    password: 'qsdf',
                    'g-recaptcha-response': '03AHJ_VuumGMJjbAPsRZf8KVVS_KR3uNwheBf3XefbSN9RmY1wnFvpTUYM5SHAoDeodK4a8cqBElvDA3rJPEu-z18r7ZlmMF1BUbDKnZsGvJqlnv7pwFofpoSyz9ltPWgH95Opovv8Yxw1yRwWnqgpw3242sR3q-EQkoqdJIZJBOziKRrtcgHOs8cMzKnvPlO5_LCT1Xf5e3AxsHsbbPSilME2WygfMELGrbq30Kb3rOL65RVg_gsuTMqxArOa9AQHxpGTx-IzYoWpjMmmCG5S1jna73xtkIB0dQuuv-J0on7U5yspn0UBNpaVslp5xa7PEjJSAQxU6yY4D8EnC2DsqnZT6bvxLNVRVJiX6HCjYnX7BvF1PRTaxrmJrZSd5yUjLxAG_QNroSwOF_hQhBprtQkSOIdEL1FlxG9PKy4wUttq3xRpgvBewOUiVMSa-m8Zr74CpsKnmU3aANqjPjDS15LjZ4zUY-qIYVQbRcw0FjBsOFwO7nqtlBfQC4ebKSgOfh31S2qXIcEY7mCxdj9MIxyqdalLwrFogrBzrQvH9CCkNizmTno0gWtWbE-obpB_EXgQ87du2FRADpHOhGmq-ic0yPZfs27an5xJrcuCOcTLOnED_RYzLETpyJ6ckYvlRsOGyGUbr-60wiLKb8ipeQkidPtMQqwd3c7bmDtk6BcIBEdm80tj_D-1YVxUdDtVmJw99RofQyVOoP2JVun0fquw4ylp_XimetVlvfjONpbmjRiRpaPUcosu0aQwZw20VTd10WFBfqIA3LUR2bKdG_JM2ODxPUg7FMVRMHIOOL0zUwxXdHSJeH8ek-vpOhJuh3vLeG3norWT1AEBOHpdHoFvlPB08u98b0cwzgJElpETn4rAdz7ad6vJL7Gee5wR0jJcqZPIdmCMZjBC4U7REletboN5JeYvK6ZMlG43o5uNAN4GH8h5VPQ'
                }
            }, done);
        });

        it('should return a success false', function () {
            console.log('msg:' + this.res.body.msg);
            console.log('success:' + this.res.body.success);
            expect(this.res.statusCode).to.equal(200);
            expect(this.res.body.success).to.equal(false);
            expect(this.res.body.msg).to.equal("Please pass email and password.");
        });

    });

    context('When 2 users register with same mail', function () {

        before(resetDatabase);

        before(function (done) {
            requestHelper.sendRequest(this, '/api/local/signup', {
                method: 'post',
                cookie: this.cookie,
                type: 'form',
                data: {
                    email: 'qsdf@qsdf.fr',
                    password: 'qsdf',
                    'g-recaptcha-response': '03AHJ_VuumGMJjbAPsRZf8KVVS_KR3uNwheBf3XefbSN9RmY1wnFvpTUYM5SHAoDeodK4a8cqBElvDA3rJPEu-z18r7ZlmMF1BUbDKnZsGvJqlnv7pwFofpoSyz9ltPWgH95Opovv8Yxw1yRwWnqgpw3242sR3q-EQkoqdJIZJBOziKRrtcgHOs8cMzKnvPlO5_LCT1Xf5e3AxsHsbbPSilME2WygfMELGrbq30Kb3rOL65RVg_gsuTMqxArOa9AQHxpGTx-IzYoWpjMmmCG5S1jna73xtkIB0dQuuv-J0on7U5yspn0UBNpaVslp5xa7PEjJSAQxU6yY4D8EnC2DsqnZT6bvxLNVRVJiX6HCjYnX7BvF1PRTaxrmJrZSd5yUjLxAG_QNroSwOF_hQhBprtQkSOIdEL1FlxG9PKy4wUttq3xRpgvBewOUiVMSa-m8Zr74CpsKnmU3aANqjPjDS15LjZ4zUY-qIYVQbRcw0FjBsOFwO7nqtlBfQC4ebKSgOfh31S2qXIcEY7mCxdj9MIxyqdalLwrFogrBzrQvH9CCkNizmTno0gWtWbE-obpB_EXgQ87du2FRADpHOhGmq-ic0yPZfs27an5xJrcuCOcTLOnED_RYzLETpyJ6ckYvlRsOGyGUbr-60wiLKb8ipeQkidPtMQqwd3c7bmDtk6BcIBEdm80tj_D-1YVxUdDtVmJw99RofQyVOoP2JVun0fquw4ylp_XimetVlvfjONpbmjRiRpaPUcosu0aQwZw20VTd10WFBfqIA3LUR2bKdG_JM2ODxPUg7FMVRMHIOOL0zUwxXdHSJeH8ek-vpOhJuh3vLeG3norWT1AEBOHpdHoFvlPB08u98b0cwzgJElpETn4rAdz7ad6vJL7Gee5wR0jJcqZPIdmCMZjBC4U7REletboN5JeYvK6ZMlG43o5uNAN4GH8h5VPQ'
                }
            }, done);
        });

        before(function (done) {
            requestHelper.sendRequest(this, '/api/local/signup', {
                method: 'post',
                cookie: this.cookie,
                type: 'form',
                data: {
                    email: 'qsdf@qsdf.fr',
                    password: 'qsdf',
                    'g-recaptcha-response': '03AHJ_VuumGMJjbAPsRZf8KVVS_KR3uNwheBf3XefbSN9RmY1wnFvpTUYM5SHAoDeodK4a8cqBElvDA3rJPEu-z18r7ZlmMF1BUbDKnZsGvJqlnv7pwFofpoSyz9ltPWgH95Opovv8Yxw1yRwWnqgpw3242sR3q-EQkoqdJIZJBOziKRrtcgHOs8cMzKnvPlO5_LCT1Xf5e3AxsHsbbPSilME2WygfMELGrbq30Kb3rOL65RVg_gsuTMqxArOa9AQHxpGTx-IzYoWpjMmmCG5S1jna73xtkIB0dQuuv-J0on7U5yspn0UBNpaVslp5xa7PEjJSAQxU6yY4D8EnC2DsqnZT6bvxLNVRVJiX6HCjYnX7BvF1PRTaxrmJrZSd5yUjLxAG_QNroSwOF_hQhBprtQkSOIdEL1FlxG9PKy4wUttq3xRpgvBewOUiVMSa-m8Zr74CpsKnmU3aANqjPjDS15LjZ4zUY-qIYVQbRcw0FjBsOFwO7nqtlBfQC4ebKSgOfh31S2qXIcEY7mCxdj9MIxyqdalLwrFogrBzrQvH9CCkNizmTno0gWtWbE-obpB_EXgQ87du2FRADpHOhGmq-ic0yPZfs27an5xJrcuCOcTLOnED_RYzLETpyJ6ckYvlRsOGyGUbr-60wiLKb8ipeQkidPtMQqwd3c7bmDtk6BcIBEdm80tj_D-1YVxUdDtVmJw99RofQyVOoP2JVun0fquw4ylp_XimetVlvfjONpbmjRiRpaPUcosu0aQwZw20VTd10WFBfqIA3LUR2bKdG_JM2ODxPUg7FMVRMHIOOL0zUwxXdHSJeH8ek-vpOhJuh3vLeG3norWT1AEBOHpdHoFvlPB08u98b0cwzgJElpETn4rAdz7ad6vJL7Gee5wR0jJcqZPIdmCMZjBC4U7REletboN5JeYvK6ZMlG43o5uNAN4GH8h5VPQ'
                }
            }, done);
        });

        it('should return a success false', function () {
            console.log('msg:' + this.res.body.msg);
            console.log('success:' + this.res.body.success);
            expect(this.res.statusCode).to.equal(400);
            expect(this.res.body.success).to.equal(false);
            expect(this.res.body.msg).to.equal("email already exists.");
        });

    });

});


// Test authenticate

describe('POST /api/local/authenticate', function () {

    context('When unauthenticated user signup with correct credential', function () {

        before(resetDatabase);

        before(function (done) {
            requestHelper.sendRequest(this, '/api/local/signup', {
                method: 'post',
                cookie: this.cookie,
                type: 'form',
                data: {
                    email: 'qsdf@qsdf.fr',
                    password: 'qsdf',
                    'g-recaptcha-response': '03AHJ_VuumGMJjbAPsRZf8KVVS_KR3uNwheBf3XefbSN9RmY1wnFvpTUYM5SHAoDeodK4a8cqBElvDA3rJPEu-z18r7ZlmMF1BUbDKnZsGvJqlnv7pwFofpoSyz9ltPWgH95Opovv8Yxw1yRwWnqgpw3242sR3q-EQkoqdJIZJBOziKRrtcgHOs8cMzKnvPlO5_LCT1Xf5e3AxsHsbbPSilME2WygfMELGrbq30Kb3rOL65RVg_gsuTMqxArOa9AQHxpGTx-IzYoWpjMmmCG5S1jna73xtkIB0dQuuv-J0on7U5yspn0UBNpaVslp5xa7PEjJSAQxU6yY4D8EnC2DsqnZT6bvxLNVRVJiX6HCjYnX7BvF1PRTaxrmJrZSd5yUjLxAG_QNroSwOF_hQhBprtQkSOIdEL1FlxG9PKy4wUttq3xRpgvBewOUiVMSa-m8Zr74CpsKnmU3aANqjPjDS15LjZ4zUY-qIYVQbRcw0FjBsOFwO7nqtlBfQC4ebKSgOfh31S2qXIcEY7mCxdj9MIxyqdalLwrFogrBzrQvH9CCkNizmTno0gWtWbE-obpB_EXgQ87du2FRADpHOhGmq-ic0yPZfs27an5xJrcuCOcTLOnED_RYzLETpyJ6ckYvlRsOGyGUbr-60wiLKb8ipeQkidPtMQqwd3c7bmDtk6BcIBEdm80tj_D-1YVxUdDtVmJw99RofQyVOoP2JVun0fquw4ylp_XimetVlvfjONpbmjRiRpaPUcosu0aQwZw20VTd10WFBfqIA3LUR2bKdG_JM2ODxPUg7FMVRMHIOOL0zUwxXdHSJeH8ek-vpOhJuh3vLeG3norWT1AEBOHpdHoFvlPB08u98b0cwzgJElpETn4rAdz7ad6vJL7Gee5wR0jJcqZPIdmCMZjBC4U7REletboN5JeYvK6ZMlG43o5uNAN4GH8h5VPQ'
                }
            }, done);
        });

        before(function (done) {
            requestHelper.sendRequest(this, '/api/local/authenticate', {
                method: 'post',
                cookie: this.cookie,
                type: 'form',
                data: {
                    email: 'qsdf@qsdf.fr',
                    password: 'qsdf'
                }
            }, done);
        });

        it('should return a success ', function () {
            console.log('success:' + this.res.body.success);
            expect(this.res.statusCode).to.equal(200);
            expect(this.res.body.success).to.equal(true);
        });
    });

    context('When unauthenticated user signup with bad credential', function () {

        before(resetDatabase);

        before(function (done) {
            requestHelper.sendRequest(this, '/api/local/signup', {
                method: 'post',
                cookie: this.cookie,
                type: 'form',
                data: {
                    email: 'qsdf@qsdf.fr',
                    password: 'qsdf',
                    'g-recaptcha-response': '03AHJ_VuumGMJjbAPsRZf8KVVS_KR3uNwheBf3XefbSN9RmY1wnFvpTUYM5SHAoDeodK4a8cqBElvDA3rJPEu-z18r7ZlmMF1BUbDKnZsGvJqlnv7pwFofpoSyz9ltPWgH95Opovv8Yxw1yRwWnqgpw3242sR3q-EQkoqdJIZJBOziKRrtcgHOs8cMzKnvPlO5_LCT1Xf5e3AxsHsbbPSilME2WygfMELGrbq30Kb3rOL65RVg_gsuTMqxArOa9AQHxpGTx-IzYoWpjMmmCG5S1jna73xtkIB0dQuuv-J0on7U5yspn0UBNpaVslp5xa7PEjJSAQxU6yY4D8EnC2DsqnZT6bvxLNVRVJiX6HCjYnX7BvF1PRTaxrmJrZSd5yUjLxAG_QNroSwOF_hQhBprtQkSOIdEL1FlxG9PKy4wUttq3xRpgvBewOUiVMSa-m8Zr74CpsKnmU3aANqjPjDS15LjZ4zUY-qIYVQbRcw0FjBsOFwO7nqtlBfQC4ebKSgOfh31S2qXIcEY7mCxdj9MIxyqdalLwrFogrBzrQvH9CCkNizmTno0gWtWbE-obpB_EXgQ87du2FRADpHOhGmq-ic0yPZfs27an5xJrcuCOcTLOnED_RYzLETpyJ6ckYvlRsOGyGUbr-60wiLKb8ipeQkidPtMQqwd3c7bmDtk6BcIBEdm80tj_D-1YVxUdDtVmJw99RofQyVOoP2JVun0fquw4ylp_XimetVlvfjONpbmjRiRpaPUcosu0aQwZw20VTd10WFBfqIA3LUR2bKdG_JM2ODxPUg7FMVRMHIOOL0zUwxXdHSJeH8ek-vpOhJuh3vLeG3norWT1AEBOHpdHoFvlPB08u98b0cwzgJElpETn4rAdz7ad6vJL7Gee5wR0jJcqZPIdmCMZjBC4U7REletboN5JeYvK6ZMlG43o5uNAN4GH8h5VPQ'
                }
            }, done);
        });

        before(function (done) {
            requestHelper.sendRequest(this, '/api/local/authenticate', {
                method: 'post',
                cookie: this.cookie,
                type: 'form',
                data: {
                    email: 'qsdf@qsdf.fr',
                    password: 'badpass'
                }
            }, done);
        });

        it('should return a success ', function () {
            console.log('success:' + this.res.body.success);
            expect(this.res.statusCode).to.equal(401);
            expect(this.res.body.success).to.equal(false);
            expect(this.res.body.msg).to.equal(INCORRECT_LOGIN_OR_PASS);
        });
    });


});