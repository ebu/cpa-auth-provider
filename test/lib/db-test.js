"use strict";

var app = require('../../lib/app');
var db = require('../../models');


describe('PUT /user', function() {
  beforeEach(function(done) {
    var self = this;
    request(app).put('/user', "NAME").end(function(err, res) {
      self.res = res;
      done();
    });
  });

  it('should exist in database', function() {
    var self = this;
    var name = 'NAME';

    //expect(this.res.statusCode).to.equal(200);
    db.User
      .find({ where: { username: name } })
      .complete(function(err, user) {
        if (!!err) {
          console.log('An error occurred while searching for ' + name + '!');
        } else if (!user) {
          console.log('No user with the username ' + name + ' has been found.');
        } else {
          expect(user.username).to.equals(name);
          console.log('Hello ' + user.username + '!');
          console.log('All attributes of user:', user.values);
        }
      });
  });
});
