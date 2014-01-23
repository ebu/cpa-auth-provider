"use strict";

var db = require('../../models');
var config = require('../../config.js');
var authHelper = require('../../lib/auth-helper');

module.exports = function (app, options) {

  app.get('/user/tokens',
    authHelper.ensureAuthenticated,
    function(req, res) {
      db.ServiceAccessToken
        .findAll({include: [db.ServiceProvider]})
        .complete(function(err, tokens){
        if(err) {
          res.send(500);
          return;
        }
        res.render('./user/token_list.ejs', {'tokens': tokens});
      });

    });

};

