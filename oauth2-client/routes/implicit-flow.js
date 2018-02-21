"use strict";

module.exports = setup;

var server = process.env.OAUTH2_SERVER;
var callbackServer = process.env.OAUTH2_CALLBACK;

var options = {
    authorizationURL: server + '/oauth2/dialog/authorize',
    clientID: process.env.OAUTH2_CLIENT_ID,
    clientSecret: process.env.OAUTH2_CLIENT_SECRET,
    publicProfileUrl: server + '/oauth2/user_info'
};

function setup(router) {
    router.get(
        '/implicit',
        function (req, res) {
            var redirect_uri = callbackServer + '/implicit';
            var loginUrl = options.authorizationURL + '?response_type=token'
                + '&client_id=' + options.clientID
                + '&redirect_uri=' + encodeURIComponent(redirect_uri);
            res.render('implicit', {loginUrl: loginUrl, profileUrl: options.publicProfileUrl});
        }
    );
}
