MOCHA    = node_modules/.bin/_mocha
JSHINT   = jshint
JSDOC    = jsdoc
COVERAGE = istanbul

ifdef VERBOSE
  REPORTER = spec
else
  REPORTER = dot
endif

export NODE_ENV = test

all: lint test

test:
	@$(MOCHA) --bail --timeout 10000 --reporter $(REPORTER) --require test/test-helper test/lib

lint: lint-src lint-test

lint-src:
	@$(JSHINT) bin/* lib/*.js routes/*

lint-test:
	@$(JSHINT) --config .jshintrc-test test/*.js test/lib/*.js

coverage:
	@$(COVERAGE) cover $(MOCHA) -- --reporter $(REPORTER) --require test/test-helper test/lib

doc:
	@$(JSDOC) --private --destination ./docs/ lib models routes routes/auth routes/token routes/user

docs: doc

.PHONY: test lint lint-src lint-test coverage doc docs
