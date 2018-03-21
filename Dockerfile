FROM node:9.1.0-alpine

# Install dependencies
RUN apk add --no-cache sqlite-libs

RUN npm install -g sequelize-cli
RUN npm install -g node-gyp

COPY package.json package-lock.json /src/

# Install Node.js dependencies
WORKDIR /src
RUN apk add --no-cache --virtual build python build-base && npm install && npm rebuild bcrypt --build-from-source && apk del build
# rebuild bcrypt to fix segmentation fault - https://github.com/kelektiv/node.bcrypt.js/issues/528

COPY .sequelizerc /src/.sequelizerc
COPY migrate /src/migrate
RUN mkdir /src/seeders

ENV NODE_ENV development

ENV JWT_SECRET AlteredCarbonFly
ENV DEFAULT_LOCALE fr

# default settings for database
ENV DB_TYPE sqlite
ENV DB_FILENAME "data/identity-provider.sqlite"

COPY bin /src/bin
COPY lib /src/lib
COPY models /src/models
COPY public /src/public
COPY routes /src/routes
COPY views /src/views
COPY templates /src/templates
COPY locales /src/locales
COPY seeders /src/seeders

# Configure
COPY config.docker.js /src/config.local.js
COPY config.js /src/config.js
COPY db_config.js /src/db_config.js

# TODO find better way to run tests without adding test file to the image
COPY test /src/test
COPY config.test.js /src/config.test.js

# Create the sqlite database
RUN mkdir data
# RUN bin/init-db

# By default, the application listens for HTTP on port 3000
EXPOSE 3000

CMD sequelize db:migrate && bin/server
