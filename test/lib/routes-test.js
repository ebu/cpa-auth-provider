var app = require('../../lib/app');

describe('GET /', function(){
	beforeEach(function(done){
		var self = this;
		request(app).get('/').end(function(err, res){
			self.res = res;
			done();
		});
	});

	it('respond with something', function(){
		expect(this.res.statusCode).to.equal(200);
	});

	it('should respond with html content', function(){
		expect(this.res.text).to.match(/Welcome/);
	});
	
	
});
