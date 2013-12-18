var app = require('../../lib/app');

// Test for the dynamic registration end point


describe('POST /register', function(){
  beforeEach(function(done){
    var self = this;
    request(app).post('/register').type("application/json").send("{}").end(function(err, res){
      self.res = res;
      done();
    });
  });

  context("While defining the Content-Type: ",function(){
    it('responds with ok', function(){
      request(app).post('/register').type("application/json").send("{}").end(function(err, res){
        expect(res.statusCode).to.equal(200);
      });
    });
  });
  context("Without defining the content type", function(){
    it('responds with ok', function(){
      request(app).post('/register').send("{}").end(function(err, res){
        expect(res.statusCode).to.equal(400);
      });
    });
  });

});
