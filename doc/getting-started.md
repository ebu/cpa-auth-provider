# Cross-Platform Authentication - Authorization Provider

[![Build Status](https://travis-ci.org/ebu/cpa-auth-provider.svg?branch=develop)](https://travis-ci.org/ebu/cpa-auth-provider)

This project contains a reference implementation of the Cross-Platform
Authentication Authorization Provider.

This software implements version 1.0 of the Cross-Platform Authentication Protocol ([ETSI TS 103 407](https://portal.etsi.org/webapp/WorkProgram/Report_WorkItem.asp?WKI_ID=47970)).

More information on the [EBU Cross-Platform Authentication project](http://tech.ebu.ch/cpa).

##Getting (quick) started using docker

First run [docker](https://www.docker.com/) on you machine.
Then execute the following commands:

```
$ git clone https://git.ebu.io/pipe/cpa-auth-provider.git
$ cd cpa-auth-provide
$ docker-compose up
```

Now you have 2 sample web servers on your machine.
You can reach those as [http://localhost:3000](http://localhost:3000) and [http://localhost:3001](http://localhost:3001).

[http://localhost:3000](http://localhost:3000) is the identity service.

[http://localhost:3001](http://localhost:3001) demonstrates [the OAuth 2.0 implementation](#demo-site-for-oauth-20-implementation). It will redirect and use the identity service.

To stop both services, run `docker-compose down`

Note: if you want to start only the IDP, you should remove `oauth2-client section` and `depend_on`+ links under `cpa-auth-provider` in `docker-compose.yaml` before running `docker-compose up`. So you file should looks like the following:
```
ersion: '2'
services:
  cpa-auth-provider:
    build: .
    ports:
    - 3000:3000
    environment:
    - MAIL_FROM=no-reply@rts.ch
    - MAIL_LOCALE=de_de
    - IDP_HOST=http://localhost/email
    - CPA_RECAPCHA_SITEKEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
    - CPA_RECAPCHA_SECRETKEY=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
    environment:
      - DB_DATABASE=cpa
      - DB_TYPE=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USER=dockercpa
      - DB_PASSWORD=SchiefesHausBautFalsch
```

##Starting the identity provider outside of docker

Ensure your system has [Node.js](http://nodejs.org/) (v0.10 or later) and NPM installed.

```
$ git clone https://git.ebu.io/pipe/cpa-auth-provider.git
$ cd cpa-auth-provider
$ npm install
$ cp config.dist.js config.local.js
$ NODE_ENV=development bin/init-db
$ bin/server
```

Now you have an identity provider listening on http://localhost:3000/

##Starting the sample site outside of docker

Using a bash shell

```
$ cd cpa-auth-provider
$ export DEMO_HOST=http://localhost
$ export OAUTH2_CLIENT_ID=db05acb0c6ed902e5a5b7f5ab79e7144
$ export OAUTH2_CLIENT_SECRET=49b7448061fed2319168eb2449ef3b58226a9c554b3ff0b138abe8ffad98
$ export OAUTH2_SERVER=\$DEMO_HOST:3000
$ export OAUTH2_CALLBACK=\$DEMO_HOST:3001
$ export OAUTH2_INTERNAL_SERVER=\$DEMO_HOST:3000
$ export HTTP_PORT=3001
$ node oauth2-client/app.js
```

Now you have a [demo site for oAuth 2.0](#demo-site-for-oauth-20-implementation) listening on http://localhost:3001/


## Configuration

The file `config.dist.js` contains a sample configuration. **This configuration is not supposed to be used as is in production.**

| File | Description |
| ----------------- | ----------- |
| config.local.js   | Configuration used when [running the identity provider outside docker](#starting-the-identitiy-provider-outside-of-docker)  |
| config.docker.js  | Configuration used when [running the identity provider inside docker](#getting-quick-started-using-docker) |
| config.test.js    | Configuration used for unit tests |


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


##Demo site for OAuth 2.0 implementation




