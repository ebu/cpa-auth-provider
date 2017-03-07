# Cross-Platform Authentication - Authorization Provider

[![Build Status](https://travis-ci.org/ebu/cpa-auth-provider.svg?branch=develop)](https://travis-ci.org/ebu/cpa-auth-provider)

This project contains a reference implementation of the Cross-Platform
Authentication Authorization Provider.

This software implements version 1.0 of the Cross-Platform Authentication Protocol ([ETSI TS 103 407](https://portal.etsi.org/webapp/WorkProgram/Report_WorkItem.asp?WKI_ID=47970)).

More information on the [EBU Cross-Platform Authentication project](http://tech.ebu.ch/cpa).

## Prerequisites

Ensure your system has [Node.js](http://nodejs.org/) (v0.10 or later) and NPM installed.

## Getting started

$ git clone https://git.ebu.io/pipe/cpa-auth-provider.git
$ cd cpa-auth-provider
$ npm install
$ cp config.dist.js config.local.js
$ NODE_ENV=development bin/init-db




## Getting started
After cloning the repository, you can use
docker-compose to start up the sample.
```
docker-compose up
```

It will run sample web servers on your machine.
You can reach those as `http://localhost:3000`
and `http://localhost:3001`.

`http://localhost:3000` is the identity service.

`http://localhost:3001` demonstrates the OAuth 2.0
implementation. It will redirect and use the
identity service.