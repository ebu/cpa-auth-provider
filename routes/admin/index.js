'use strict';

var db = require('../../models');
var authHelper = require('../../lib/auth-helper');
var userHelper = require('../../lib/user-helper');
var logger = require('../../lib/logger');
var requestHelper = require('../../lib/request-helper');
var generate = require('../../lib/generate');
var xssFilters = require('xss-filters');
var csv = require('csv-string');
var permissionHelper = require('../../lib/permission-helper');
var permissionName = require('../../lib/permission-name');
var config = require('../../config');
var bcrypt = require('bcrypt');
var moment = require('moment');


module.exports = function (router) {
    router.get('/admin', [authHelper.authenticateFirst, permissionHelper.can(permissionName.ADMIN_PERMISSION)], function (req, res) {
        res.render('./admin/index.ejs');
    });


    router.get('/admin/clients', [authHelper.authenticateFirst, permissionHelper.can(permissionName.ADMIN_PERMISSION)], function (req, res) {
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

    router.get('/api/admin/clients', [authHelper.authenticateFirst, permissionHelper.can(permissionName.ADMIN_PERMISSION)], function (req, res) {
        db.OAuth2Client.findAll()
            .then(
                function (oAuth2Clients) {
                    res.send(buildJsonClients(oAuth2Clients));
                },
                function (err) {
                    res.send(500);
                    logger.debug('[Admins][get /admin/clients][error', err, ']');
                });
    });


    router.get('/api/admin/clients/:id', [authHelper.authenticateFirst, permissionHelper.can(permissionName.ADMIN_PERMISSION)], function (req, res) {
        return db.OAuth2Client.findOne({
            where: {id: req.params.id}
        }).then(
            function (client) {
                if (client) {
                    return res.send(buildJsonClient(client));
                } else {
                    return res.sendStatus(404);
                }
            });
    });


    router.post('/api/admin/clients', [authHelper.authenticateFirst, permissionHelper.can(permissionName.ADMIN_PERMISSION)], function (req, res) {

        var client = req.body;

        req.checkBody('name', req.__('API_ADMIN_CLIENT_NAME_IS_MISSING')).notEmpty();
        if (client.redirect_uri) {
            req.checkBody('redirect_uri', req.__('API_ADMIN_CLIENT_REDIRECT_URL_IS_INVALID')).isURL();
        }

        return req.getValidationResult().then(function (result) {
            if (!result.isEmpty()) {
                return res.status(400).json({errors: result.array()});
            }
            if (client.id) {
                return db.OAuth2Client.findOne({
                    where: {
                        client_id: xssFilters.inHTMLData(client.client_id),
                        $not: {id: client.id}
                    }
                }).then(function (clientInDb) {
                    if (clientInDb) {
                        return res.status(400).send({
                            success: false,
                            errors: [{msg: req.__('BACK_ADMIN_CLIENT_ID_ALREADY_EXISTS')}]
                        });
                    } else {
                        return db.OAuth2Client.findOne({where: {id: client.id}}).then(function (oAuhtClient) {
                            if (oAuhtClient) {
                                oAuhtClient.updateAttributes({
                                    name: xssFilters.inHTMLData(client.name),
                                    redirect_uri: xssFilters.inHTMLData(client.redirect_uri)
                                }).then(function () {
                                    res.json({'id': client.id});
                                });
                            } else {
                                return res.sendStatus(404);
                            }
                        });
                    }
                });
            } else {
                // Check if the client_id already exists
                return db.OAuth2Client.findOne(
                    {
                        where: {
                            client_id: xssFilters.inHTMLData(client.client_id)
                        }
                    }).then(function (clientInDb) {
                    if (clientInDb) {
                        return res.status(400).send({
                            success: false,
                            errors: [{msg: req.__('BACK_ADMIN_CLIENT_ID_ALREADY_EXISTS')}]
                        });
                    } else {
                        var secret = generate.cryptoCode(30);
                        // Hash token
                        return bcrypt.hash(secret, 5).then(
                            function (hash) {
                                return db.OAuth2Client.create({
                                    client_id: generate.clientId(),
                                    name: xssFilters.inHTMLData(client.name),
                                    redirect_uri: xssFilters.inHTMLData(client.redirect_uri),
                                    client_secret: hash
                                }).then(function (createClient) {
                                    // return generated token and client id
                                    return res.json({
                                        'secret': secret,
                                        'id': createClient.id,
                                        'client_id': createClient.client_id
                                    });
                                });
                            },
                            function (err) {
                                return res.status(500).send(err);
                            }
                        );
                    }
                });


            }

        });


    });

    router.get('/api/admin/clients/:clientId/secret', [authHelper.authenticateFirst, permissionHelper.can(permissionName.ADMIN_PERMISSION)], function (req, res) {
        db.OAuth2Client.findOne({where: {id: req.params.clientId}})
            .then(
                function (client) {
                    if (client) {
                        // Generate token
                        var secret = generate.cryptoCode(30);

                        // Hash token
                        return bcrypt.hash(secret, 5).then(
                            function (hash) {
                                // Save token
                                return client.updateAttributes(
                                    {client_secret: hash}
                                ).then(function () {
                                    // return generated token
                                    res.json({'secret': secret, 'client_id': client.client_id});
                                });
                            },
                            function (err) {
                                return res.status(500).send(err);
                            }
                        );
                    } else {
                        res.sendStatus(404);
                    }
                });
    });


    router.delete('/api/admin/clients/:id', [authHelper.authenticateFirst, permissionHelper.can(permissionName.ADMIN_PERMISSION)], function (req, res) {
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
        return db.Permission.findAll().then(function (permissions) {
            var permAdminId = -1;
            var permUserId = -2;
            for (var i = 0; i < permissions.length; i++) {
                if (permissions[i].label === permissionName.ADMIN_PERMISSION) {
                    permAdminId = permissions[i].id;
                }
                if (permissions[i].label === permissionName.USER_PERMISSION) {
                    permUserId = permissions[i].id;
                }
            }
            userHelper.getUsers(req).then(function (users) {

                return res.render('./admin/users.ejs', {
                    users: users,
                    permAdminId: permAdminId,
                    permUserId: permUserId,
                    moment: moment
                });
            }, function (err) {
                logger.debug('[Admins][get /admin/users][error', err, ']');
                return res.send(500);
            });
        });
    });

    router.get('/api/admin/users', [authHelper.ensureAuthenticated, permissionHelper.can(permissionName.ADMIN_PERMISSION)], function (req, res) {

        //Depending on countries user protection laws, set this config variable to deny access to user infos
        if (!config.displayUsersInfos) {
            return res.sendStatus(404);
        }
        userHelper.countUsers(req).then(function (count) {
            userHelper.getUsers(req).then(
                function (users) {
                    return res.status(200).json({users: userHelper.getDisplayableUser(users), count: count});
                }, function () {
                    return res.send(500);
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


    // use to return only relevant attribute to front end.
    // MUST BE USED if you don't want to return client_secret.
    function buildJsonClient(client) {
        return {
            id: client.id,
            client_id: client.client_id,
            name: client.name,
            redirect_uri: client.redirect_uri,
            created_at: client.created_at,
            updated_at: client.updated_at

        };
    }

    // use to return only relevant attribute to front end.
    // MUST BE USED if you don't want to return client_secret.
    function buildJsonClients(clients) {
        var toReturn = [];
        if (clients) {
            for (var i = 0; i < clients.length; i++) {
                toReturn.push(buildJsonClient(clients[i]));
            }
        }
        return toReturn;
    }

};
