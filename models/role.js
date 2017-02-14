"use strict";

module.exports = function (sequelize, DataTypes) {

    var Role = sequelize.define('Role', {
        id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
        label: {type: DataTypes.STRING, unique: true}
    }, {
        underscored: true,
        instanceMethods: {},
        associate: function (models) {
            Role.hasMany(models.User);
        }
    });

    return Role;
};