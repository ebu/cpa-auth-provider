"use strict";

var ssha = require("ssha");
var sha1 = require('sha1');
var md5 = require('md5');
var crypto = require("crypto");

var ECE = '{ECE}';
var SSHA = '{SSHA}';
var BTQ = '{BTQ}';
var ENCODING = "base64";
var algorithms = {};

registerAlgorithm(ECE, checkLegacyPassECE);
registerAlgorithm(SSHA, checkLegacyPassSSHA);
registerAlgorithm(BTQ, checkLegacyPassBTQ);

function isLegacyRTSPassword(hash) {
    return hash.indexOf(SSHA) === 0 || hash.indexOf(ECE) === 0 || hash.indexOf(BTQ) === 0;
}


// Very old hashing password method
// salt = randomChars(2)
// encoded = '{BTQ}' + base64(md5(password + salt)+ salt))
function createBTQHash(password, salt) {
    return BTQ + new Buffer(md5(password + salt)).toString('base64');
}

function checkLegacyPassBTQ(passwordToCheck, hash, btqHash) {
    var b64string = btqHash.substring(BTQ.length);

    var buf = Buffer.from(b64string, 'base64');
    var decoded = buf.toString();
    var salt = decoded.substr(decoded.length - 2);

    return createBTQHash(passwordToCheck, salt) === btqHash;
}

// Old hashing password method
// salt = randomChars(8)
// encoded = '{ECE}' + base64.b64encode(sha1(salt +":Profile:" + pass) + salt
function createECEHash(password, salt) {
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
}

function checkLegacyPassECE(passwordToCheck, hash, eceHash) {
    var b64string = eceHash.substring(ECE.length);

    var buf = Buffer.from(b64string, 'base64');
    var salt = buf.slice(20);

    return createECEHash(passwordToCheck, salt) === eceHash;
}

// New hashing password method
// salt = randomChars(8)
// encoded = '{SSHA}' + base64(sha1(password + salt)+ salt))
function checkLegacyPassSSHA(passwordToCheck, hash, sshaHash) {
    return ssha.verify(passwordToCheck, sshaHash);
}


function bufferConcat(list, length) {
    if (!Array.isArray(list)) {
        throw new Error('Usage: Buffer.concat(list, [length])');
    }
    var i, buf;

    if (list.length === 0) {
        return new Buffer(0);
    } else if (list.length === 1) {
        return list[0];
    }

    if (typeof length !== 'number') {
        length = 0;
        for (i = 0; i < list.length; i++) {
            buf = list[i];
            length += buf.length;
        }
    }

    var buffer = new Buffer(length);
    var pos = 0;
    for (i = 0; i < list.length; i++) {
        buf = list[i];
        buf.copy(buffer, pos);
        pos += buf.length;
    }
    return buffer;
}

function registerAlgorithm(type, func) {
    algorithms[type] = function (password, hash, fullHash) {
        return new Promise(function (resolve, reject) {
            return resolve(func(password, hash, fullHash));
        });
    };
}

function getCheckFunction(type) {
    if (algorithms.hasOwnProperty(type)) {
        return algorithms[type];
    }
    return false;
}

module.exports = {
    isLegacyRTSPassword: isLegacyRTSPassword,
    checkLegacyPassBTQ: checkLegacyPassBTQ,
    checkLegacyPassECE: checkLegacyPassECE,
    checkLegacyPassSSHA: checkLegacyPassSSHA,
    getCheckFunction: getCheckFunction,
};