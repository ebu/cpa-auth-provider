# Cross-Platform Authentication - Authentication Provider

This project contains a reference implementation of the Cross-Platform
Authentication Authentication Provider.

More information on the [EBU Cross-Platform Authentication project](http://tech.ebu.ch/cpa)

## Prerequisites

Ensure your system has [Node.js](http://nodejs.org/) (v0.10 or later) and NPM installed.

## Getting started

    $ git clone https://github.com/ebu/cpa-auth-provider.git
    $ cd cpa-auth-provider
    $ npm install
    $ NODE_ENV=development bin/init-db

## Run the tests

    $ npm test

## Configure

The server reads configuration settings from the file `config.local.js`.
An example config for reference is in `config.dist.js`.

    $ cp config.dist.js config.local.js

Edit `config.local.js` to set any necessary configuration options, for
example, database connection and identity provider settings.

## Initialise the database

    $ NODE_ENV=development bin/init-db

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

## Related projects

* [CPA Service Provider](https://github.com/ebu/cpa-service-provider)
* [CPA Client](https://github.com/ebu/cpa-client)


## Contributors

* [Chris Needham](https://github.com/chrisn) (BBC)
* [Michael Barroco](https://github.com/barroco) (EBU)
* [Andy Buckingham](https://github.com/andybee) (togglebit)
* [Matthew Glubb](https://github.com/mglubb) (Kite Development & Consulting)


## Copyright & license

Copyright (c) 2014, EBU-UER Technology & Innovation

The code is under BSD (3-Clause) License. (see LICENSE.txt)
