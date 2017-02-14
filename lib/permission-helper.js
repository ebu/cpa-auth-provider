"use strict";

var db = require('../models');
var permisssion = require('./permission');

var permissionHelper = {};

// This code interface is ready to support permission whereas the model is not

permissionHelper.hasPermission = function (user, permission) {
    db.Role.findOne({where: {id: user.role_id}}).then(function (role) {
        return role.label === permission;
    });
};

permissionHelper.grantPermission = function (user, persmission) {
    db.Role.findOne({where: {label: persmission}}).then(function (role) {
        return user.updateAttributes({role_id: role.id});
    });
};

permissionHelper.ungrantPermission = function (user, persmission) {
    db.Role.findOne({where: {label: persmission}}).then(function (role) {
        if (role && user.role_id === role.id){
            user.role_id = null;
            return user.save();
        } else {
            return false;
        }
    });
};

module.exports = permissionHelper;
