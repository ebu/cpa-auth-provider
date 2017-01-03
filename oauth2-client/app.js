var express  = require('express');
var path     = require('path');
var authHelper = require('./lib/auth-helper');
var passport = require('passport');
var OAuth2Strategy = require('passport-oauth2');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static('public'));

app.use(function(req, res, next){
    // Add user object to the template scope if authenticated
    res.locals.user = authHelper.getAuthenticatedUser(req);
    next();
});

var request = require('request');

OAuth2Strategy.prototype.userProfile = function(accessToken, done) {
    var options = {
        url: oauth2_config.profileURL,
        headers: {
            'User-Agent': 'request',
            'Authorization': 'Bearer ' + accessToken,
        }
    };

    function callback(error, response, body) {
        if (error || response.statusCode !== 200) {
            done(error);
        }
        var info = JSON.parse(body);

        done(null, info.user);

    }

    request(options, callback);
};

var users = {};

passport.serializeUser(function(user, done) {
    //console.log('user', user);
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    done(null, users[id]);
});

var server = process.env.OAUTH2_SERVER || 'http://192.168.99.100:3000';
var serverInternal = process.env.OAUTH2_INTERNAL_SERVER;
var callbackServer = process.env.OAUTH2_CALLBACK || 'http://192.168.99.100:3001';
var httpPort = process.env.HTTP_PORT ? process.env.HTTP_PORT : 3000;

oauth2_config = {
    requestTokenURL: serverInternal + '/oauth2/request_token',
    publicTokenUrl: server + '/oauth2/token',
    tokenURL: serverInternal + '/oauth2/token',
    authorizationURL: server + '/oauth2/dialog/authorize',
    clientID: process.env.OAUTH2_CLIENT_ID,
    clientSecret: process.env.OAUTH2_CLIENT_SECRET,
    publicProfileUrl: server + '/oauth2/user_info',
    profileURL: serverInternal + '/oauth2/user_info',
    callbackURL: callbackServer + '/auth/oauth/callback'
};

passport.use('oauth2', new OAuth2Strategy(oauth2_config,
    function(token, refreshToken, profile, done) {
        //User.findOrCreate(..., function(err, user) {
        //    done(err, user);
        //});
        console.log('Profile: ', profile);
        users[profile.id] = profile;
        done(null, profile);
    }
));

app.get('/auth/oauth/callback',
    function (req,res,next){
        console.log('User:', req.user);
        next();
    },
    passport.authenticate('oauth2', { failureRedirect: '/error' }),
    function (req, res) {
        res.redirect('/protected');
    });

app.get('/protected',
    authHelper.ensureAuthenticated,
    function (req, res) {
        res.render('index', { main_content: 'Hello '+ req.user.name + '!'});
    });

app.get('/auth/oauth',
    passport.authenticate('oauth2'));

app.get('/auth/logout',
    function (req, res) {
        req.logout();
        res.redirect('/');
    });

app.get('/', function (req, res) {
    loginUrl = "/auth/oauth";
    res.render('code', { loginUrl: loginUrl, user: req.user });
});

app.get('/implicit', function (req, res) {
    redirect_uri = callbackServer + '/implicit';
    loginUrl = oauth2_config.authorizationURL + '?response_type=token&client_id=' + oauth2_config.clientID + '&redirect_uri=' + encodeURIComponent(redirect_uri);
    res.render('implicit', { loginUrl: loginUrl, profileUrl: oauth2_config.publicProfileUrl });
});

app.get(
    '/rop',
    function (req, res) {
        var ropUrl = oauth2_config.publicTokenUrl;
        res.render('rop', { ropUrl: ropUrl, profileUrl: oauth2_config.publicProfileUrl });
    }
);

app.listen(httpPort, function () {
    console.log('Example app listening on port ' + httpPort + '!');
});