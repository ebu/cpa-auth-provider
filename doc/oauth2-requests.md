## The sample app
When using `docker-compose up` to run the example,
http://localhost:3001 provides access to sample code
found in `oauth2-client` directory.

It can showcase the three available OAuth2 implementations.
In all ways, the end result is an access token that allows
access on the authorization server and provides the unique
identity.

authorization server = localhost:3000

client server = localhost:3001

### Authorization Code (RFC 6749, 4.1)
Authorization Code provides a safe way to communicate between
the authorization server and the client server. The access
token will only be revealed to the client server.

When requesting an identity, the user is redirected to the
authorization server. There they have to authenticate with an
existing account or create a new one. After they are logged
into a valid account, the user is redirected back to the client
server with the authorization code in the redirection url.

The authorization code is transmitted to the client server.
The client server uses the authorization code to generate an
access token for the user. This access token exists on the
client server and can be stored as the specific client server
implementation requires. It also supports receiving refresh
tokens.

### Implicit Client (RFC 6749, 4.2)
Implicit client flow puts the access token directly in the
url of last redirect. The access token can be read by javascript
on the page.

When requesting an identity, the user is redirected to the
authorization server. There they have to authenticate with an
existing account or create a new one. After they are logged
into a valid account, the user is redirected back to the client
server with the access token in the redirection url.

The access token is directly available to scripts on the
page. And can be use inside the page to communicate and access
the authorization server. It does not support refresh tokens.

### Resource Owner Password
Resource Owner Password flow allows a login by transmitting
username and password from the page - typically by using a
script. Thus it can integrate very well into an existing design.
The access token will not be directly visible to the client
server.

The user enters their username and password into fields and
those are transmitted to the authorization server. The browser
receives the reply directly containing the access token.

The access token is immediately available to the scripts on
the page. It can be used inside the page to communicate with
and access the authorization server. It also supports
receiving refresh tokens.


## Sample requests
###RFC 6749, 4.1 Authorization Code
```
http://localhost:3000/oauth2/dialog/authorize?response_type=code&client_id=db05acb0c6ed902e5a5b7f5ab79e7144&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fauth%2Foauth%2Fcallback
```

Expected redirect:
```
http://localhost:3001/auth/oauth/callback?code=1c25f083-eef9-4e9b-a685-0e64e30dfcb3
```

Server needs to send the code to identity server for actual access token.

###RFC 6749, 4.2 Implicit Client
```
http://localhost:3000/oauth2/dialog/authorize?response_type=token&client_id=db05acb0c6ed902e5a5b7f5ab79e7144&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fimplicit
```

Expected redirect:
```
http://localhost:3001/implicit#access_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJjcGEiLCJhdWQiOiJjcGEiLCJleHAiOjM2MDAwLCJzdWIiOjIsImNsaSI6MX0.TTn09DPxg-9RkvoCOU62JsWiB0GY-AISWoSqOEs-K90&token_type=Bearer
```

The access token is directly part of the result.

###RFC 6749, 4.3 Resource Owner Password
To log in user 'a@b.com' with password 'a':
```
curl -X POST \
    -H "accept: application/json" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d 'grant_type=password&username=a@b.com&password=a&client_id=db05acb0c6ed902e5a5b7f5ab79e7144&client_secret=49b7448061fed2319168eb2449ef3b58226a9c554b3ff0b138abe8ffad98' \
    "http://localhost:3000/oauth2/token"
```
Expected result:
```json
{
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJjcGEiLCJhdWQiOiJjcGEiLCJleHAiOjM2MDAwLCJzdWIiOjIsImNsaSI6MX0.TTn09DPxg-9RkvoCOU62JsWiB0GY-AISWoSqOEs-K90",
    "token_type": "Bearer"
}
```

The access token is supplied as part of the json reply. 