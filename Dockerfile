FROM ubuntu:trusty

# Install dependencies
RUN apt-get update && apt-get install -y \
  git \
  libsqlite3-dev \
  nodejs \
  npm

RUN ln -s /usr/bin/nodejs /usr/local/bin/node

ADD bin /src/bin
ADD lib /src/lib
ADD models /src/models
ADD public /src/public
ADD routes /src/routes
ADD views /src/views
ADD package.json /src/package.json
ADD config.js /src/config.js
# TODO find better way to run tests without adding test file to the image
ADD test /src/test
ADD config.test.js /src/config.test.js

# Install Node.js dependencies
WORKDIR /src
RUN npm install

# Configure
ADD config.docker.js /src/config.local.js

ENV NODE_ENV development

# Create the sqlite database
RUN mkdir data
RUN bin/init-db

# By default, the application listens for HTTP on port 3000
EXPOSE 3000

CMD ["bin/server"]
