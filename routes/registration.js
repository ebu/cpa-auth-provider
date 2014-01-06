"use strict";

var db = require('../models');
var generate = require('../lib/generate');
var verify = require('../lib/verify');
var config = require('../config');

module.exports = function (app, options) {


// Client Registration Endpoint
// http://tools.ietf.org/html/draft-ietf-oauth-dyn-reg-14#section-3

  app.post('/register', function(req, res) {

    if (req.get('Content-Type') === "application/json") {

      var clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

      var clientSecret = generate.clientSecret(clientIp);

      // TODO: Check mandatory fields.

      var client = {
        id: null,
        secret: clientSecret,
        name: req.body.name,
        software_id: req.body.software_id,
        software_version: req.body.software_version,
        ip: clientIp
      };

      db.Client
        .create(client).complete(function(err, client) {
          if (err) {
            res.json(400, {});
          } else {

            var token = {
              token: generate.accessToken(),
              scope: db.AccessToken.scopeValues[0]
            };

            db.AccessToken.create(token).complete(function(err, accessToken) {
              if (err) {
                res.json(400, {});
              } else {
                accessToken.setClient(client);

                var response = {
                  client_id: client.dataValues.id,
                  client_secret: client.dataValues.secret,
                  registration_access_token: accessToken.dataValues.token,
                  registration_client_uri: config.uris.registration_client_uri
                };

                res.json(201, response);
              }
            });

          }
        });

    } else {
      res.json(400, {});
    }

  });

// Client Configuration Endpoint
// http://tools.ietf.org/html/draft-ietf-oauth-dyn-reg-14#section-4

  var configurationEndpoint = function(req, res, clientId) {
    if (req.headers.authorization) {

      verify.accessToken(req.headers.authorization, clientId, function(err, accessToken, client) {
        if (err || !accessToken || !client) {
          // RFC6750: http://tools.ietf.org/html/rfc6750#section-3.1
          res.setHeader('WWW-Authenticate', 'Bearer realm="' + config.realm + '",\nerror="invalid_token",\nerror_description="Unknown or expired token"');
          res.send(401);

        } else {

          var response = {
            client_id: client.dataValues.id,
            client_secret: client.dataValues.secret,
            registration_access_token: accessToken.dataValues.token,
            registration_client_uri: config.uris.registration_client_uri
          };
          res.json(response);
        }
      });

    } else {
      // RFC6750: http://tools.ietf.org/html/rfc6750#section-3.1 : request lacks any auth information
      res.setHeader('WWW-Authenticate', 'Bearer realm="' + config.realm + '"');
      res.send(401);
    }
  };

  //Client_id is given in the path
  app.get('/register/:client_id', function(req, res) {
    var clientId = req.params.client_id;
    configurationEndpoint(req, res, clientId);
  });

  //Client_id is given as a GET Parameter
  app.get('/register', function(req, res) {
    var clientId = req.query.client_id;
    configurationEndpoint(req, res, clientId);
  });

  app.put('/register', function(req, res) {
    res.send(501);
  });

  app.delete('/register', function(req, res) {
    res.send(501);
  });
}