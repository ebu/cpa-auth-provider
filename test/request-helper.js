"use strict";

var cheerio = require('cheerio');

var requestHelper = {};

/**
 * Send a get request and store err, res and dom ($) in context
 */

requestHelper.get = function(context, url, options, done) {
  options = options || {};

  requestHelper.getWithOptions(context, url, options, done);
};

/**
 * Send a get request and store err, res and dom ($) in context
 */

requestHelper.getWithOptions = function(context, url, options, done) {
  var req = request.get(url);

  if (options.authorization) {
    req.set('Authorization', 'Bearer '+ options.authorization);
  }

  if (options.cookie) {
    req.set('cookie', options.cookie);
  }

  req.end(function(err, res) {
    context.err = err;
    context.res = res;
    if (context.res && context.res.text) {
      context.$ = cheerio.load(context.res.text);
    }
    done(err);
  });
};

requestHelper.post = function(context, url, body, options, done) {
  var req = request.post(url);

  if (options.type) {
    req.type(options.type);
  }

  if (options.cookie) {
    req.set('cookie', options.cookie);
  }

  req.send(body).end(function(err, res) {
    context.err = err;
    context.res = res;
    if (context.res && context.res.text) {
      context.$ = cheerio.load(context.res.text);
    }
    done(err);
  });
};

requestHelper.postForm = function(context, url, options, done) {
  options.type = 'form';
  this.post(context, url, options.data, options, done);
};

requestHelper.postJSON = function(context, url, options, done) {
  options.type = 'json';
  this.post(context, url, options.data, options, done);
};

requestHelper.sendPutRequest = function(context, path, done) {
  request.put(path).end(function(err, res) {
    context.res = res;
    done(err);
  });
};

requestHelper.sendDeleteRequest = function(context, path, done) {
  request.del(path).end(function(err, res) {
    context.res = res;
    done(err);
  });
};

requestHelper.sendRequest = function(context, path, done) {
  request.get(path).end(function(err, res) {
    context.res = res;
    done(err);
  });
};
module.exports = requestHelper;
