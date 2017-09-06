"use strict";

var ssha = require("ssha");
var sha1 = require('sha1');


var ECE = '{ECE}';

function createECEHash(secret, salt) {
    var buf, digest, hash;
    secret = new Buffer(secret);
    hash = crypto.createHash("sha1");
    hash.update(secret);
    hash.update(salt);
    digest = new Buffer(hash.digest("base64"), "base64");
    buf = bufferConcat([digest, salt]);
    return ECE + buf.toString("base64");
};

module.exports = {

    isLegacyRTSPassword: function (hash) {
        return hash.indexOf('{SSHA}') == 0 || hash.indexOf('{ECE}') == 0;
    },

    // Old hashing password method
    // salt = randomChars(8)
    // encoded = '
    // {ECE}
    // ' +
    // base64.b64encode(
    //     sha1(salt +":Profile:" + pass) + salt
    // )
    checkLegacyPassECE: function (pass, eceHash) {
        var base64, buf, salt;
        base64 = eceHash.slice(ECE.length);
        buf = new Buffer(base64, "base64");
        salt = buf.slice(20);
        return createECEHash(secret, salt) === eceHash;

    },

    // New hashing password method
    // salt = randomChars(8)
    // encoded = '
    // {SSHA}
    // ' +
    // base64(
    //     sha1(password + salt)+ salt)
    // )
    checkLegacyPassSSHA: function (passwordToCheck, sshaHash) {
        return ssha.verify(passwordToCheck, sshaHash);
    }
};