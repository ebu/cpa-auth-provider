"use strict";

var pwQuality = require('../../lib/password-quality');

describe("password-quality", function () {
    it("should fail on empty password", function () {
        var result = pwQuality.getQuality('');

        expect(result.value).lessThan(1);
        // expect(result.error).ok();
    });

    it("should accept a good password", function () {
        var result = pwQuality.getQuality('SensiblyLongPasswordWithExtraLettersForEmphasis');

        expect(result.value).least(1);
        // expect(result.error).not.ok();
    });
});
