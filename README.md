[![build status](https://git.ebu.io/pipe/identity-provider/badges/develop/build.svg)](https://git.ebu.io/pipe/identity-provider/commits/develop)

# Cross-Platform Authentication - Authorization Provider

This project contains a reference implementation of the Cross-Platform
Authentication Authorization Provider.

This software implements version 1.0 of the Cross-Platform Authentication Protocol ([ETSI TS 103 407](https://portal.etsi.org/webapp/WorkProgram/Report_WorkItem.asp?WKI_ID=47970)).

More information on the [EBU Cross-Platform Authentication project](http://tech.ebu.ch/cpa).

## Prerequisites

- Ensure your system has [Node.js](http://nodejs.org/) (v0.10 or later) and NPM installed.
- Ensure your system has [Yarn](https://yarnpkg.com/en/) installed. (on mac, you can do so with [Homebrew](https://brew.sh/) with `brew install yarn --without-node`)

## Getting started

    $ git clone https://git.ebu.io/pipe/identity-provider.git
    $ cd identity-provider
    $ npm install
    $ NODE_ENV=development bin/init-db

If you're using ssh to git clone use: `git clone git@git.ebu.io:pipe/identity-provider.git`

## Run the tests

    $ npm test

## Configure

The server reads configuration settings from the file `config.local.js`.
An example config for reference is in `config.dist.js`.

    $ cp config.dist.js config.local.js

Edit `config.local.js` to set the necessary configuration options:

* Identity provider OAuth 2 client ID, client secret, and callback URL. GitHub and Facebook are supported as identity providers
* Database connection settings
* Verification URL at the Authorization Provider, to be displayed to the user
* Service provider domain names and access tokens
* Note that `accessible_over_non_https` requires an ssl terminating proxy if set to `false`

## Initialise the database

Configure the database parameters also in `migrate/migrations_config.js`.
If you use a docker, this will all happen automatically.

    $ npm install -g sequelize-cli
    $ sequelize db:migrate

If you want some default values, also run `bin/prep-db`.

## Start the server

    $ bin/server

Specify `--help` to see available command-line options:

    $ bin/server --help

## Development

This project includes a `Makefile` that is used to run various tasks during
development. This includes JSHint, for code verification, Istanbul for test
coverage, and JSDoc for documentation.

As general-purpose tools, these should be installed globally:

    $ sudo npm install -g jshint istanbul jsdoc

To verify the code using JSHint and run the unit tests:

    $ make

To verify the code using JSHint:

    $ make lint

To run the unit tests:

    $ make test

To generate a test coverage report (in the `coverage` directory);

    $ make coverage

Empty migrations can be created (once sequelize-cli is installed):

    $ sequelize migration:create

New models can be added (once sequelize-cli is installed):

    $ sequelize model:create --name User --attributes 'name:string, email:string'

It's possible to test with scaling of instances:

    $ docker-compose -f docker-compose-nginx.yaml build
    $ docker-compose -f docker-compose-nginx.yaml up -d postgres
    $ docker-compose -f docker-compose-nginx.yaml up -d --scale identity-provider=4
    $ docker-compose -f docker-compose-nginx.yaml up -d proxy

## Related projects

* [Tutorial](https://github.com/ebu/cpa-tutorial)
* [Service Provider](https://github.com/ebu/cpa-service-provider)
* [Android Client](https://github.com/ebu/cpa-android)
* [iOS Client](https://github.com/ebu/cpa-ios)
* [JavaScript Client](https://github.com/ebu/cpa.js)

## Contributors

* [Chris Needham](https://github.com/chrisn) (BBC)
* [Michael Barroco](https://github.com/barroco) (EBU)
* [Andy Buckingham](https://github.com/andybee) (togglebit)
* [Matthew Glubb](https://github.com/mglubb) (Kite Development & Consulting)

## Copyright & license

Copyright (c) 2014-2016, EBU-UER Technology & Innovation

The code is under BSD (3-Clause) License. (see LICENSE.txt)
