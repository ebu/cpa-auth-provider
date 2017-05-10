"use strict";

module.exports = function (sequelize, DataTypes) {

    var Permission = sequelize.define('Permission', {
        id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
        label: {type: DataTypes.STRING, unique: true}
    }, {
        underscored: true,
        instanceMethods: {},
        associate: function (models) {
            Permission.hasMany(models.User);
        }
    });

    return Permission;
};