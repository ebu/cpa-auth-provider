"use strict";


var authHelper = require('../../lib/auth-helper.js');


describe.only('GET /auth', function() {

  var self = this;

  before(function(done) {
    request
      .get('/auth')
      .end(function(err, res) {
        self.err = err;
        self.res = res;
        if (self.res.text) {
          self.$ = cheerio.load(self.res.text);
        }
        done(err);
      });
  });

  context('When requesting the list of identity provider', function() {

    it('should return a status 200', function() {
      expect(self.res.statusCode).to.equal(200);
    });

    it('should return HTML', function() {
      expect(self.res.headers['content-type']).to.equal('text/html; charset=utf-8');
    });

    describe('the response body', function() {

      it('should display links for every enabled idp', function() {

        var enabled_idp_list = authHelper.getEnabledIdentityProviders();

        for (var idp_label in enabled_idp_list) {
          var link = self.$('a.identity_provider.' + idp_label);
          expect(link.length).to.not.equal(0);

          //Clean class in order to identify disabled idp
          link.removeClass('identity_provider').addClass(idp_label);
        }
      });

      it('should display only enabled idp', function(){
        expect(self.$('a.identity_provider').length).to.equal(0);
      });

    });

  });
});
