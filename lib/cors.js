var cors = require('cors');

var config = require('../config');

var enableCORS = function() {

  var allowedDomains = {};

  config.domains.forEach(function(domain) {
    var url = "http://" + domain.name;
    allowedDomains[url] = 1;
  });

  return cors({
    origin: function(origin, callback) {
      var isAllowed = allowedDomains.hasOwnProperty(origin);
      callback(null, isAllowed);
    },
    methods: 'POST', // 'GET,PUT,POST,DELETE,OPTIONS'
    credentials: true,
    allowedHeaders: 'Content-Type,Authorization,Content-Length,X-Requested-With'
  });
};

module.exports = enableCORS;
