"use strict";

var db = require('../models');

var schema = {
  id: "/authorize",
  type: "object",
  required: true,
  additionalProperties: false,
  properties: {
    response_type: {
      type: "string",
      required: true
    },
    client_id: {
      type: "string",
      required: true
    },
    redirect_uri: {
      type: "string",
      required: true
    },
    scope: {
      type:     "string",
      required: false
    },
    state: {
      type:     "string",
      required: false
    }
  }
};

var validateUri = require('../lib/validate-json')(schema, 'query');

module.exports = function(app, options) {

  /**
   * Access token authorization endpoint
   */

  app.get('/authorize', validateUri, function(req, res, next) {
    var responseType = req.query.response_type;
    var clientId     = req.query.client_id;
    var redirectUri  = req.query.redirect_uri;
    var scope        = req.query.scope;
    var state        = req.query.state;

    if (responseType !== 'code') {
      res.sendInvalidRequest("Wrong response type: 'code' required.");
    }

    // Verify redirect uri corresponds to client id

    db.Client
      .find({ where: { id: clientId } })
      .complete(function(err, client) {
        if(err || !client) {
          return res.sendInvalidRequest("Invalid client_id");
        }

        res.render('authorize.ejs', {
          client_name: client.name,
          client_id: clientId,
          redirect_uri: redirectUri,
          scope: scope,
          state: state,
          error: null
        });
      });
  });
};
