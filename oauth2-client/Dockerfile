FROM node:7

RUN npm install --global yarn
# Install dependencies
#RUN apt-get update && apt-get install -y \
#  git \
#  libsqlite3-dev \
#  nodejs \
#  npm
#
#RUN ln -s /usr/bin/nodejs /usr/local/bin/node

COPY package.json /src/package.json

# Install Node.js dependencies
WORKDIR /src
RUN yarn install

# Configure
ADD config.docker.js /src/config.local.js

ENV NODE_ENV development

ADD . /src
# Create the sqlite database
#RUN mkdir data
#RUN bin/init-db

# By default, the application listens for HTTP on port 3000
EXPOSE 3000

CMD ["npm", "start"]
