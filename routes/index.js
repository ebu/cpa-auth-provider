"use strict";

var db = require('../models');

/*
 * GET home page.
 */

module.exports = function (app, options) {

  app.get('/', function(req, res) {
    res.render('index.ejs');
  });


  app.put('/user', function(req, res) {
    db.User
      .create({
        username: 'NAME',
        password: 'hello'
      })
      .complete(function(err, user) {
        if (err) {
          res.send(500);
        }
        res.send(200, user);
      });
  });
}