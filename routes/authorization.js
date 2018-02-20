"use strict";

var logger = require('../lib/logger');

var db = require('../models');

var schema = {
    id: "/authorized",
    type: "object",
    required: true,
    additionalProperties: false,
    properties: {
        access_token: {
            type: "string",
            required: true
        },
        domain: {
            type: "string",
            required: true
        }
    }
};

var validateJson = require('../lib/validate-json').middleware(schema);

module.exports = function (router, config) {
    var protectedResourceHandler =
        require('../lib/protected-resource-handler')(config, db, logger);

    /**
     * Access token authorization endpoint
     *
     * @see ETSI TS 103 407, section 9.3
     */

    router.post('/authorized', protectedResourceHandler, validateJson, function (req, res, next) {
        var accessToken = req.body.access_token;
        var domainName = req.body.domain;

        db.Domain
            .findOne({where: {name: domainName}})
            .then(function (domain) {
                if (!domain) {
                    res.sendInvalidRequest("Unknown domain: " + domainName);
                    return;
                }

                var query = {
                    token: accessToken,
                    domain_id: domain.id
                };

                db.AccessToken
                    .findOne({where: query, include: [db.User]})
                    .then(function (accessToken) {
                        if (!accessToken) {
                            res.sendErrorResponse(404, "not_found", "Unknown access token");
                            return;
                        }

                        if (accessToken.hasExpired()) {
                            res.sendErrorResponse(404, "not_found", "Access token has expired");
                            return;
                        }

                        var responseData = {
                            client_id: accessToken.client_id
                        };

                        if (accessToken.User) {
                            responseData.user_id = accessToken.User.id;
                            responseData.display_name = accessToken.User.display_name;
                            responseData.photo_url = accessToken.User.photo_url;
                        }

                        res.send(responseData);
                    }, function (err) {
                        next(err);
                    });
            }, function (err) {
                next(err);
            });
    });
};
