"use strict";

module.exports = {

    broadcaster: {
        // Name of the Broadcaster
        name: 'rts',
        // Name of the Broadcaster specific layout. Use '' for default one.
        layout: 'rts',
        // override the HTML default title value
        title: '',
        oauth: {
            // override the oauth validation message
            customMessage: '{client} souhaite accéder à votre compte maRTS.'
        }
    },

    // Define the available identity providers
    identity_providers: {
        // Details : http://passportjs.org/guide/facebook/
        facebook: {
            enabled: false,
            client_id: '',
            client_secret: '',
            callback_url: ''
        },
        google: {
            enabled: false,
            client_id: '',
            client_secret: ''
        },
        twitter: {
            enabled: false,
            consumer_key: '',
            consumer_secret: '',
            callback_url: ''
        },
        github: {
            enabled: false,
            client_id: '',
            client_secret: '',
            callback_url: ''
        },
        ebu: {
            enabled: false
        },
        local: {
            enabled: true
        }
    },

    // configuration for password using local identity provider
    password: {
        // one of [no,simple,owasp] - defaults to owasp
        quality_check: '',
        // in sec
        recovery_code_validity_duration: 1800,
        // a new recovery code will be generated only if the current one has less that TTL
        keep_recovery_code_until: 900,
        // additional endpoint for password setting (/user/password)
        additional_endpoint: true,
    },

    // define the name of the cookie used to store user locale
    i18n: {
        cookie_name: 'language',
        cookie_duration: 365 * 24 * 60 * 60 * 1000,
        default_locale: 'en'
    },

    // mail configuration, available configuration are 'test','direct','sendmail','smtp','aws', 'gmail'
    mail: {
        sending: {
            transport: 'test',
            // transport: 'direct'
            // transport: 'sendmail'
            // transport: 'smtp'
            // transport: 'aws'
            // transport: 'gmail',
            username: 'username',
            password: 'password',
        },
        from: 'no-reply@broadcaster.com',
        // host is used for to generate link in mail (like password recovery)
        host: 'http://localhost:3000'
    },

    trackingCookie: {
        enabled: false,
        secret: 'secret phrase',
        duration: 10 * 365 * 24 * 60 * 60 * 1000 // 10 years
    },

    limiter: {
        type: 'recaptcha', // 'no' || 'rate' || 'recaptcha-optional' || 'recaptcha'
        parameters: {
            recaptcha: {
                site_key: '6Lc6NCYUAAAAAPiyvFO2jig6jXGtYEhgZWtWFzml',
                secret_key: '6Lc6NCYUAAAAALCXdWXUsZgDBl7fn9XA_ecVpu7m'
            },
            rate: {
                windowMs: 10 * 60 * 1000,
                delayAfter: 1,
                delayMs: 1000
            }
        }
    },

    // When accessing the home page, if defined, users are automatically
    // redirected to the specified identity_providers (ie: 'github')
    auto_idp_redirect: '',
    use_landing_page: false,

    // enable trusting of X-Forwarded-For headers
    trust_proxy: true,

    // if false the list of user is not accessible in the admin
    displayUsersInfos: true,

    //if false the idp menu bar is hidden
    displayMenuBar: true,

    // Database configuration
    db: {
        host: '',
        port: 3306,
        user: '',
        password: '',

        // The database type, 'mysql', 'sqlite', etc.
        type: 'sqlite',
        database: '',

        // Database filename for SQLite.
        filename: 'db.db',

        // If true, SQL statements are logged to the console.
        debug: true
    },

    // Session cookie is signed with this secret to prevent tampering
    session_secret: 'putYourSessionSecretHere',

    auth_session_cookie: {
        // Name of the session cookie. Must be something different than 'connect.sid'
        name: 'identity.provider.sid',
        duration: 365 * 24 * 60 * 60 * 1000,
        // set js_accessible to true to turn off http only for session cookie
        js_accessible: false,
        // set accessible_over_non_https to true to send cookie via HTTP (not S) too
        accessible_over_non_https: true, // Use true for local test if you don't have https stuff
        //domain: .rts.ch
    },

    // Cross-origin resource sharing
    cors: {
        enabled: true,
        allowed_domains: [
            "http://cpa-client.ebu.io"
        ]
    },

    // URL path prefix, e.g., '/myapp'
    urlPrefix: '',

    // CPA

    // The length of time that user (pairing) codes are valid, in seconds.
    pairing_code_lifetime: 60 * 60, // 1 hour

    // The length of time that a access tokens are valid, in seconds.
    access_token_lifetime: 24 * 60 * 60, // 1 day

    // The length of time that an authorization code is valid, in seconds.
    authorization_code_lifetime: 10 * 60, // 10 minutes

    // The maximum rate at which clients should poll to obtain an access token,
    // in seconds.
    max_poll_interval: 5,

    // JWT configuration for CPA https://tech.ebu.ch/groups/CPA
    jwtSecret: 'CHANGE_BEFORE_MOVING_IN_PRODUCTION',
    jwt: {
        audience: 'cpa',
        issuer: 'cpa'
    },

    // The end-user verification URI on the authorization server. The URI should
    // be short and easy to remember as end-users will be asked to manually type
    // it into their user-agent.
    verification_uri: 'http://vagrant.ebu.io:3000/',


    // This option controls how the authorization server responds to requests to
    // associate an existing client with a new domain:
    // - false: The user must authenticate and confirm access to the new domain
    // - true: The user is automatically granted access without confirmation
    auto_provision_tokens: false,

    server_clients: [{
        name: '',
        software_id: '',
        software_version: '',
        ip: '127.0.0.1',
        secret: '',
        registration_type: 'static',
        redirect_uri: ''
    }],

    // Data that will be inserted when running bin/initdb
    domains: [
        {
            name: 'bbc1-cpa.ebu.io',
            display_name: 'BBC1',
            access_token: 'b4949eba147f4cf88985b43c039cd05b'
        },
        {
            name: 'bbc2-cpa.ebu.io',
            display_name: 'BBC2',
            access_token: 'b3dd734356524ef9b9ab3d03f1b1558e'
        }
    ],

    permissions: [
        {
            id: 1,
            label: "admin"
        },
        {
            id: 2,
            label: "other"
        }
    ],

    // admin: {
    //     id:           1,
    //     login:        "admin@admin.com",
    //     display_name: "Admin",
    //     verified:     true,
    //     permission_id:1
    //   },

    // Init dev environment purpose (RTS sample)
    // oauth2_clients: [
    //     {
    //         id: 1,
    //         client_id: "db05acb0c6ed902e5a5b7f5ab79e7144",
    //         client_secret: "49b7448061fed2319168eb2449ef3b58226a9c554b3ff0b138abe8ffad98",
    //         user_template: "boutique-rts",
    //         name: "La boutique RTS"
    //     }
    // ],

    oauth2: {
        refresh_tokens_enabled: true
    },

    deletion: {
        // enable automatic deletion
        automatic_deletion_activated: false,
        // allow DELETE /oauth2/me
        endpoint_enabled: false,
        // how long before a deletion request is processed
        delay_in_days: 7,
        // check to delete in seconds
        delete_interval: 6 * 60 * 60, // 6 hours
        // how long before a verification is considered failed, in seconds, set to 0- to disable
        verification_time: 7 * 24 * 60 * 60 // 7 days
    },

    monitoring: {
        enabled: true,
    },

    access_log_format: '[ACCESS-LOG] url=":url" method=":method" statusCode=":statusCode" delta=":delta"'

};
