"use strict";

exports.passport = {
  //Details : http://passportjs.org/guide/facebook/
  FACEBOOK_ENABLED: false,
  FACEBOOK_CLIENT_ID: '',
  FACEBOOK_CLIENT_SECRET: '',
  FACEBOOK_CALLBACK_URL: '',

  GITHUB_ENABLED: false,
  GITHUB_CLIENT_ID: '',
  GITHUB_CLIENT_SECRET: '',
  GITHUB_CALLBACK_URL: '',

  EBU_ENABLED: false,
  EBU_CAS_SERVER_URL: '',
  EBU_SERVICE: ''
};

exports.db = {
  host: '',
  port: 3306,
  user: '',
  password: '',
  type: '', // mysql | sqlite3 | ...
  database: '',
  filename: '' // database filename for sqlite
};


exports.uris = {
  registration_client_uri: 'http://vagrant.ebu.io:3000/register',

  // The end-user verification URI on the authorization server. The URI should
  // be short and easy to remember as end-users will be asked to manually type
  // it into their user-agent.
  verification_uri: 'http://vagrant.ebu.io:3000/'
};

exports.realm = 'CPA';
