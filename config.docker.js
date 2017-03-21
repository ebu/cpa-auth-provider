'use strict';

module.exports = {

    broadcasterLayout: '',

    broadcaster: '',

    i18n: {
        cookie_name: 'language',
        cookie_duration: 365 * 24 * 60 * 60 * 1000,
        default_locale: process.env.DEFAULT_LOCALE
    },

    identity_providers: {
        github: {
            enabled: false,
            client_id: process.env.IDP_GITHUB_CLIENT_ID,
            client_secret: process.env.IDP_GITHUB_CLIENT_SECRET,
            callback_url: '/auth/github/callback'
        },
        local: {
            enabled: true
        }

    },

    displayUsersInfos: true,

    mail: {
        sending: {
            // transport: 'sendmail'
            // transport: 'stream'
            transport: 'test',
            username: 'username',
            password: 'password',
            // transport: 'smtp',
            // username: '',
            // password: '',
            // host: '',
            // port: 465,
            // secure: true
        },
        from: process.env.MAIL_FROM,
        host: process.env.IDP_HOST
    },

    password: {
        // in sec
        recovery_code_validity_duration: 1800,
        // a new recovery code will be generated only if the current one has less that TTL
        keep_recovery_code_until: 900
    },

    jwtSecret: process.env.JWT_SECRET,
    jwt: {
        audience: 'cpa',
        issuer: 'cpa'
    },

    trackingCookie: {
        enabled: true,
        secret: 'HighWaterTurnsOff',
        duration: 10 * 365 * 24 * 60 * 60 * 1000 // 10 years
    },

    recaptcha: {
        site_key: process.env.IDP_RECAPCHA_SITEKEY,
        secret_key: process.env.IDP_RECAPCHA_SECRETKEY
    },

    // When accessing the home page, if defined, users are automatically
    // redirected to the specified identity_providers (ie: 'github')
    auto_idp_redirect: '',

    db: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,

        // The database type, 'mysql', 'sqlite', etc.
        type: process.env.DB_TYPE,//'sqlite',
        database: process.env.DB_DATABASE,

        // Database filename for SQLite.
        filename: process.env.DB_FILENAME,

        // If true, SQL statements are logged to the console.
        debug: true
    },

    // Session cookie is signed with this secret to prevent tampering
    session_secret: 'LKASDMjnr234n90lasndfsadf',

    // Name of the session cookie. Must be something different than 'connect.sid'
    sid_cookie_name: 'identity.provider.sid',

    // Cross-origin resource sharing
    cors: {
        enabled: true,
        allowed_domains: [
            process.env.IDP_CLIENT_URL
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
            name: "sp:8002",
            display_name: "Example Service Provider",
            access_token: "b4949eba147f4cf88985b43c039cd05b"
        },
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
    // users: [
    // 	{
    // 		id:           1,
    // 		email:        "admin@admin.com",
    // 		display_name: "Admin",
    // 		verified:     true,
    // 		permission_id:      1
    // 	}
    // ],
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

    server_clients: [],

    // The length of time that user (pairing) codes are valid, in seconds.
    pairing_code_lifetime: 60 * 60, // 1 hour

    // The length of time that a access tokens are valid, in seconds.
    access_token_lifetime: 24 * 60 * 60, // 1 day

    // The length of time that an authorization code is valid, in seconds.
    authorization_code_lifetime: 10 * 60, // 10 minutes

    // The maximum rate at which clients should poll to obtain an access token,
    // in seconds.
    max_poll_interval: 5,

    oauth2: {
        refresh_tokens_enabled: true
    }
};
