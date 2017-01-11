**As a user, I want to login on an app using**  **RFC 6749, 4.1: Authorization Code**

_"As a user, I trust the app to manage tokens for me"_

Principe:

- As a user, I'll go to the identity service login page from the app page (app page will be retrieved as a call back page)
- After being logged and if I "allow" the app, the identity service will return a code.
- Then I'll go back to the call back page with the code.
- So the app backend can call the identity service directly to get an access and a refresh token.

It's up to the broadcaster to choose what does he want to do with those tokens:

- Store them in cookies or local storage of user browser. So the app must check the access token with the identity provider.
Note: in that case the identity provider can manage the expiration of access token by requesting a new one from the refresh token if both are sent by the user browser.
If the broadcaster doesn't do that, it's the responsibility of JS code on the browser to "refresh" its token with the identity provider (for instance if it receive a 403 error).
- Only check if the user tokens are correct and then manage the security on its own.
- Share the secret between the app backend and the identity service, so the app backend could validate the access token.

Components provided:

- Signup / login UI
- Endpoints to retrieve access and refresh token from the code
- Endpoints to validate an access token
- Endpoints to request a new access token with a refresh token
- Endpoints to get/update identity information

**As a user, I want to login on an app using**  **RFC 6749, 4.3: Resource Owner Password**

_"As a user, I don't interact with app backend for authentication purpose."_

Principe:

- As a user, I'll log in using a form that interact with identity service via AJAX call.
- The app backend never interact with the identity service.
- The interactions are only between frontend and identity service.
- The AJAX code is responsible of the security stuff (signup, login, get/update identity information, refresh access token).
- The client remain on the app page.

A broadcaster that choose to use "Password client" would only use identity services endpoints.

Components provided:

- Endpoints to signup, login, get/update identity information, refresh access token

**As a user I want to login on an app using**  **RFC 6749, 4.2: Implicit Client**

_"As a user, I provide an access token to the app backend."_

Principe:

- As a user, I'll go to the identity service login page from the app page (app page will be retrieved as a call back page).
- After being logged and if I "allow" the app, the identity service will return both access and refresh token (and not a code like in Authorisation Code)
- Then I'll go back to the call back page passing the access token as a parameter.

The broadcaster is responsible of the validation of the access token with the identity service.

Components provided:

- Signup / login UI
- Endpoints to retrieve access and refresh token from the code
- Endpoints to validate an access token
- Endpoints to request a new access token with a refresh token
- Endpoints to get/update identity information


** Differences between the 3 ways of login

- RFC 6749, 4.1: Authorization Code. The application backend has a full access to all the tokens. (Maximum trust)
- RFC 6749, 4.2: Implicit Client. The application backend only access to the access token (not the refresh one)
- RFC 6749, 4.3: Resource: Owner Password. The application backend doesn't have accesses to token. (Minimal trust)


**About the Tokens:**

Access token:

- An access token is signed.
- It's easy to check (like JWT where there is need to query a database to check it)
- It has a short time to live (in general from 15 minutes to 2 hours).

Refresh token:

- An access token is harder to check. It should require to be checked via a database.
- A Refresh token has a long TTL and he would be refreshed before it expires if you use it regularly.
- When an access token expire, the refresh token is used to require a new access token