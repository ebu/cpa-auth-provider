"use strict";

var cheerio = require('cheerio');

var requestHelper = {};

requestHelper.registerNewClientId = function(done) {
  var body = {
      client_name: 'Test client',
      software_id: 'CPA AP Test',
      software_version: '0.0.1'
    };

  request.post('/register').send(body).end(function(err, res) {
    if (err) {
      done(err, null);
    } else {
      done(null, res.body.client_id);
    }
  });
};

requestHelper.requestNewUserCode = function(done) {
  this.registerNewClientId(function(err, clientId) {
    if (err) {
      done(err, null);
    } else {
      var body = {
        client_id:     clientId,
        response_type: 'device_code'
      };

      request
        .post('/token')
        .type('form')
        .send(body)
        .end(function(err2, res) {
          if (err2) {
            done(err2);
          } else {
            done(null, res.body.user_code);
          }
        });
    }
  });
};

//Send a get request and store err, res and dom ($) in context
requestHelper.get = function(context, url, isAuthorized, done) {
  var req = request.get(url);

  if (isAuthorized) {
    requestHelper.getWithOptions(context, url, {'authorization': global.TEST_AUTHORIZATION_TOKEN}, done);
  } else {
    requestHelper.getWithOptions(context, url, {}, done);
  }
};

//Send a get request and store err, res and dom ($) in context
requestHelper.getWithOptions = function(context, url, options, done) {
  var req = request.get(url);

  if (options.authorization) {
    req.set('Authorization', 'Bearer '+ options.authorization);
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

  if(options.type) {
    req.type(options.type);
  }

  if (options.isAuthenticated) {
    req.set('Authorization', 'Bearer '+ global.TEST_AUTHORIZATION_TOKEN);
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

requestHelper.postForm = function(context, url, body, isAuthenticated, done) {
  this.post(context, url, body, {type:'form', isAuthenticated:isAuthenticated}, done);
};

requestHelper.postJSON = function(context, url, body, isAuthenticated, done) {
  this.post(context, url, body, {type:'json', isAuthenticated:isAuthenticated}, done);
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
