'use strict';

module.exports = {

    broadcaster: {
        // Name of the Broadcaster
        name: '',
        // Name of the Broadcaster specific layout. Use '' for default one.
        layout: process.env.BROADCASTER_LAYOUT || '',
        // override the HTML default title value
        title: process.env.IDP_TITLE || '',
        oauth: {
            // override the oauth validation message
            customMessage: process.env.CUSTOM_OAUTH_MSG || ''
        }
    },

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
        facebook: {
            enabled: ('true' == process.env.FACEBOOK_LOGIN_ENABLED),
            client_id: process.env.FACEBOOK_LOGIN_ID,
            client_secret: process.env.FACEBOOK_LOGIN_SECRET
        },
        google: {
            enabled: ('true' == process.env.GOOGLE_LOGIN_ENABLED),
            client_id: process.env.GOOGLE_LOGIN_ID,
            client_secret: process.env.GOOGLE_LOGIN_SECRET
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

    userProfiles: {
        requiredFields: process.env.PROFILE_FIELDS_REQUIRED
            ? process.env.PROFILE_FIELDS_REQUIRED.toLowerCase().split(',')
            : [],
    },

    baseUrl: process.env.BASE_URL,

    // enable trusting of X-Forwarded-For headers
    trust_proxy: true,

    displayUsersInfos: ('true' === process.env.DISPLAY_USER_INFOS),

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
            host: process.env.MAIL_HOST,
            port: process.env.MAIL_PORT,
            secure: process.env.MAIL_SECURE,
        },
        from: process.env.MAIL_FROM,
        host: process.env.IDP_HOST,
        defaultTemplateClass: process.env.MAIL_DEFAULT_TEMPLATE_CLASS
    },

    sentry: {
        dsn: process.env.SENTRY_DSN
    },

    password: {
        // one of [simple,owasp,no] - defaults to owasp
        quality_check: process.env.PASSWORD_QUALITY_CHECK || 'owasp',
        // in sec
        recovery_code_validity_duration: 1800,
        // a new recovery code will be generated only if the current one has less that TTL
        keep_recovery_code_until: 900,
        // additional endpoint for password setting (/user/password)
        additional_endpoint: 'true' === process.env.PASSWORD_ADDITIONAL_ENDPOINT,
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

    limiter: {
        type: process.env.IDP_LIMITER_TYPE || 'no', // 'no' || 'rate' || 'recaptcha-optional' || 'recaptcha'
        parameters: {
            recaptcha: {
                site_key: process.env.IDP_RECAPTCHA_SITEKEY,
                secret_key: process.env.IDP_RECAPTCHA_SECRETKEY
            },
            rate: {
                // how long to keep track of an ip on one instance
                windowMs: process.env.RATE_LIMIT_WIND0W_MS || 10 * 60 * 1000,
                // start delaying after which number of requests (0 to disable)
                delayAfter: process.env.RATE_LIMIT_DELAY_AFTER === undefined ? 1 : process.env.RATE_LIMIT_DELAY_AFTER,
                // delay per request
                delayMs: process.env.RATE_LIMIT_DELAY_MS || 1000,
                // max allowed requests (0 to disable)
                max: 0,
            }
        }
    },

    // When accessing the home page, if defined, users are automatically
    // redirected to the specified identity_providers (ie: 'github')
    auto_idp_redirect: process.env.AUTO_IDP_REDIRECT || '',
    use_landing_page: process.env.USE_LANDING_PAGE || '',

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
        debug: 'true' === process.env.DB_LOGGING
    },

    // Session cookie is signed with this secret to prevent tampering
    session_secret: process.env.SESSION_SECRET,
    quality_check: {
        enabled: true
    },

    auth_session_cookie: {
        // Name of the session cookie. Must be something different than 'connect.sid'
        name: process.env.AUTH_SESSION_COOKIE_NAME || 'identity.provider.sid',
        duration: process.env.AUTH_SESSION_COOKIE_DURATION ||365 * 24 * 60 * 60 * 1000,
        domain: process.env.AUTH_SESSION_COOKIE_DOMAIN,
        // set js_accessible to true to turn off http only for session cookie
        js_accessible: process.env.AUTH_SESSION_COOKIE_JS_ACCESSIBLE || false,
        // set accessible_over_non_https to true to send cookie via HTTP (not S) too
        accessible_over_non_https: process.env.AUTH_SESSION_COOKIE_ACCESSIBLE_OVER_NON_HTTPS || false,
    },

    // Cross-origin resource sharing
    cors: {
        enabled: true,
        allowed_domains:
            process.env.IDP_CLIENT_URL
                ? process.env.IDP_CLIENT_URL.toLowerCase().split(',')
                : [],
    },

    // URL path prefix, e.g., '/myapp'
    urlPrefix: process.env.URL_PREFIX || '',
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
        // enable automatic deletion
        automatic_deletion_activated: 'true' === process.env.AUTOMATIC_DELETION_ACTIVATED,
        // allow DELETE /oauth2/me
        endpoint_enabled: 'true' === process.env.DELETION_ENDPOINT_ENABLED,
        // how long before a deletion request is processed
        delay_in_days: process.env.DELETION_DELAY_IN_DAYS || 7,
        // check to delete in seconds
        delete_interval: process.env.DELETE_INTERVAL || 6 * 60 * 60, // 6 hours
        // how long before a verification is considered failed, in seconds, set to 0- to disable
        verification_time: process.env.VERIFICATION_TIME || 7 * 24 * 60 * 60 // 7 days
    },

    monitoring: {
        enabled: true,
    },

    access_log_format: process.env.ACCESS_LOG_FORMAT || '[ACCESS-LOG] url=":url" method=":method" statusCode=":statusCode" delta=":delta"'

};
