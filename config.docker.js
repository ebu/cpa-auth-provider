'use strict';

module.exports = {

    title: process.env.IDP_TITLE || '',

    broadcasterLayout: process.env.BROADCASTER_LAYOUT || '',

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
        openam: {
            enabled: ('true' == process.env.OPEN_AM_ENABLED),
            callback_url: process.env.OPEN_AM_CALL_BACK_URL,
            service_url: process.env.OPEN_AM_SERVICE_URL
        },
        facebook: {
            enabled: ('true' == process.env.FACEBOOK_LOGIN_ENABLED),
            client_id: process.env.FACEBOOK_LOGIN_ID,
            client_secret: process.env.FACEBOOK_LOGIN_SECRET,
            callback_url: process.env.FACEBOOK_LOGIN_CALL_BACK_URL
        },
        googleplus: {
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
        ebu: {
            enabled: false
        },
        local: {
            enabled: true
        }
    },

    displayUsersInfos: true,

    displayMenuBar: '' || process.env.DISPLAY_MENU_BAR,

    mail: {
        sending: {
            transport: process.env.MAIL_TRANSPORT_TYPE,
            // transport: 'sendmail'
            // transport: 'stream'
            // transport: 'test',
            // transport: 'smtp',
            username: process.env.MAIL_USER_NAME,
            password: process.env.MAIL_PASSWORD,
            // host: '',
            // port: 465,
            // secure: true
        },
        from: process.env.MAIL_FROM,
        host: process.env.IDP_HOST,
        defaultTemplateClass: process.env.MAIL_DEFAULT_TEMPLATE_CLASS
    },

    password: {
        // in sec
        recovery_code_validity_duration: 1800,
        // a new recovery code will be generated only if the current one has less that TTL
        keep_recovery_code_until: 900
    },

    use_sequelize_sessions: true,

    jwtSecret: process.env.JWT_SECRET,
    jwt: {
        audience: process.env.JWT_AUDIENCE || 'cpa',
        issuer: process.env.JWT_ISSUER || 'cpa'
    },

    trackingCookie: {
        enabled: ('true' == process.env.TRACKING_COOKIE),
        secret: 'HighWaterTurnsOff',
        duration: 10 * 365 * 24 * 60 * 60 * 1000 // 10 years
    },

    recaptcha: {
        enabled: false,
        site_key: process.env.IDP_RECAPCHA_SITEKEY,
        secret_key: process.env.IDP_RECAPCHA_SECRETKEY
    },

    // When accessing the home page, if defined, users are automatically
    // redirected to the specified identity_providers (ie: 'github')
    auto_idp_redirect: process.env.AUTO_IDP_REDIRECT || '',

    db: {
        host: process.env.DB_HOST,
        dialectOptions: process.env.DB_DIALECT_OPTIONS ? JSON.parse(process.env.DB_DIALECT_OPTIONS) : undefined,
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
    quality_check: {
        enabled: true
    },

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
    oauth2: {
        refresh_tokens_enabled: true,
        access_token_duration: 10 * 60 * 60 * 1000,
        refresh_token_duration: 365 * 24 * 60 * 60 * 1000,
    },

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

    deletion: {
        // how long before a deletion request is processed
        delay_in_days: process.env.DELETION_DELAY_IN_DAYS || 7,
        // check to delete in seconds
        delete_interval: process.env.DELETE_INTERVAL || 6 * 60 * 60, // 6 hours
        // how long before a verification is considered failed, in seconds
        verification_time: process.env.VERIFICATION_TIME || 7 * 24 * 60 * 60 // 7 days
    },
};
