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

// Test get profile after account creation

describe('GET /api/local/profile', function () {

    function cleanDbAndRegisterUser() {
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
    }

    context('When user request his profile after account creation', function () {

        cleanDbAndRegisterUser();

        before(function (done) {
            var accessToken = this.res.body.token;
            //console.log("token:" + accessToken);
            requestHelper.sendRequest(this, '/api/local/profile', {
                method: 'get',
                accessToken: accessToken.substring(4, accessToken.size),
                tokenType: 'JWT'
            }, done);
        });

        it('should return a success ', function () {

            console.log('success:' + this.res.body.success);
            console.log('status:' + this.res.statusCode);
            expect(this.res.statusCode).to.equal(200);
            expect(this.res.body.success).to.equal(true);
            expect(this.res.body.user_profile).to.equal(true);
            expect(this.res.body.user_profile.firstname).to.be.undefined;
            expect(this.res.body.user_profile.lastname).to.be.undefined;
            expect(this.res.body.user_profile.gender).to.be.undefined;
            expect(this.res.body.user_profile.birthdate).to.be.undefined;
        });

    });

    context('When user update his profile after account creation', function () {

        cleanDbAndRegisterUser();

        before(function (done) {
            var accessToken = this.res.body.token;

            var data = {
                accessToken: accessToken.substring(4, accessToken.size),
                tokenType: 'JWT',
                firstname: 'example-service.bbc.co.uk',
                lastname: 'example-service.bbc.co.uk',
                gender: 'example-service.bbc.co.uk'
            };

            //TODO : birthdate: 'example-service.bbc.co.uk'

            requestHelper.sendRequest(this, '/api/local/profile', {
                    method: 'post',
                    type: 'json',
                    data: data,
                    accessToken: accessToken,
                    tokenType: 'JWT'
                }, done
            )
            ;
        });

        before(function (done) {
            var accessToken = this.res.body.token;
            requestHelper.sendRequest(this, '/api/local/profile', {
                method: 'get',
                accessToken: accessToken.substring(4, accessToken.size),
                tokenType: 'JWT'
            }, done);
        });

        it('should return a success ', function () {
            console.log('success:' + this.res.body.success);
            console.log('status:' + this.res.statusCode);
            expect(this.res.statusCode).to.equal(200);
            expect(this.res.body.success).to.equal(true);
            expect(this.res.body.user_profile).to.equal(true);
            expect(this.res.body.user_profile.firstname).to.equal('firstname');
            expect(this.res.body.user_profile.lastname).to.equal('lastname');
            expect(this.res.body.user_profile.gender).to.equal('gender');
            //expect(this.res.body.user_profile.birthdate).to.equal('todo');
        });

    });


    //TODO test partial update


});