"use strict";

var db = require('../../models');
var config = require('../../config');
var authHelper = require('../../lib/auth-helper');
var requestHelper = require('../../lib/request-helper');
var generate = require('../../lib/generate');
var oauth2orize = require('oauth2orize');
var passport = require('passport');
var ClientPasswordStrategy = require('./strategy/client-password').client_password_strategy;
var BearerStrategy = require('./strategy/bearer').bearer;
var AuthorizationCodeGrant = require('./grant/authorization-code').authorization_code;
var TokenGrant = require('./grant/token').token;
var AuthorizationCodeExchange = require('./exchange/authorization-code').authorization_code;
var ResourceOwnerPasswordCredentials = require('./exchange/resource-owner-password').token;
var RefreshToken = require('./exchange/refresh-token').issueToken;
var cors = require('cors');
var CreateUser = require('./create-user').createUser;
var logger = require('../../lib/logger');
var limiterHelper = require('../../lib/limiter-helper');

module.exports = function (router) {

    // create OAuth 2.0 server
    var server = oauth2orize.createServer();

    // Register serialization and deserialization functions.
    //
    // When a client redirects a user to user authorization endpoint, an
    // authorization transaction is initiated.  To complete the transaction, the
    // user must authenticate and approve the authorization request.  Because this
    // may involve multiple HTTP request/response exchanges, the transaction is
    // stored in the session.
    //
    // An application must supply serialization functions, which determine how the
    // client object is serialized into the session.  Typically this will be a
    // simple matter of serializing the client's ID, and deserializing by finding
    // the client by ID from the database.

    server.serializeClient(function (client, done) {
        return done(null, client.client_id);
    });

    server.deserializeClient(function (id, done) {
        db.OAuth2Client.findOne({where: {client_id: id}}).then(function (client) {
            logger.debug('deserialize', client.get({plain: true}));
            return done(null, client);
        }).catch(done);
    });

    passport.use(ClientPasswordStrategy);

    // BearerStrategy
    //
    // This strategy is used to authenticate either users or clients based on an access token
    // (aka a bearer token).  If a user, they must have previously authorized a client
    // application, which is issued an access token to make requests on behalf of
    // the authorizing user.

    passport.use(BearerStrategy);

    // Register supported grant types.
    //
    // OAuth 2.0 specifies a framework that allows users to grant client
    // applications limited access to their protected resources.  It does this
    // through a process of the user granting access, and the client exchanging
    // the grant for an access token.

    // Grant authorization codes.  The callback takes the `client` requesting
    // authorization, the `redirectURI` (which is used as a verifier in the
    // subsequent exchange), the authenticated `user` granting access, and
    // their response, which contains approved scope, duration, etc. as parsed by
    // the application.  The application issues a code, which is bound to these
    // values, and will be exchanged for an access token.

    server.grant(oauth2orize.grant.code(AuthorizationCodeGrant));

    server.grant(oauth2orize.grant.token(TokenGrant));

    server.exchange(oauth2orize.exchange.code(AuthorizationCodeExchange));

    server.exchange(oauth2orize.exchange.password(ResourceOwnerPasswordCredentials));

    server.exchange(oauth2orize.exchange.refreshToken(RefreshToken));

    // user authorization endpoint
    //
    // `authorization` middleware accepts a `validate` callback which is
    // responsible for validating the client making the authorization request.  In
    // doing so, is recommended that the `redirectURI` be checked against a
    // registered value, although security requirements may vary accross
    // implementations.  Once validated, the `done` callback must be invoked with
    // a `client` instance, as well as the `redirectURI` to which the user will be
    // redirected after an authorization decision is obtained.
    //
    // This middleware simply initializes a new authorization transaction.  It is
    // the application's responsibility to authenticate the user and render a dialog
    // to obtain their approval (displaying details about the client requesting
    // authorization).  We accomplish that here by routing through `ensureLoggedIn()`
    // first, and rendering the `dialog` view.

    var authorization = [
        server.authorization(function (clientID, redirectURI, done) {
            db.OAuth2Client.findOne({where: {client_id: clientID}}).then(function (client) {
                if (!client) {
                    return done(new Error('unknown client' + clientID));
                }
                // WARNING: For security purposes, it is highly advisable to check that
                //          redirectURI provided by the client matches one registered with
                //          the server.  For simplicity, this example does not.  You have
                //          been warned.
                if (client.mayRedirect(redirectURI)) {
                    return done(null, client, redirectURI);
                }
                if (logger && typeof(logger.error) == 'function') {
                    logger.error('client', client.id, 'not allowed with redirection', redirectURI);
                }
                return done(new Error('bad redirection'));
            }, function (err) {
                return done(err);
            });
        }),
        authHelper.authenticateFirst,
        function (req, res) {
            var renderer = 'oauth2/dialog';
            if (req.query.client_id === "db05acb0c6ed902e5a5b7f5ab79e7144") {
                renderer = 'broadcaster/boutique-rts/oauth-dialog';
            }
            res.render(renderer, {
                transactionID: req.oauth2.transactionID,
                user: req.user,
                email: req.user.LocalLogin ? req.user.LocalLogin.login : "",
                client: req.oauth2.client,
                customMessage: config.broadcaster && config.broadcaster.oauth ? config.broadcaster.oauth.customMessage : undefined
            });
        }
    ];

    // user decision endpoint
    //
    // `decision` middleware processes a user's decision to allow or deny access
    // requested by a client application.  Based on the grant type requested by the
    // client, the above grant middleware configured above will be invoked to send
    // a response.

    var decision = [
        authHelper.authenticateFirst,
        server.decision()
    ];

    // token endpoint
    //
    // `token` middleware handles client requests to exchange authorization grants
    // for access tokens.  Based on the grant type being exchanged, the above
    // exchange middleware will be invoked to handle the request.  Clients must
    // authenticate when making requests to this endpoint.

    var cors_header = cors(corsOptionsDelegate);
    var token = [
        passport.authenticate(['oauth2-client-password'], {session: false}),
        cors_header,
        server.token(),
        server.errorHandler()
    ];

    var easyToken = [
        confirmOAuth2Client,
        cors_header,
        server.token(),
        server.errorHandler()
    ];

    var createUser = [
        limiterHelper.verify,
        confirmOAuth2Client,
        cors_header,
        CreateUser
    ];


    router.get('/oauth2/dialog/authorize', authorization);
    router.post('/oauth2/dialog/authorize/decision', decision);
    router.post('/oauth2/token', token);
    router.post('/oauth2/create', createUser);
    router.options('/oauth2/token', cors_header);

    router.options('/oauth2/login', cors_header);
    router.post('/oauth2/login', easyToken);

    function corsOptionsDelegate(req, callback) {
        var options;
        var origin = req.get('origin');
        // TODO only allow a selected group of pages to use this with CORS!
        // MUST also require https!
        if (origin == 'http://localhost:3001') {
            options = {origin: true};
        } else {
            options = {origin: true};
        }
        return callback(null, options);
    }

    /**
     * Most basic oauth2 confirmation of client_id. Merely confirm the client_id
     * is known to the service. client_secret is not required.
     */
    function confirmOAuth2Client(req, res, next) {
        var clientId = req.body.client_id;

        db.OAuth2Client.find({where: {client_id: clientId}}).then(
            function (client) {
                if (client) {
                    req.user = client;
                    return next();
                } else {
                    return res.status(400).json({error: 'invalid_client', error_description: 'client not found'});
                }
            },
            function (err) {
                return next(err);
            }
        );
    }

};