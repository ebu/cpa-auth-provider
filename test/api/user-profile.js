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
            requestHelper.sendRequest(this, '/api/local/profile', {
                method: 'get',
                accessToken: accessToken.substring(4, accessToken.size),
                tokenType: 'JWT'
            }, done);
        });

        it('should return a success ', function () {
            //console.log('success:' + this.res.body.success);
            //console.log('status:' + this.res.statusCode);
            expect(this.res.statusCode).to.equal(200);
            expect(this.res.body.success).to.equal(true);
            expect(this.res.body.user_profile.firstname).to.be.undefined;
            expect(this.res.body.user_profile.lastname).to.be.undefined;
            expect(this.res.body.user_profile.gender).to.be.undefined;
            expect(this.res.body.user_profile.birthdate).to.be.undefined;
            expect(this.res.body.user_profile.email).to.equals('qsdf@qsdf.fr');
            expect(this.res.body.user_profile.display_name).to.equals('qsdf@qsdf.fr');
        });

    });

    context('When user update his profile after account creation', function () {
        var accessToken;

        cleanDbAndRegisterUser();

        var birth = new Date(Date.UTC(2012, 11, 31, 0, 0, 0)).getTime();

        before(function (done) {
            accessToken = this.res.body.token.substring(4, this.res.body.token.size);

            requestHelper.sendRequest(this, '/api/local/profile', {
                    method: 'put',
                    type: 'form',
                    data: {
                        tokenType: 'JWT',
                        firstname: 'firstname',
                        lastname: 'lastname',
                        gender: 'gender',
                        birthdate: birth
                    },
                    accessToken: accessToken,
                    tokenType: 'JWT'
                }, done
            );
        });


        it('update profile should return a success ', function () {
            //console.log('update success:' + this.res.body.success);
            //console.log('update status:' + this.res.statusCode);
            expect(this.res.statusCode).to.equal(200);
            expect(this.res.body.success).to.equal(true);
        });


        // Partial update :
        before(function (done) {
            requestHelper.sendRequest(this, '/api/local/profile', {
                    method: 'put',
                    type: 'form',
                    data: {
                        tokenType: 'JWT',
                        firstname: 'firstname2',
                        lastname: 'lastname',
                        gender: 'M',
                    },
                    accessToken: accessToken,
                    tokenType: 'JWT'
                }, done
            );
        });


        before(function (done) {
            //var accessToken = this.res.body.token;

            //console.log('accessToken : ' + accessToken);

            requestHelper.sendRequest(this, '/api/local/profile?policy=FIRSTNAME_LASTNAME', {
                method: 'get',
                accessToken: accessToken,
                tokenType: 'JWT'
            }, done);
        });

        it('get profile should return a success ', function () {
            //console.log('get profile success:' + this.res.body.success);
            //console.log('get profile status:' + this.res.statusCode);
            expect(this.res.statusCode).to.equal(200);
            expect(this.res.body.success).to.equal(true);
            expect(this.res.body.user_profile.firstname).to.equal('firstname2');
            expect(this.res.body.user_profile.lastname).to.equal('lastname');
            expect(this.res.body.user_profile.gender).to.equal('M');
            expect(this.res.body.user_profile.birthdate).to.equals(birth);
            expect(this.res.body.user_profile.email).to.equals('qsdf@qsdf.fr');
            expect(this.res.body.user_profile.display_name).to.equals('firstname2 lastname');
        });

    });




});