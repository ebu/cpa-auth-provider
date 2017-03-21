# Cross-Platform Authentication - Authorization Provider

[![Build Status](https://travis-ci.org/ebu/cpa-auth-provider.svg?branch=develop)](https://travis-ci.org/ebu/cpa-auth-provider)

This project contains a reference implementation of the Cross-Platform
Authentication Authorization Provider.

This software implements version 1.0 of the Cross-Platform Authentication Protocol ([ETSI TS 103 407](https://portal.etsi.org/webapp/WorkProgram/Report_WorkItem.asp?WKI_ID=47970)).

More information on the [EBU Cross-Platform Authentication project](http://tech.ebu.ch/cpa).

## Getting (quick) started using docker

First run [docker](https://www.docker.com/) on you machine.
Then execute the following commands:

```
$ git clone https://git.ebu.io/pipe/identity-provider.git
$ cd identity-provider
$ docker-compose up --build
```
*Note:If you're using ssh to git clone use: `git clone git@git.ebu.io:pipe/identity-provider.git`*


Now you have 2 sample web servers on your machine.
You can reach those as [http://localhost:3000](http://localhost:3000) and [http://localhost:3001](http://localhost:3001).

[http://localhost:3000](http://localhost:3000) is the identity service.

[http://localhost:3001](http://localhost:3001) demonstrates [the OAuth 2.0 implementation](#demo-site-for-oauth-20-implementation). It will redirect and use the identity service.

To stop both services, run `docker-compose down`

## Other docker configurations

### Identity provider only

There is a custom docker-compose file (docker-compose-idp-only.yaml) to start only the IDP. Use it via the following command: `docker-compose --file docker-compose-idp-only.yaml up --build -d`

### Identity provider with postgres

By default, the IDP uses a SQLite database. 
A custom docker-compose file (docker-compose-idp-postgres.yaml) can be used to:
- start a docker container with a postgres database
- configure the main container to use the postgres database.

To use the postgres database first run `docker-compose --file docker-compose-idp-postgres.yaml up --build -d` then connect to the IDP container using `docker exec -it identityprovider_identity-provider_1 /bin/bash` and run the following command in the shell: `NODE_ENV=development bin/init-db`


## Starting the identity provider outside of docker

Ensure your system has [Node.js](http://nodejs.org/) (v0.10 or later) and NPM installed.

```
$ git clone https://git.ebu.io/pipe/identity-provider.git
$ cd identity-provider
$ npm install
$ cp config.dist.js config.local.js
$ NODE_ENV=development bin/init-db
$ bin/server
```

Now you have an identity provider listening on http://localhost:3000/

## Starting the sample site outside of docker

Using provided bash shell script

```
$ chmod u+x start_demo.sh
$ ./start_demo.sh
```

Now you have a [demo site for oAuth 2.0](#demo-site-for-oauth-20-implementation) listening on [http://localhost:3000](http://localhost:3000)


## Configuration

The file `config.dist.js` contains a sample configuration. **This configuration is not supposed to be used as is in production.**

| File | Description |
| ----------------- | ----------- |
| config.local.js   | Configuration used when [running the identity provider outside docker](#starting-the-identitiy-provider-outside-of-docker)  |
| config.docker.js\*  | Configuration used when [running the identity provider inside docker](#getting-quick-started-using-docker) |
| config.test.js    | Configuration used for unit tests |

\*config.docker.js contains some environment variables that are defined in the Dockerfile or in docker-compose\[-xxx\].yaml.

## Customise layout

You can customize css, header and footer.

- Declare your layout name in your [config file](#configuration) in property `broadcasterLayout` (sample: ebu)
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


