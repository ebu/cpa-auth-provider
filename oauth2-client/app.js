var express = require('express');
var path = require('path');
var authHelper = require('./lib/auth-helper');
var passport = require('passport');
var OAuth2Strategy = require('passport-oauth2');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({extended: true}));
app.use(require('express-session')({secret: 'keyboard cat', resave: true, saveUninitialized: true}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static('public'));

app.use(function (req, res, next) {
    // Add user object to the template scope if authenticated
    res.locals.user = authHelper.getAuthenticatedUser(req);
    next();
});

var request = require('request');

OAuth2Strategy.prototype.userProfile = function (accessToken, done) {
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

passport.serializeUser(function (user, done) {
    //console.log('user', user);
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    done(null, users[id]);
});

var server = process.env.OAUTH2_SERVER || 'http://192.168.99.100:3000';
var serverInternal = process.env.OAUTH2_INTERNAL_SERVER;
var callbackServer = process.env.OAUTH2_CALLBACK || 'http://192.168.99.100:3001';
var httpPort = process.env.HTTP_PORT ? process.env.HTTP_PORT : 3000;

var oauth2_config = {
    passReqToCallback: true,
    requestTokenURL: serverInternal + '/oauth2/request_token',
    tokenURL: serverInternal + '/oauth2/token',
    authorizationURL: server + '/oauth2/dialog/authorize',
    clientID: process.env.OAUTH2_CLIENT_ID,
    clientSecret: process.env.OAUTH2_CLIENT_SECRET,
    profileURL: serverInternal + '/oauth2/user_info',
    callbackURL: callbackServer + '/auth/oauth/callback'
};

var options = {
	publicTokenUrl: server + '/oauth2/token',
	publicProfileUrl: server + '/oauth2/user_info'
};

passport.use('oauth2', new OAuth2Strategy(oauth2_config,
    function (req, token, refreshToken, params, profile, done) {
        //User.findOrCreate(..., function(err, user) {
        //    done(err, user);
        //});
        updateSession(req.session, refreshToken, params.expires_in);
        console.log('Params:', params);
        console.log('Profile: ', profile);
        users[profile.id] = profile;
        done(null, profile);
    }
));

function updateSession(session, refreshToken, expiresIn) {
    console.log('exp', expiresIn);
    if (expiresIn) {
        session.expiresAt = Date.now() + expiresIn * 1000;
    }
    session.refreshToken = refreshToken;
}

require('./routes/auth-code-flow')(app);
require('./routes/implicit-flow')(app);
require('./routes/resource-owner-password-flow')(app);

app.get('/auth/oauth/callback',
    function (req, res, next) {
        console.log('[/auth/oauth/callback/][User', req.user, ']');
        return next();
    },
    passport.authenticate('oauth2', {failureRedirect: '/error'}),
    function (req, res) {
        res.redirect('/protected');
    });

app.get('/protected',
    authHelper.ensureAuthenticated,
    function (req, res) {
        var expiresAt = req.session.expiresAt ? new Date(req.session.expiresAt) : '';
        console.log(expiresAt, '<-', req.session.expiresAt);
        res.render('index', {
            main_content: 'Hello ' + req.user.name + '!',
            expiresAt: expiresAt,
            refreshToken: !!req.session.refreshToken
        });
    });

app.get('/auth/oauth',
    passport.authenticate('oauth2'));

app.get(
    '/auth/refresh',
    function (req, res) {

        console.log('RT', req.session.refreshToken);
        request.post(
            {
                url: oauth2_config.tokenURL,
                form: {
                    client_id: oauth2_config.clientID,
                    client_secret: oauth2_config.clientSecret,
                    grant_type: 'refresh_token',
                    refresh_token: req.session.refreshToken,
                }
            },
            function (error, response, body) {
                if (!error) {
                    try {
                        body = JSON.parse(body);
                    } catch (e) {
                    }
                    updateSession(req.session, body.refresh_token, body.expires_in);
                }
                res.redirect('/protected');
            }
        )
    }
);

app.get('/auth/logout',
    function (req, res) {
        req.logout();
        res.redirect('/');
    });

app.get(
    '/',
    function(req, res) {
        res.render('selection');
    }
);
// app.get('/', function (req, res) {
//     var loginUrl = "/auth/oauth";
//     var expiresAt = req.session.expiresAt ? new Date(new Date().getTime(req.session.expiresAt)) : '';
//     res.render('code', {
//         loginUrl: loginUrl,
//         user: req.user,
//         expiresAt: expiresAt,
//         refreshToken: req.session.refreshToken,
//     });
// });

app.get('/implicit', function (req, res) {
    var redirect_uri = callbackServer + '/implicit';
    var loginUrl = oauth2_config.authorizationURL + '?response_type=token&client_id=' + oauth2_config.clientID + '&redirect_uri=' + encodeURIComponent(redirect_uri);
    res.render('implicit', { loginUrl: loginUrl, profileUrl: options.publicProfileUrl });
});

app.get(
    '/rop',
    function (req, res) {
        var ropUrl = options.publicTokenUrl;
        res.render(
            'rop',
            {
                client_id: oauth2_config.clientID,
                client_secret: oauth2_config.clientSecret,
                ropUrl: ropUrl,
                profileUrl: options.publicProfileUrl
            }
            );
    }
);

app.listen(httpPort, function () {
    console.log('Example app listening on port ' + httpPort + '!');
});