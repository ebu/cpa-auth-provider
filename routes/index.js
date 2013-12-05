
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('main.ejs', { errorMessage: 'Express' });
};