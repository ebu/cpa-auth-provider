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