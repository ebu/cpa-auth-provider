"use strict";

var requestHelper = require('../request-helper');


describe('Social login using oauth without client id', function () {
    describe('with facebook', function () {

        before(function (done) {
            requestHelper.sendRequest(
                this,
                '/oauth/facebook/signup',
                {
                    method: 'post'
                },
                done
            );
        });

        it('should redirect to /ap/ 200 OK', function () {
            expect(this.res.statusCode).equal(400);
            expect(this.res.text).equal("{\"error\":\"Missing client id\"}");
        });
    });
    describe('with google', function () {

        before(function (done) {
            requestHelper.sendRequest(
                this,
                '/oauth/google/signup',
                {
                    method: 'post'
                },
                done
            );
        });

        it('should redirect to /ap/ 200 OK', function () {
            expect(this.res.statusCode).equal(400);
            expect(this.res.text).equal("{\"error\":\"Missing client id\"}");
        });
    });
});




