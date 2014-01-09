"use strict";

var appHelper = {};

appHelper.templateVariables = function(req, res, next){
  if(req.isAuthenticated()){
    res.locals.user = req.user;
  } else {
    res.locals.user = null;
  }
  next();
};

module.exports = appHelper;
