"use strict";

var legacyPasswordHelper = require('../../lib/legacy-password-helper');
var assert = require("assert");

var _12345678_HASHED_PASSWORD_HASH_ONLY = '/JMI1ltVoJXNjsHdusjCnRBZNF24qLBfRguY7g==';
var _12345678_HASHED_PASSWORD = '{SSHA}' + _12345678_HASHED_PASSWORD_HASH_ONLY;

var ECE_HASHED_PASSWORD_HASH_ONLY = 'oYj09hRiZHtqvM+c+kSQCmt1duBydHMubXVsdGltZWRpYUBnbWFpbC5jb20=';
var ECE_HASHED_PASSWORD = '{ECE}' + ECE_HASHED_PASSWORD_HASH_ONLY;

var BTQ_HASHED_PASSWORD_HASH_ONLY = 'IlDvAV1854OXaJPE8mTGKzAB';
var BTQ_HASHED_PASSWORD = '{BTQ}' + BTQ_HASHED_PASSWORD_HASH_ONLY;


describe("Test legacy password ", function () {
    describe("Verify legacy password (SSHA)", function () {
        describe("When password is correct", function () {
            assert(legacyPasswordHelper.checkLegacyPassSSHA('12345678', _12345678_HASHED_PASSWORD_HASH_ONLY, _12345678_HASHED_PASSWORD));
        });
        describe("When password is wrong", function () {
            assert(!legacyPasswordHelper.checkLegacyPassSSHA('wrong password', _12345678_HASHED_PASSWORD_HASH_ONLY, _12345678_HASHED_PASSWORD));
        });
    });
    describe("Verify legacy password (ECE)", function () {
        describe("When password is correct", function () {
            assert(legacyPasswordHelper.checkLegacyPassECE('OSZmh4ZqZTip', ECE_HASHED_PASSWORD_HASH_ONLY, ECE_HASHED_PASSWORD));
        });
        describe("When password is wrong", function () {
            assert(!legacyPasswordHelper.checkLegacyPassECE('wrong pass', ECE_HASHED_PASSWORD_HASH_ONLY, ECE_HASHED_PASSWORD));
        });

    });
    describe("Verify legacy password (BTQ)", function () {
        describe("When password is correct", function () {
            assert(legacyPasswordHelper.checkLegacyPassBTQ('12345678', BTQ_HASHED_PASSWORD_HASH_ONLY, BTQ_HASHED_PASSWORD));
        });
        describe("When password is correct", function () {
            assert(legacyPasswordHelper.checkLegacyPassBTQ('thisisatest', "lgbo+yiXpY6VuaaIY6WwwPeB", "{BTQ}lgbo+yiXpY6VuaaIY6WwwPeB"));
        });
        describe("When password is correct", function () {
            assert(legacyPasswordHelper.checkLegacyPassBTQ('coucou', "gADTlcY8qrAQDuXrFFkGO5CO", "{BTQ}gADTlcY8qrAQDuXrFFkGO5CO"));
        });
        describe("When password is wrong", function () {
            assert(!legacyPasswordHelper.checkLegacyPassBTQ('wrong pass', BTQ_HASHED_PASSWORD_HASH_ONLY, BTQ_HASHED_PASSWORD));
        });

    });
    describe("Check if password is legacy", function () {
        describe("with a {SSHA} password", function () {
            assert(legacyPasswordHelper.isLegacyRTSPassword(_12345678_HASHED_PASSWORD));
        });
        describe("with a {ECE} password", function () {
            assert(legacyPasswordHelper.isLegacyRTSPassword('{ECE}123456789098765432'));
        });
        describe("with a {BTQ} password", function () {
            assert(legacyPasswordHelper.isLegacyRTSPassword('{BTQ}cvcJ0S2vucKqf2YNHFuBvDE5'));
        });
        describe("with a none legacy password", function () {
            assert(!legacyPasswordHelper.isLegacyRTSPassword('$2a$10$dNxp75AvhHJW6SG24bcUtewFNvwhruxxkMASOB1kknfnb/yVpLTym'));
        });
    });
});
