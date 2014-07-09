"use strict";

var url = require('url');

module.exports = {
  verifyError: function(res, statusCode, error) {
    expect(res.statusCode).to.equal(statusCode);
    expect(res.headers['content-type']).to.equal('application/json; charset=utf-8');
    expect(res.body).to.be.an('object');
    expect(res.body).to.have.property('error');
    expect(res.body.error).to.equal(error);
    expect(res.body).to.have.property('error_description');
    expect(res.body.error_description).to.not.equal('');
  },

  verifyRedirectError: function(res, error) {
    expect(res.statusCode).to.equal(302);
    expect(res.headers['content-type']).to.equal('text/plain; charset=UTF-8');
    expect(res.headers.location).to.be.a('string');

    var query = url.parse(res.headers.location, true).query;

    expect(query).to.be.an('object');
    expect(query).to.have.property('error');
    expect(query.error).to.equal(error);
    expect(query).to.have.property('error_description');
    expect(query.error_description).to.not.equal('');
  }
};
