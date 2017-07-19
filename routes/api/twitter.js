"use strict";

var db = require('../../models');
var config = require('../../config');
var requestHelper = require('../../lib/request-helper');
var request = require('request');
var jwt = require('jwt-simple');
var cors = require('../../lib/cors');


module.exports = function (app, options) {
    app.post('/api/twitter/signup', cors, function (req, res) {
        // To be implemented: this endpoint exists only for testing purpose. It has to exist otherwise there is an error when trying to display twitter logo
        res.status(501);
    });
};


