"use strict";

module.exports = function(app) {
  app.get('/status', function(req, res) {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.write("Authentication Provider up and running");
    res.end();
  });
};
