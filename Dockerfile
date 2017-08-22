FROM node:8.4

# Install dependencies
RUN apt-get update && apt-get install -y \
  libsqlite3-dev apt-transport-https

RUN npm install -g node-gyp
RUN yarn global add sequelize-cli

WORKDIR /src

# Install Node.js dependencies
ADD package.json /src/package.json
ADD passport-openam /src/passport-openam
RUN yarn install


ADD migrations_config.js /src/migrations_config.js
ADD migrations /src/migrations
RUN mkdir /src/seeders

# Add other application files
ADD bin /src/bin
# TODO find better way to run tests without adding test file to the image
ADD test /src/test
ADD config.test.js /src/config.test.js
ADD locales /src/locales
ADD models /src/models
ADD public /src/public
ADD routes /src/routes
ADD views /src/views
ADD templates /src/templates
ADD lib /src/lib

# Configure
ADD config.docker.js /src/config.local.js
ADD config.js /src/config.js

ENV NODE_ENV development

ENV IDP_RECAPCHA_SITEKEY 6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
ENV IDP_RECAPCHA_SECRETKEY 6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
ENV JWT_SECRET AlteredCarbonFly
ENV DEFAULT_LOCALE fr

# default settings for database
ENV DB_TYPE sqlite
ENV DB_FILENAME "data/identity-provider.sqlite"

# Create the sqlite database
RUN mkdir data
# RUN bin/init-db

# By default, the application listens for HTTP on port 3000
EXPOSE 3000

CMD sequelize db:migrate --config migrations_config.js && bin/server
