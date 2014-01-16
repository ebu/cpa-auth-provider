"use strict";

var fs        = require('fs');
var path      = require('path');
var Sequelize = require('sequelize');
var lodash    = require('lodash');
var db        = {};
var config    = require('../config');

var sequelize = new Sequelize(config.db.database, config.db.user, config.db.password, {
  dialect: config.db.type,
  host:    config.db.host,
  port:    config.db.port,
  storage: config.db.filename,
  logging: config.db.debug ? console.log : false
});

fs.readdirSync(__dirname).filter(function(file) {
  return (file.indexOf('.') !== 0) && (file !== 'index.js');
}).forEach(function(file) {
  var model = sequelize.import(path.join(__dirname, file));
  db[model.name] = model;
});

Object.keys(db).forEach(function(modelName) {
  if (db[modelName].options.hasOwnProperty('associate')) {
    db[modelName].options.associate(db);
  }
});

module.exports = lodash.extend({ sequelize: sequelize, Sequelize: Sequelize }, db);
