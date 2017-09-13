"use strict";

var legacyPasswordHelper = require('../../lib/legacy-password-helper');
var assert = require("assert");

var _12345678_HASHED_PASSWORD = '{SSHA}/JMI1ltVoJXNjsHdusjCnRBZNF24qLBfRguY7g==';

describe("Test legacy password ", function () {
    describe("Verify legacy password (SSHA)", function () {
        describe("When password is correct", function () {
            assert(legacyPasswordHelper.checkLegacyPassSSHA('12345678', _12345678_HASHED_PASSWORD));
        });
        describe("When password is wrong", function () {
            assert(!legacyPasswordHelper.checkLegacyPassSSHA('wrong password', _12345678_HASHED_PASSWORD));
        });
    });
    describe("Check if password is legacy", function () {
        describe("with a {SSHA} password", function () {
            assert(legacyPasswordHelper.isLegacyRTSPassword(_12345678_HASHED_PASSWORD));
        });
        describe("with a {ECE} password", function () {
            assert(legacyPasswordHelper.isLegacyRTSPassword('{ECE}123456789098765432'));
        });
        describe("with a none legacy password", function () {
            assert(!legacyPasswordHelper.isLegacyRTSPassword('$2a$10$dNxp75AvhHJW6SG24bcUtewFNvwhruxxkMASOB1kknfnb/yVpLTym'));
        });
    });
});
