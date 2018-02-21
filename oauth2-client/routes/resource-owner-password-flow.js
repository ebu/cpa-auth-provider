"use strict";

module.exports = setup;


var server = process.env.OAUTH2_SERVER;

var options = {
    clientID: process.env.OAUTH2_CLIENT_ID,
    clientSecret: process.env.OAUTH2_CLIENT_SECRET,
    publicTokenUrl: server + '/oauth2/token',
    publicProfileUrl: server + '/oauth2/user_info'
};


function setup(router) {
    router.get(
        '/resource-owner-password',
        function (req, res) {
            var ropUrl = options.publicTokenUrl;
            res.render(
                'resource_owner_password',
                {
                    client_id: options.clientID,
                    client_secret: options.clientSecret,
                    ropUrl: ropUrl,
                    profileUrl: options.publicProfileUrl
                }
            );
        }
    );
}