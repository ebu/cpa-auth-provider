"use strict";

var db = require('../models');

var verify = {};

verify.userCode = function(requestUserCode, callback) {
  db.PairingCode.find({ where: { 'user_code': requestUserCode }}).success(function(pairingCode) {
    callback(null, pairingCode);
  })
  .error(function(err) {
    callback(err, null);
  });
};

module.exports = verify;
