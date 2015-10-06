FROM node:0.10-slim

# Install dependencies
RUN apt-get update \
  && apt-get install -y --no-install-recommends libsqlite3-dev 

WORKDIR /src

# Install Node.js dependencies
COPY package.json ./package.json
RUN npm install

COPY bin ./bin
COPY lib ./lib
COPY models ./models
COPY public ./public
COPY routes ./routes
COPY views ./views
COPY config.js ./config.js

# Configure
COPY config.docker.js ./config.local.js

ENV NODE_ENV development

# Create the sqlite database
RUN mkdir data && bin/init-db

# By default, the application listens for HTTP on port 3000
EXPOSE 3000

CMD ["bin/server"]
