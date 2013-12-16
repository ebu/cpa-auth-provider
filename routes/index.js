
/*
 * GET home page.
 */

module.exports = function (app, options) {

  app.get('/', function(req, res){
    res.render('index.ejs');
  });

}