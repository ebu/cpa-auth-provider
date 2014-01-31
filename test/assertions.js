"use strict";

module.exports = {
  verifyError: function(res, statusCode, error) {
    expect(res.statusCode).to.equal(statusCode);
    expect(res.headers['content-type']).to.equal('application/json; charset=utf-8');
    expect(res.body).to.be.an('object');
    expect(res.body).to.have.property('error');
    expect(res.body.error).to.equal(error);
  }
};
