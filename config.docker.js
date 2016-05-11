'use strict';

module.exports = {
  identity_providers: {
    github: {
      enabled: true,
      client_id: process.env.CPA_GITHUB_CLIENT_ID,
      client_secret: process.env.CPA_GITHUB_CLIENT_SECRET,
      callback_url: '/auth/github/callback'
    }
  },

  // When accessing the home page, if defined, users are automatically
  // redirected to the specified identity_providers (ie: 'github')
  auto_idp_redirect: '',

  db: {
    // The database type, 'mysql', 'sqlite', etc.
    type: 'sqlite',

    // Database filename for SQLite.
    filename: 'data/cpa-auth-provider.sqlite',

    // If true, SQL statements are logged to the console.
    debug: true
  },

  // Session cookie is signed with this secret to prevent tampering
  session_secret: 'LKASDMjnr234n90lasndfsadf',

  // Cross-origin resource sharing
  cors: {
    enabled: true,
    allowed_domains: [
      process.env.CPA_CLIENT_URL
    ]
  },

  // URL path prefix, e.g., '/myapp'
  urlPrefix: '',

  // The end-user verification URL on the authorization server. The URI should
  // be short and easy to remember as end-users will be asked to manually type
  // it into their user-agent.
  verification_uri: process.env.CPA_VERIFICATION_URL,

  // Service provider domains to register.
  domains: [
    {
      name:         "sp:8002",
      display_name: "Example Service Provider",
      access_token: "b4949eba147f4cf88985b43c039cd05b"
    },
  ],

  oauth2_clients: [
    {
      id: 1,
      client_id: "db05acb0c6ed902e5a5b7f5ab79e7144",
      client_secret: "49b7448061fed2319168eb2449ef3b58226a9c554b3ff0b138abe8ffad98",
      name: "OAuth 2.0 Client"
    }
  ],
  // This option controls how the authorization server responds to requests to
  // associate an existing client with a new domain:
  // - false: The user must authenticate and confirm access to the new domain
  // - true: The user is automatically granted access without confirmation
  auto_provision_tokens: false,

  server_clients : [],

  // The length of time that user (pairing) codes are valid, in seconds.
  pairing_code_lifetime: 60 * 60, // 1 hour

  // The length of time that a access tokens are valid, in seconds.
  access_token_lifetime: 24 * 60 * 60, // 1 day

  // The length of time that an authorization code is valid, in seconds.
  authorization_code_lifetime: 10 * 60, // 10 minutes

  // The maximum rate at which clients should poll to obtain an access token,
  // in seconds.
  max_poll_interval: 5
};
