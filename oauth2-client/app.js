var express = require('express');
var path = require('path');
var passport = require('passport');

var app = express();

var httpPort = process.env.HTTP_PORT || 3001;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({extended: true}));
app.use(require('express-session')({secret: 'keyboard cat', resave: true, saveUninitialized: true}));
app.use(passport.initialize());
app.use(passport.session());

// redirect public files
app.use('/assets', express.static(__dirname + '/../oauth2-client/public'));

require('./routes/auth-code-flow')(app);
require('./routes/implicit-flow')(app);
require('./routes/resource-owner-password-flow')(app);

app.get(
	'/',
	function (req, res) {
		res.render('selection');
	}
);

app.listen(
	httpPort,
	function () {
		console.log('Example app listening on port ' + httpPort + '!');
	}
);