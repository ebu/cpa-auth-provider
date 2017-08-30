"use strict";

var config = require('../config');

module.exports = function (sequelize, DataTypes) {

    var ValidationCode = sequelize.define('ValidationCode', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        date: {
            type: DataTypes.BIGINT,
            validate: {
                notEmpty: true
            }
        },
        value: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: true
            }
        },
        type: {
            type: DataTypes.ENUM,
            values: ['email', 'account'],
            defaultValue: 'email',
            validate: {
                notEmpty: true
            }
        }
    }, {
        underscored: true,

        associate: function (models) {
            ValidationCode.belongsTo(models.User);
        }
    });

    return ValidationCode;
};
