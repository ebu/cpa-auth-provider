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

  // The end-user verification URI on the authorization server. The URI should
  // be short and easy to remember as end-users will be asked to manually type
  // it into their user-agent.
  verification_uri: 'http://example.com/verify',

  enableCORS: true,

  scopes: [
    {
      name:         'http://bbc1-cpa.ebu.io/',
      display_name: 'BBC1',
      access_token: 'b4949eba147f4cf88985b43c039cd05b'
    },
    {
      name:         'http://bbc2-cpa.ebu.io/',
      display_name: 'BBC2',
      access_token: 'b3dd734356524ef9b9ab3d03f1b1558e'
    }
  ],

  // The length of time that user (pairing) codes are valid, in seconds.
  valid_pairing_code_duration: 3600,

  // The maximum rate at which clients should poll to obtain an access token,
  // in seconds.
  max_poll_interval: 5
};
