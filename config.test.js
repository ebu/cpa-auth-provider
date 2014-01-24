"use strict";

exports.identity_providers = {
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
};

exports.db = {
  host: '',
  port: 3306,
  user: '',
  password: '',
  // type: 'mysql',
  // database: 'cpa_test',
  type: 'sqlite',
  filename: 'data/test.sqlite'
};

exports.uris = {
  registration_client_uri: "http://example.com/registration_client_uri",

  // The end-user verification URI on the authorization server. The URI should
  // be short and easy to remember as end-users will be asked to manually type
  // it into their user-agent.
  //
  // See draft-recordon-oauth-v2-device-00 section 1.4.
  verification_uri: 'http://example.com/verify'
};
