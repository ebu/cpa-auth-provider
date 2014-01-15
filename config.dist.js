"use strict";


exports.identity_providers = {
  //Details : http://passportjs.org/guide/facebook/
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
  }
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

exports.enableCORS = true;
