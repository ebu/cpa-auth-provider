'use strict';

var db = require('../../models');
var authHelper = require('../../lib/auth-helper');
var logger = require('../../lib/logger');
var requestHelper = require('../../lib/request-helper');
var generate = require('../../lib/generate');
var role = require('../../lib/role');
var csv = require('csv-string');

module.exports = function (router) {
    router.get('/admin', [authHelper.authenticateFirst, role.can('access admin page')], function (req, res) {
        res.render('./admin/index.ejs');
    });

    router.get('/admin/domains', [authHelper.authenticateFirst, role.can('access admin page')], function (req, res) {
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

    router.get('/admin/domains/add', [authHelper.authenticateFirst, role.can('access admin page')], function (req, res) {
        res.render('./admin/add_domain.ejs');
    });

    router.post('/admin/domains', [authHelper.authenticateFirst, role.can('access admin page')], function (req, res, next) {
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


    router.get('/admin/users', [authHelper.authenticateFirst, role.can('access admin page')], function (req, res) {
        db.User.findAll()
            .then(
                function (users) {
                    return res.render('./admin/users.ejs', {users: users});
                },
                function (err) {
                    res.send(500);
                    logger.debug('[Admins][get /admin/users][error', err, ']');
                });
    });


    router.get('/admin/users/csv', [authHelper.authenticateFirst, role.can('access admin page')], function (req, res) {
        db.User.findAll()
            .then(
                function (resultset) {
                    var head = ['email', 'admin'];
                    var lines = [];
                    lines.push(head);
                    for (var i = 0; i < resultset.length; i++) {
                        lines.push([resultset[i].email, resultset[i].isAdmin()]);
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

    router.post('/admin/users/:user_id/grant', [authHelper.authenticateFirst, role.can('access admin page')], function (req, res) {
        db.User.findOne({where: {id: req.params.user_id}})
            .then(
                function (user) {
                    user.grantAdmin().then(function () {
                        return res.status(200).send({success: true, user: user, admin: user.isAdmin()});
                    });
                });
    });


    router.post('/admin/users/:user_id/ungrant', [authHelper.authenticateFirst, role.can('access admin page')], function (req, res) {
        db.User.findOne({where: {id: req.params.user_id}})
            .then(
                function (user) {
                    user.ungrantAdmin().then(function (user) {
                        return res.status(200).send({success: true, user: user, admin: user.isAdmin()});
                    });
                });
    });

};
