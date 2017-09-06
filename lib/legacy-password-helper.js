"use strict";

var ssha = require("ssha");
var sha1 = require('sha1');
var crypto = require("crypto");

var ECE = '{ECE}';
var ENCODING = "base64";


// Old hashing password method
// salt = randomChars(8)
// encoded = '{ECE}' + base64.b64encode(sha1(salt +":Profile:" + pass) + salt
var createECEHash = function (password, salt) {
    var buf, digest, hash;
    if (!salt) {
        salt = crypto.randomBytes(32);
    }
    var buf4sha1 = new Buffer(password);
    hash = crypto.createHash("sha1");
    hash.update(salt);
    hash.update(":Profile:");
    hash.update(buf4sha1);

    digest = new Buffer(hash.digest(ENCODING), ENCODING);
    buf = bufferConcat([digest, salt]);
    return ECE + buf.toString(ENCODING);
};

module.exports = {

    isLegacyRTSPassword: function (hash) {
        return hash.indexOf('{SSHA}') == 0 || hash.indexOf('{ECE}') == 0;
    },

    checkLegacyPassECE: function (passwordToCheck, eceHash) {
        var b64string = eceHash.substring(ECE.length);


        var buf = Buffer.from(b64string, 'base64');
        var salt = buf.slice(20);

        //console.log("Salt:", String.fromCharCode.apply(null, salt));

        return createECEHash(passwordToCheck, salt) === eceHash;
    },

    // New hashing password method
    // salt = randomChars(8)
    // encoded = '{SSHA}' + base64(sha1(password + salt)+ salt))
    checkLegacyPassSSHA: function (passwordToCheck, sshaHash) {
        return ssha.verify(passwordToCheck, sshaHash);
    }
};