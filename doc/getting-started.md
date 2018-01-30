# Cross-Platform Authentication - Authorization Provider

[![Build Status](https://travis-ci.org/ebu/cpa-auth-provider.svg?branch=develop)](https://travis-ci.org/ebu/cpa-auth-provider)

This tutorial will help you start the identity provider on a local machine. It is the prerequisite for the next guides.

The identity provider offers the following features:

- User login using the OAuth2 authorization code grant such as Authorization Code, Implicit and Resource Owner Password Credentials.
- Identity Federation using Passport.js
- Association of media devices with user identity using ETSI TS 103 407\*.
- Templates for branding.


\* *This software implements version 1.0 of the Cross-Platform Authentication Protocol ([ETSI TS 103 407](https://portal.etsi.org/webapp/WorkProgram/Report_WorkItem.asp?WKI_ID=47970)). More information on the [EBU Cross-Platform Authentication project](http://tech.ebu.ch/cpa).*

## Getting (quick) started using docker

### Quick start

This section presents how to start a demo with an idenitty provider and a sample client application.
This demo uses a SQLite database. If you want to start only the Identity provider with a production ready database you can go to [Identity provider with postgres section](#identity-provider-with-postgres) 

First run [docker](https://www.docker.com/) on you machine.
Then execute the following commands:

```
$ git clone https://git.ebu.io/pipe/identity-provider.git
$ cd identity-provider
$ git submodule update --init
$ docker-compose up --build
```
*Note: If you're using ssh to git clone use: `git clone git@git.ebu.io:pipe/identity-provider.git`*


Now you have 2 sample web servers on your machine.
You can reach those as [http://localhost:3000](http://localhost:3000) and [http://localhost:3001](http://localhost:3001).

[http://localhost:3000](http://localhost:3000) is the identity service.

[http://localhost:3001](http://localhost:3001) demonstrates [the OAuth 2.0 implementation](#demo-site-for-oauth-20-implementation). It will redirect and use the identity service.

### Stop

To stop both services, run `docker-compose down`

### Available parameters

The following parameters can be configured in `docker-compose.yaml` file.

#### IDP parameters 

| Parameter 				| Sample 									 | Description 																	  |
| ------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------ |
| MAIL_FROM			 		| no-reply@rts.ch    						 | The origin for email that'd be send by the plateform 						  |
| IDP_HOST 					| http://localhost:3000 				     | The IDP server url. Might be used in email. 								      |
| IDP_RECAPCHA_SITEKEY 		| 6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI	 | ReCaptcha site key  														   	  |
| IDP_RECAPCHA_SECRETKEY 	| 6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe	 | ReCaptcha site secret 														  |
| DEFAULT_LOCALE 			| fr 										 | Default locale. Used if no local could be found in the browser or user setting |

#### Demo parameters 

| Parameter 				| Sample 													   | Description 									   	|
| ------------------------- | ------------------------------------------------------------ | -------------------------------------------------- |
| OAUTH2_CLIENT_ID 			| db05acb0c6ed902e5a5b7f5ab79e7144							   | oAuth client id 								   	|
| OAUTH2_CLIENT_SECRET 		| 49b7448061fed2319168eb2449ef3b58226a9c554b3ff0b138abe8ffad98 | oAuth client secret 							   	|
| OAUTH2_SERVER 			| http://localhost:3000										   | The IDP server url 								|
| OAUTH2_CALLBACK 			| http://localhost:3001										   | The demo server url 							 	|
| OAUTH2_INTERNAL_SERVER 	| http://identity-provider:3000								   | The internal IDP server (inside docker container ) |


## Other docker configurations

### Identity provider only

This section presents how to start an identity provider without the sample client application.
Note that the identity provider uses a SQLite database. If you want to use a production ready database you can go next section: [Identity provider with postgres](#identity-provider-with-postgres)

There is a custom docker-compose file (docker-compose-idp-only.yaml) to start only the IDP. Use it via the following command: `docker-compose --file docker-compose-idp-only.yaml up --build -d`

### Identity provider with postgres

This section presents how to start the identity provider with a postgress database.
Since this setup could be used to build a production setup, there is an additionnal step to manualy initialize the database.

That setup is based on a specific docker-compose file: `docker-compose-idp-only.yaml`

To start only the IDP uses the following command: `docker-compose --file docker-compose-idp-only.yaml up --build -d`

The first time you run that configuration you should initialize the database by executing a commande on the idp docker container.
Connect to the container using `docker-compose --file docker-compose-idp-postgres.yaml up --build -d` in the container shell run the following command to initialize the database `NODE_ENV=development bin/init-db`

## Running without docker

If you want to run the identity provider outside of docker (for development or if you cannot use docker in production) [this page](no-docker.md) present how to run the identity provider and the demo app.

## Customise layout

You can customize css, header and footer.

- Declare your layout name in your [config file](#configuration) in property `broadcaster.layout` (sample: ebu)
- Create a folder in `views/layout` for your custom files (sample: `views/layout/ebu`)
- Add your css file in `public/css` (sample ebu.css)
- Add your custom files in the created folder: 
	- `views/layout/ebu/footer.ejs`: custom footer
	- `views/layout/ebu/header.ejs`: custom header (include a reference to your custom css in that file)
	- `views/layout/ebu/nav.ejs`: custom navigation
- Update `views/layout/head.ejs` and `views/layout/foot.ejs` to include previous files


## Demo site for OAuth 2.0 implementation

The project came with a demo web application that could be started (see [Getting quick started using Docker](#getting-quick-started-using-docker)).
IDP support the 3 mains authentications flow (see [oAuth big picture](./oAuthBigPicture.md)). Those can be tested on [http://localhost:3001](http://localhost:3001).

### Authorization Code flow
The Authorization Code sample implementation can be accessed at
[http://localhost:3001/auth_code](http://localhost:3001/auth_code).
The relevant code for it can be found in
[auth-code-flow.js](oauth2-client/routes/auth-code-flow.js).

It works like a standard OAuth 2 client would. You select to login
with an external server. Then you are redirected to that server -
in the example `http://localhost:3000`.
After either creating an account, or logging into an existing one,
the authorization server redirects back to the original server -
`http://localhost:3001/auth_code/callback`.

The redirection provides the OAuth 2 client with an authorization
code that can be used to generate an access token for the
authorization server. The access token represents the users
identity. 
