"use strict";

var requestHelper = {};


requestHelper.registerNewClientId = function(done) {
  var body = {
      client_name: 'Test client',
      software_id: 'CPA AP Test',
      software_version: '0.0.1'
    };

  request.post('/register').send(body).end(function(err, res) {
    if (err) {
      done(err, null);
    } else {
      done(null, res.body.client_id);
    }
  });
};

requestHelper.requestNewUserCode = function(done) {
  this.registerNewClientId(function(err, clientId) {
    if (err) {
      done(err, null);
    } else {
      var body = {
        client_id:     clientId,
        response_type: 'device_code'
      };

      request
        .post('/token')
        .type('form')
        .send(body)
        .end(function(err2, res) {
          if (err2) {
            done(err2);
          } else {
            done(null, res.body.user_code);
          }
        });
    }
  });
};

module.exports = requestHelper;
