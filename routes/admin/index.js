'use strict';

var db = require('../../models');
var authHelper = require('../../lib/auth-helper');
var logger = require('../../lib/logger');
var requestHelper = require('../../lib/request-helper');
var generate = require('../../lib/generate');
var role = require('../../lib/role');
var csv = require('csv-string');
var generate = require('../../lib/generate');
var role = require('../../lib/role');
var permission = require('../../lib/permission');
var config = require('../../config');

module.exports = function (router) {
    router.get('/admin', [authHelper.authenticateFirst, role.can(permission.ADMIN_PERMISSION)], function (req, res) {
        res.render('./admin/index.ejs');
    });

    router.get('/admin/domains', [authHelper.authenticateFirst, role.can(permission.ADMIN_PERMISSION)], function (req, res) {
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

    router.get('/admin/domains/add', [authHelper.authenticateFirst, role.can(permission.ADMIN_PERMISSION)], function (req, res) {
        res.render('./admin/add_domain.ejs');
    });

    router.post('/admin/domains', [authHelper.ensureAuthenticated, role.can(permission.ADMIN_PERMISSION)], function (req, res, next) {
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


    router.get('/admin/users', [authHelper.authenticateFirst, role.can(permission.ADMIN_PERMISSION)], function (req, res) {

        //Depending on countries user protection laws, set this config variable to deny access to user infos
        if(!config.displayUsersInfos) {
            return res.sendStatus(404);
        }

        db.Role.findAll().then(function (roles) {
            db.User.findAll().then(
                function (users) {
                    return res.render('./admin/users.ejs', {users: users, roles: roles});
                },
                function (err) {
                    res.send(500);
                    logger.debug('[Admins][get /admin/users][error', err, ']');
                });
        });
    });


    router.get('/admin/users/csv', [authHelper.authenticateFirst, role.can(permission.ADMIN_PERMISSION)], function (req, res) {

        //Depending on countries user protection laws, set this config variable to deny access to user infos
        if(!config.displayUsersInfos) {
            return res.sendStatus(404);
        }

        db.User.findAll({include: [{model: db.Role}]})
            .then(
                function (resultset) {
                    var head = ['email', 'role_id', 'role'];
                    var lines = [];
                    lines.push(head);
                    for (var i = 0; i < resultset.length; i++) {
                        var id = '';
                        var label = '';
                        if (resultset[i].Role){
                            id = resultset[i].Role.id;
                            label = resultset[i].Role.label;
                        }
                        lines.push([resultset[i].email, id, label]);
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

    router.post('/admin/users/:user_id/role', [authHelper.ensureAuthenticated, role.can(permission.ADMIN_PERMISSION)], function (req, res) {
        db.Role.findOne({where: {id: req.body.role}}).then(function (role) {
            if (!role) {
                return res.status(400).send({success: false, msg: 'wrong role id'});
            }
            db.User.findOne({where: {id: req.params.user_id}})
                .then(
                    function (user) {
                        user.updateAttributes({role_id: role.id}).then(function () {
                            return res.status(200).send({success: true, user: user});
                        });
                    });
        });


    });

};
