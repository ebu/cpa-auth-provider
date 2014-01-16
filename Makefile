MOCHA  = node_modules/.bin/mocha
JSHINT = jshint
JSDOC  = jsdoc

ifdef VERBOSE
  REPORTER = spec
else
  REPORTER = dot
endif

export NODE_ENV = test

all: lint test

test:
	@$(MOCHA) --bail --reporter $(REPORTER) --require test/test-helper test/lib

lint:
	@$(JSHINT) lib/*.js test/*.js test/lib/*.js

doc:
	@$(JSDOC) --private --destination ./docs/ lib

docs: doc

.PHONY: test lint docs doc
