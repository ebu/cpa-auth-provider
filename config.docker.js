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
      enabled: process.env.CPA_GITHUB_CLIENT_ID | false,
      client_id: process.env.CPA_GITHUB_CLIENT_ID,
      client_secret: process.env.CPA_GITHUB_CLIENT_SECRET,
      callback_url: ''
    },
    ebu: {
      enabled: false
    },
    local: {
      enabled: true
    }
  },

  trackingCookie: {
    enabled: true,
    secret: 'HighWaterTurnsOff',
    duration: 10 * 365 * 24 * 60 * 60 * 1000 // 10 years
  },

  recaptcha: {
    site_key: process.env.RECAPTCHA_SITEKEY,
    secret_key: process.env.RECAPTCHA_SECRETKEY
  },

  jwtSecret: process.env.JWT_SECRET,
  jwt: {
    audience: 'cpa',
    issuer: 'cpa'
  },

  // When accessing the home page, if defined, users are automatically
  // redirected to the specified identity_providers (ie: 'github')
  auto_idp_redirect: '',

  db: {
    host: '',
    port: 3306,
    user: '',
    password: '',

    // The database type, 'mysql', 'sqlite', etc.
    type: 'sqlite',

    // Database filename for SQLite.
    filename: 'database.sqlite',

    // If true, SQL statements are logged to the console.
    debug: true
  },

  // Session cookie is signed with this secret to prevent tampering
  session_secret: process.env.SESSION_SECRET,

  // Cross-origin resource sharing
  cors: {
    enabled: true,
    allowed_domains: [
      process.env.CPA_CLIENT_URL
    ]
  },

  // URL path prefix, e.g., '/myapp'
  urlPrefix: '',

  // The end-user verification URI on the authorization server. The URI should
  // be short and easy to remember as end-users will be asked to manually type
  // it into their user-agent.
  verification_uri: process.env.CPA_VERIFICATION_URL,

  domains: [
    //{
    //  name:         'bbc1-cpa.ebu.io',
    //  display_name: 'BBC1',
    //  access_token: 'b4949eba147f4c'
    //},
    //{
    //  name:         'bbc2-cpa.ebu.io',
    //  display_name: 'BBC2',
    //  access_token: 'b3dd73435652'
    //}
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
    secret: 'thisismysecret',
    registration_type: 'static',
    redirect_uri: ''
  }],

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
