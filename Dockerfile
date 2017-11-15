FROM node:9.1.0-alpine

# Install dependencies
RUN apk add --no-cache sqlite-libs

RUN npm install -g sequelize-cli

ADD package.json package-lock.json /src/

# Install Node.js dependencies
WORKDIR /src
RUN apk add --no-cache --virtual build python build-base && npm install && apk del build

# Configure
ADD config.docker.js /src/config.local.js

ENV NODE_ENV development

ENV IDP_RECAPTCHA_SITEKEY 6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
ENV IDP_RECAPTCHA_SECRETKEY 6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
ENV JWT_SECRET AlteredCarbonFly
ENV DEFAULT_LOCALE fr

# default settings for database
ENV DB_TYPE sqlite
ENV DB_FILENAME "data/identity-provider.sqlite"

ADD config.js /src/config.js
ADD db_config.js /src/db_config.js
ADD bin /src/bin
ADD lib /src/lib
ADD models /src/models
ADD public /src/public
ADD routes /src/routes
ADD views /src/views
ADD templates /src/templates
ADD locales /src/locales
ADD migrations /src/migrations
ADD seeders /src/seeders

# TODO find better way to run tests without adding test file to the image
ADD test /src/test
ADD config.test.js /src/config.test.js

# Create the sqlite database
RUN mkdir data
RUN bin/init-db

# By default, the application listens for HTTP on port 3000
EXPOSE 3000

CMD sequelize db:migrate --config db_config.js && bin/server
