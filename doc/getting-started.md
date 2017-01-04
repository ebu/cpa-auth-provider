## Getting started
After cloning the repository, you can use
docker-compose to start up the sample.
```
docker-compose up
```

It will run sample web servers on your machine.
You can reach those as `http://localhost:3000`
and `http://localhost:3001`.

`http://localhost:3000` is the identity service.

`http://localhost:3001` demonstrates the OAuth 2.0
implementation. It will redirect and use the
identity service.