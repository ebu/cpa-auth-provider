'use strict';

var db = require('../../models');
var authHelper = require('../../lib/auth-helper');
var logger = require('../../lib/logger');
var requestHelper = require('../../lib/request-helper');
var generate = require('../../lib/generate');
var csv = require('csv-string');
var generate = require('../../lib/generate');
var permissionHelper = require('../../lib/permission-helper');
var permissionName = require('../../lib/permission-name');
var config = require('../../config');
var promise = require('bluebird');
var bcrypt = promise.promisifyAll(require('bcrypt'));
var generate = require('../../lib/generate');


module.exports = function (router) {
    router.get('/admin', [authHelper.authenticateFirst, permissionHelper.can(permissionName.ADMIN_PERMISSION)], function (req, res) {
        res.render('./admin/index.ejs');
    });


    router.get('/admin/clients/all', [authHelper.authenticateFirst, permissionHelper.can(permissionName.ADMIN_PERMISSION)], function (req, res) {
        return db.OAuth2Client.findAll()
            .then(
                function (oAuth2Clients) {
                    return res.render('./admin/clients.ejs', {oAuth2Clients: oAuth2Clients});
                },
                function (err) {
                    logger.debug('[Admins][get /admin/clients/all][error', err, ']');
                    return res.send(500);
                });
    });

    router.get('/admin/clients', [authHelper.authenticateFirst, permissionHelper.can(permissionName.ADMIN_PERMISSION)], function (req, res) {
        db.OAuth2Client.findAll()
            .then(
                function (oAuth2Clients) {
                    res.send(oAuth2Clients);
                },
                function (err) {
                    res.send(500);
                    logger.debug('[Admins][get /admin/clients][error', err, ']');
                });
    });

    router.get('/admin/clients/:id', [authHelper.authenticateFirst, permissionHelper.can(permissionName.ADMIN_PERMISSION)], function (req, res) {
        return db.OAuth2Client.findOne({
            id: req.params.id
        }).then(
            function (client) {
                if (client) {
                    return res.send(client);
                } else {
                    return res.sendStatus(404);
                }
            });
    });


    router.post('/admin/clients', [authHelper.authenticateFirst, permissionHelper.can(permissionName.ADMIN_PERMISSION)], function (req, res) {

        var client = req.body;

        req.checkBody('client_id', req.__('API_ADMIN_CLIENT_CLIENT_ID_IS_MISSING')).notEmpty().isString();
        req.checkBody('name', req.__('API_ADMIN_CLIENT_NAME_IS_MISSING')).notEmpty().isString();
        if (client.redirect_uri) {
            req.checkBody('redirect_uri', req.__('API_ADMIN_CLIENT_REDIRECT_URL_IS_INVALID')).isURL();
        }

        return req.getValidationResult().then(function (result) {
            if (!result.isEmpty()) {
                return res.status(400).json({errors: result.array()});
            }
            if (client.id) {
                return db.OAuth2Client.findOne({where: {id: client.id}}).then(function (oAuhtClient) {
                    if (oAuhtClient) {
                        oAuhtClient.updateAttributes({
                            client_id: client.client_id,
                            name: client.name,
                            redirect_uri: client.redirect_uri
                        }).then(function () {
                            return res.sendStatus(200);
                        });
                    } else {
                        return res.sendStatus(404);
                    }
                });
            } else {
                var secret = generate.cryptoCode(30);

                // Hash token
                return bcrypt.hash(
                    secret,
                    5,
                    function (err, hash) {
                        if (err) {
                            return res.status(500).send(err);
                        } else {
                            // Save token
                            client.client_secret = hash;
                            return db.OAuth2Client.create(client
                            ).then(function () {
                                // return generated token
                                res.json(secret);
                            });
                        }
                    });
            }

        });


    });

    router.get('/admin/clients/:clientId/secret', [authHelper.authenticateFirst, permissionHelper.can(permissionName.ADMIN_PERMISSION)], function (req, res) {
        db.OAuth2Client.findOne({where: {id: req.params.clientId}})
            .then(
                function (client) {
                    if (client) {
                        // Generate token
                        var secret = generate.cryptoCode(30);

                        // Hash token
                        return bcrypt.hash(
                            secret,
                            5,
                            function (err, hash) {
                                if (err) {
                                    return res.status(500).send(err);
                                } else {
                                    // Save token
                                    return client.updateAttributes(
                                        {client_secret: hash}
                                    ).then(function () {
                                        // return generated token
                                        res.json(secret);
                                    });
                                }
                            });
                    } else {
                        res.sendStatus(404);
                    }
                });
    });


    router.delete('/admin/clients/:id', [authHelper.authenticateFirst, permissionHelper.can(permissionName.ADMIN_PERMISSION)], function (req, res) {
        db.OAuth2Client.destroy({where: {id: req.params.id}})
            .then(
                function () {
                    res.sendStatus(200);
                });
    });


    router.get('/admin/domains', [authHelper.authenticateFirst, permissionHelper.can(permissionName.ADMIN_PERMISSION)], function (req, res) {
        db.Domain.findAll()
            .then(
                function (domains) {
                    res.render('./admin/domains.ejs', {domains: domains});
                },
                function (err) {
                    res.send(500);
                    logger.debug('[Admins][get /admin/domains][error', err, ']');
                });
    });

    router.get('/admin/domains/add', [authHelper.authenticateFirst, permissionHelper.can(permissionName.ADMIN_PERMISSION)], function (req, res) {
        res.render('./admin/add_domain.ejs');
    });

    router.post('/admin/domains', [authHelper.ensureAuthenticated, permissionHelper.can(permissionName.ADMIN_PERMISSION)], function (req, res, next) {
        var domain = {
            name: req.body.name,
            display_name: req.body.display_name,
            access_token: generate.accessToken()
        };

        db.Domain.create(domain)
            .then(
                function (domain) {
                    requestHelper.redirect(res, '/admin/domains');
                },
                function (err) {
                    // TODO: Report validation errors to the user.
                    res.render('./admin/add_domain.ejs');
                    logger.debug('[Admins][post /admin/domains][err', err, ']');
                });
    });


    router.get('/admin/users', [authHelper.authenticateFirst, permissionHelper.can(permissionName.ADMIN_PERMISSION)], function (req, res) {

        //Depending on countries user protection laws, set this config variable to deny access to user infos
        if (!config.displayUsersInfos) {
            return res.sendStatus(404);
        }

        db.Permission.findAll().then(function (permissions) {
            db.User.findAll().then(
                function (users) {
                    return res.render('./admin/users.ejs', {users: users, permissions: permissions});
                },
                function (err) {
                    res.send(500);
                    logger.debug('[Admins][get /admin/users][error', err, ']');
                });
        });
    });


    router.get('/admin/users/csv', [authHelper.authenticateFirst, permissionHelper.can(permissionName.ADMIN_PERMISSION)], function (req, res) {

        //Depending on countries user protection laws, set this config variable to deny access to user infos
        if (!config.displayUsersInfos) {
            return res.sendStatus(404);
        }

        db.User.findAll({include: [{model: db.Permission}]})
            .then(
                function (resultset) {
                    var head = ['email', 'permission_id', 'permission', 'created', 'password_changed', 'last_login'];
                    var lines = [];
                    lines.push(head);
                    for (var i = 0; i < resultset.length; i++) {
                        var id = '';
                        var label = '';
                        if (resultset[i].Permission) {
                            id = resultset[i].Permission.id;
                            label = resultset[i].Permission.label;
                        }
                        var createdAt = resultset[i].created_at;
                        var passwordChangedAt = new Date(resultset[i].password_changed_at);
                        var lastLoginAt = resultset[i].last_login_at ? new Date(resultset[i].last_login_at) : '';
                        lines.push([resultset[i].email, id, label, createdAt, passwordChangedAt, lastLoginAt]);
                    }

                    var toDownload = csv.stringify(lines);

                    res.setHeader('Content-disposition', 'attachment; filename=users.csv');
                    res.setHeader('Content-type', 'text/csv');
                    return res.send(toDownload);
                },
                function (err) {
                    res.send(500);
                    logger.debug('[Admins][get /admin/users/csv][error', err, ']');
                });

    });

    router.post('/admin/users/:user_id/permission', [authHelper.ensureAuthenticated, permissionHelper.can(permissionName.ADMIN_PERMISSION)], function (req, res) {
        db.Permission.findOne({where: {id: req.body.permission}}).then(function (permission) {
            if (!permission) {
                return res.status(400).send({
                    success: false,
                    msg: req.__('BACK_ADMIN_SET_USER_PERMISSION_WRONG_PERMISSION_ID')
                });
            }
            db.User.findOne({where: {id: req.params.user_id}})
                .then(
                    function (user) {
                        user.updateAttributes({permission_id: permission.id}).then(function () {
                            return res.status(200).send({success: true, user: user});
                        });
                    });
        });


    });

};
