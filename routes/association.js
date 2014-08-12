"use strict";

var config          = require('../config');
var db              = require('../models');
var generate        = require('../lib/generate');
var requireEncoding = require('../lib/require-encoding');
var validator       = require('../lib/validate-json-schema');

var schema = {
  id: "/associate",
  type: "object",
  required: true,
  additionalProperties: false,
  properties: {
    client_id: {
      type:     "string",
      required: true
    },
    client_secret: {
      type:     "string",
      required: true
    },
    domain: {
      type:     "string",
      required: true
    }
  }
};

module.exports = function(app) {
  var logger = app.get('logger');

  var createError = function(status, error, description) {
    var err = new Error(description);
    err.error = error;
    err.statusCode = status;

    return err;
  };

  var handleAssociate = function(params, done) {
    var clientId     = params.clientId;
    var clientSecret = params.clientSecret;
    var domainName   = params.domain;

    db.Client.find({
      where: { id: clientId, secret: clientSecret },
      include: [ db.User ]
    })
    .complete(function(err, client) {
      if (err) {
        done(err);
        return;
      }

      if (!client) {
        err = createError(400, 'invalid_client', "Client " + clientId + " not found");
        done(err);
        return;
      }

      db.Domain.find({ where: { name: domainName }})
        .complete(function(err, domain) {
          if (err) {
            done(err);
            return;
          }

          if (!domain) {
            err = createError(400, 'invalid_request', "Domain " + domainName + " not found");
            done(err);
            return;
          }

          var pairingCode = {
            client_id:           clientId,
            domain_id:           domain.id,
            device_code:         generate.deviceCode(),
            user_code:           generate.userCode(),
            verification_uri:    config.verification_uri
          };

          if (client.user) {
            pairingCode.user_id = client.user.id;
          }

          db.PairingCode.create(pairingCode)
            .complete(function(err, pairingCode) {
              if (err) {
                done(err);
                return;
              }

              if (client.user) {
                if (config.auto_provision_tokens) {
                  // Automatically grant access
                  done(null, {
                    device_code:      pairingCode.device_code,
                    expires_in:       Math.floor(pairingCode.getTimeToLive())
                  });
                }
                else {
                  // Ask user's permission to grant access
                  done(null, {
                    device_code:      pairingCode.device_code,
                    verification_uri: pairingCode.verification_uri,
                    interval:         config.max_poll_interval,
                    expires_in:       Math.floor(pairingCode.getTimeToLive())
                  });
                }
              }
              else {
                // Must pair with user account
                done(null, {
                  device_code:      pairingCode.device_code,
                  user_code:        pairingCode.user_code,
                  verification_uri: pairingCode.verification_uri,
                  interval:         config.max_poll_interval,
                  expires_in:       Math.floor(pairingCode.getTimeToLive())
                });
              }
          });
        });
    });
  };

  /**
   * Client association endpoint
   */

  app.post(
    '/associate',
    requireEncoding('json'),
    validator.middleware(schema),
    function(req, res, next) {
      var params = {
        clientId:     req.body.client_id,
        clientSecret: req.body.client_secret,
        domain:       req.body.domain
      };

      handleAssociate(params, function(err, pairingInfo) {
        if (err) {
          if (err.statusCode) {
            res.sendErrorResponse(err.statusCode, err.error, err.message);
          }
          else {
            next(err);
          }
          return;
        }

        res.set('Cache-Control', 'no-store');
        res.set('Pragma', 'no-cache');

        res.send(200, pairingInfo);
      });
    }
  );

  /**
   * Client association endpoint
   *
   * @example
   * <code>GET /associate?domain=example.com&callback=jsonPCallback</code>
   *
   * @param {String} domain
   * @param {String} jsonPCallback JSONP callback function name
   *
   * The client should include a CPA cookie in the request containing the
   * client_id and client_secret
   */

  app.get('/associate', function(req, res, next) {
    var clientId, clientSecret;

    if (req.cookies && req.cookies.cpa) {
      clientId     = req.cookies.cpa.client_id;
      clientSecret = req.cookies.cpa.client_secret;
    }

    var params = {
      clientId:     clientId,
      clientSecret: clientSecret,
      domain:       req.query.domain
    };

    handleAssociate(params, function(err, pairingInfo) {
      if (err) {
        if (err.statusCode) {
          res.status(err.statusCode);
          res.jsonp({
            http_status:       err.statusCode,
            error:             err.error,
            error_description: err.message
          });
        }
        else {
          next(err);
        }

        return;
      }

      res.set('Cache-Control', 'no-store');
      res.set('Pragma', 'no-cache');

      pairingInfo.http_status = 200;

      res.jsonp(200, pairingInfo);
    });
  });
};
