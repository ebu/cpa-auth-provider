"use strict";

module.exports = {
  identity_providers: {
    // Details : http://passportjs.org/guide/facebook/
    facebook: {
      enabled: false,
      client_id: '',
      client_secret: '',
      callback_url: ''
    },
    github: {
      enabled: true,
      client_id: '',
      client_secret: '',
      callback_url: ''
    },
    ebu: {
      enabled: false
    },
    local: {
      enabled: false
    }
  },

  db: {
    host: '',
    port: 3306,
    user: '',
    password: '',

    // The database type, 'mysql', 'sqlite', etc.
    type: '',
    database: '',

    // Database filename for SQLite.
    filename: '',

    // If true, SQL statements are logged to the console.
    debug: true
  },

  // Session cookie is signed with this secret to prevent tampering
  session_secret: 'LKASDMjnr234n90lasndfsadf',

  // Cross-origin resource sharing
  cors: {
    enabled: true,
    allowed_domains: [
      // "http://cpa-client.example.com",
    ]
  },

  // URL path prefix, e.g., '/myapp'
  urlPrefix: '',

  // The end-user verification URI on the authorization server. The URI should
  // be short and easy to remember as end-users will be asked to manually type
  // it into their user-agent.
  verification_uri: 'http://vagrant.ebu.io:3000/',

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

  server_clients : [{
    name: '',
    software_id: '',
    software_version: '',
    ip: '127.0.0.1',
    secret: '',
    registration_type: 'static',
    redirect_uri: ''
  }],

  // The length of time that user (pairing) codes are valid, in seconds.
  pairing_code_lifetime: 60 * 60, // 1 hour

  // The length of time that access tokens are valid, in seconds.
  access_token_lifetime: 24 * 60 * 60, // 1 day

  // The length of time that an authorization code is valid, in seconds.
  authorization_code_lifetime: 10 * 60, // 10 minutes

  // The maximum rate at which clients should poll to obtain an access token,
  // in seconds.
  max_poll_interval: 5
};
