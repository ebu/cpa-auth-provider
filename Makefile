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

lint: lint-src lint-test

lint-src:
	@$(JSHINT) bin/* lib/*.js routes/*.js

lint-test:
	@$(JSHINT) --config .jshintrc-test test/*.js test/lib/*.js

doc:
	@$(JSDOC) --private --destination ./docs/ lib

docs: doc

.PHONY: test lint lint-src lint-test doc docs
