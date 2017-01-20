"use strict";

var config =     require('../../config');
var db =         require('../../models');
var authHelper = require('../../lib/auth-helper');
var fs =       require('fs');


var INCORRECT_PREVIOUS_PASS = 'The previous password is incorrect';
var USER_NOT_FOUND = 'User not found';
var SUCESS_PASS_CHANGED = 'Successfully changing password';

var routes = function (router) {
    router.get('/user/devices', authHelper.ensureAuthenticated, function (req, res, next) {
        db.Client
            .findAll({
                where: {user_id: req.user.id},
                include: [
                    db.User,
                    {model: db.AccessToken, include: [db.Domain]},
                    {model: db.PairingCode, include: [db.Domain]}
                ],
                order: [['id']]
            })
            .then(function (clients) {
                return res.render('./user/devices.ejs', {devices: clients});
            }, function (err) {
                next(err);
            });
    });

    router.get('/:broadcaster?/user/profile', authHelper.ensureAuthenticated, function (req, res, next) {
        db.User.findOne({where: {
            id: req.user.id
        }}).then(function (user) {
            if (!user) {
                return res.status(401).send({msg: 'Authentication failed. user profile not found.'});
            } else {
                db.UserProfile.findOrCreate({where: {
                    user_id: req.user.id
                }}).spread(function (profile) {
                    var tpl = './user/profile.ejs';
                    var broadcaster = req.params.broadcaster || false;
                    var brandingMode = broadcaster !== false;
                    var data = {
                        broadcaster: broadcaster,
                        brandingMode: brandingMode,
                        profile: {
                            firstname: profile.firstname,
                            lastname: profile.lastname,
                            gender: profile.gender,
                            birthdate: profile.birthdate ? parseInt(profile.birthdate) : profile.birthdate,
                            email: user.email,
                            display_name: profile.getDisplayName(user, req.query.policy)
                        }
                    };

                    if(broadcaster && fs.existsSync(__dirname + '/../../views/user/broadcaster/profile-'+broadcaster+'.ejs')) {
                        tpl = './user/broadcaster/profile-'+broadcaster+'.ejs';
                    }

                    res.render(tpl, data);
                });
            }
        }, function (err) {
            next(err);
        });
    });

    router.post('/user/:user_id/password', authHelper.ensureAuthenticated, function (req, res) {
        req.checkBody('previous_password', '"Previous Password" field  is empty').notEmpty();
        req.checkBody('password', '"New Password" field is empty').notEmpty();
        req.checkBody('confirm_password', '"Confirm Password" field is empty').notEmpty();
        req.checkBody('password', '"New Password" field does not match the confirmation password').equals(req.body.confirm_password);

        req.getValidationResult().then(function(result) {
            if (!result.isEmpty()) {
                res.status(400).json({errors: result.array()});
            } else {
                db.User.findOne({where: {
                    id: req.user.id
                }}).then(function (user) {
                    if (!user) {
                        return res.status(401).send({errors: [{msg: USER_NOT_FOUND}]});
                    } else {
                        user.verifyPassword(req.body.previous_password).then(function (isMatch) {
                            // if user is found and password is right change password
                            if (isMatch) {
                                user.setPassword(req.body.password).done(function (err, result) {
                                    res.json({msg: SUCESS_PASS_CHANGED});
                                });
                            } else {
                                res.status(401).json({errors: [{msg: INCORRECT_PREVIOUS_PASS}]});
                            }
                        });
                    }
                });
            }
        });
    });
};

module.exports = routes;
