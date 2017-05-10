FROM node:7.7

COPY package.json /src/package.json

# Install Node.js dependencies
WORKDIR /src
RUN yarn install

# Configure
ADD config.docker.js /src/config.local.js

ENV NODE_ENV development

ADD . /src

# By default, the application listens for HTTP on port 3001
EXPOSE 3001

CMD ["npm", "start"]
