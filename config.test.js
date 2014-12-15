"use strict";

module.exports = {
  identity_providers: {
    facebook: {
      enabled: false
    },
    github: {
      enabled: false
    },
    ebu: {
      enabled: false
    },
    local: {
      enabled: true
    }
  },

  db: {
    // The database type, 'mysql', 'sqlite', etc.
    type: 'sqlite',

    // Database filename for SQLite.
    // filename: 'data/test.sqlite',

    // If true, SQL statements are logged to the console.
    debug: false
  },

  // Session cookie is signed with this secret to prevent tampering
  session_secret: 'LKASDMjnr234n90lasndfsadf',

  cors: {
    enabled: true,
    allowed_domains: [
      // "http://cpa-client.example.com",
    ]
  },

  // URL path prefix, e.g., '/myapp'
  urlPrefix: '/ap',

  // The end-user verification URI on the authorization server. The URI should
  // be short and easy to remember as end-users will be asked to manually type
  // it into their user-agent.
  verification_uri: 'http://example.com/verify',

  domains: [
    {
      name:         'bbc1-cpa.ebu.io',
      display_name: 'BBC1',
      access_token: 'b4949eba147f4cf88985b43c039cd05b'
    },
    {
      name:         'bbc2-cpa.ebu.io',
      display_name: 'BBC2',
      access_token: 'b3dd734356524ef9b9ab3d03f1b1558e'
    }
  ],

  // This option controls how the authorization server responds to requests to
  // associate an existing client with a new domain:
  // - false: The user must authenticate and confirm access to the new domain
  // - true: The user is automatically granted access without confirmation
  auto_provision_tokens: false,

  // The length of time that user (pairing) codes are valid, in seconds.
  pairing_code_lifetime: 60 * 60, // 1 hour

  // The length of time that access tokens are valid, in seconds.
  access_token_lifetime: 30 * 24 * 60 * 60, // 30 days

  // The length of time that an authorization code is valid, in seconds.
  authorization_code_lifetime: 10 * 60, // 10 minutes

  // The maximum rate at which clients should poll to obtain an access token,
  // in seconds.
  max_poll_interval: 5,

  server_clients: []
};
