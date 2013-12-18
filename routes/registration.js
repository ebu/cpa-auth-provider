
/*
 * GET home page.
 */

module.exports = function (app, options) {

  app.post('/register', function(req, res){

    if(req.get('Content-Type') === "application/json"){
      res.send(200);
    }
    else{
      res.send(400, 'Wrong Content-Type');
    }

  });

}