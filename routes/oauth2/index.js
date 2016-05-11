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


module.exports = function (router) {

    var logger = router.get('logger');

    // create OAuth 2.0 server
    var server = oauth2orize.createServer();

    // Register serialialization and deserialization functions.
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
        db.OAuth2Client.find({where: {client_id: id}}).then(function (client) {
            console.log('deserialize', client.get({plain: true}));
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
        authHelper.authenticateFirst,
        server.authorization(function (clientID, redirectURI, done) {
            db.OAuth2Client.find({where: {client_id: clientID}}).complete(function (err, client) {
                if (err) {
                    return done(err);
                }
                // WARNING: For security purposes, it is highly advisable to check that
                //          redirectURI provided by the client matches one registered with
                //          the server.  For simplicity, this example does not.  You have
                //          been warned.
                return done(null, client, redirectURI);
            });
        }),
        function (req, res) {
            res.render('oauth2/dialog', {
                transactionID: req.oauth2.transactionID,
                user: req.user,
                client: req.oauth2.client
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

    var token = [
        passport.authenticate(['oauth2-client-password'], {session: false}),
        server.token(),
        server.errorHandler()
    ];

    router.get('/oauth2/dialog/authorize', authorization);
    router.post('/oauth2/dialog/authorize/decision', decision);
    router.post('/oauth2/token', token);
};
