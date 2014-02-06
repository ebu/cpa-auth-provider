# Cross-Platform Authentication - Authentication Provider

This project contains a reference implementation of the Cross-Platform
Authentication Authentication Provider.

More information on the [EBU Cross-Platform Authentication project](http://tech.ebu.ch/cpa)

## Prerequisites

Ensure your system has [Node.js](http://nodejs.org/) (v0.10 or later) and NPM installed.

## Getting Started

    $ git clone https://github.com/ebu/cpa-auth-provider.git
    $ cd cpa-auth-provider
    $ npm install
    $ NODE_ENV=development bin/init-db

## Run the Tests

    $ NODE_ENV=test bin/init-db
    $ make test

## Start the Server

    $ bin/server

Specify `--help` to see available command-line options:

    $ bin/server --help

## Development

This project includes a `Makefile` that is used to run various tasks during
development. This includes JSHint, for code verification, Istanbul for test
coverage, and JSDoc for documentation.

As general-purpose tools, these should be installed globally:

    $ sudo npm install -g jshint istanbul jsdoc

## Related Projects

* [CPA Service Provider](https://github.com/ebu/cpa-service-provider)
* [CPA Client](https://github.com/ebu/cpa-client)


## Contributors

* [Chris Needham](https://github.com/chrisn) (BBC)
* [Michael Barroco](https://github.com/barroco) (EBU)


## Copyright & License

Copyright (c) 2014, EBU-UER Technology & Innovation

The code is under BSD (3-Clause) License. (see LICENSE.txt)
