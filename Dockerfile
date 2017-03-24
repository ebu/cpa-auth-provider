FROM node:7

# Install dependencies
RUN apt-get update && apt-get install -y \
  libsqlite3-dev apt-transport-https

# Install yarn
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get update && apt-get install -y yarn

RUN npm install -g node-gyp

ADD bin /src/bin
ADD lib /src/lib
ADD models /src/models
ADD public /src/public
ADD routes /src/routes
ADD views /src/views
ADD templates /src/templates
ADD locales /src/locales
ADD package.json /src/package.json
ADD config.js /src/config.js
# TODO find better way to run tests without adding test file to the image
ADD test /src/test
ADD config.test.js /src/config.test.js

# Install Node.js dependencies
WORKDIR /src
RUN yarn install

# Configure
ADD config.docker.js /src/config.local.js

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
RUN bin/init-db

# By default, the application listens for HTTP on port 3000
EXPOSE 3000

CMD ["bin/server"]
