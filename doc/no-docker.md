## Starting the identity provider outside of docker

Ensure your system has [Node.js](http://nodejs.org/) (v0.10 or later) and NPM installed.

```
$ git clone https://git.ebu.io/pipe/identity-provider.git
$ cd identity-provider
$ npm install
$ cp config.dist.js config.local.js
$ NODE_ENV=development bin/init-db
$ bin/server
```

Now you have an identity provider listening on [http://localhost:3000](http://localhost:3000)

## Starting the sample site outside of docker

After having [started the identity service](#starting-the-identity-provider-outside-of-docker) you can start the demo application using the following provided bash shell script

```
$ chmod u+x start_demo.sh
$ ./start_demo.sh
```

Now you have a [demo site for oAuth 2.0](#demo-site-for-oauth-20-implementation) listening on [http://localhost:3000](http://localhost:3000)
