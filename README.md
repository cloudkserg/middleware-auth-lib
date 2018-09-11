# middleware-auth-lib [![Build Status](https://travis-ci.org/ChronoBank/middleware-auth-lib.svg?branch=master)](https://travis-ci.org/ChronoBank/middleware-auth-lib)

Library for work with middleware auth service

#### About

This library export some components for work with middleware-auth-serice.


#### Components

How to get components?
```
const lib = require('middleware-auth-lib');
```

#### Auth middleware

This middleware for express.js with work together middleware-auth-service.
Token get from request.headers.authorization as string => 'Bearer token';

That permit only requests with right tokens, that auth middleware get success.
And send this data in request.locals.data

##How work with?
```
const auth = lib.authMiddleware({
    serviceId: 'signing-service',
    provider: 'http://localhost:8082'
});

const app = require('express')();
app.use(auth);
```
Where parameters:
serviceId - identificator of microservice, that permit access
provider - address of middleware-auth-service

##In success:
```
in object request in express middleware saves this data.
request.locals.data = {clientId} || {userId}
```

##In error:
```
return response with 400 or 401 error
```

## use additional middleware
we connect additional auth middleware for this middleware,
that use only if given token from user 
not jwt (json web token) valid token.

#### Profile middleware

This middleware for express.js with work together laborx profile service.
Token get from request.headers.authorization as string => 'Bearer token';

That permit only requests with right tokens, that auth middleware get success.
And send this data in request.locals.data

##How work with?
```
const profile = lib.profileMiddleware({
    provider: 'http://localhost:8082/api/v1/security'
});

const app = require('express')();
app.use(profile); 
```
Where parameters:
provider - address of laborx profile service


Or may use together with middleware-auth-service.
```
const profile = lib.profileMiddleware({
    provider: 'http://localhost:8082/api/v1/security'
});
const auth = lib.authMiddleware({
    serviceId: 'signing-service',
    provider: 'http://localhost:8082/api/v1/security'
}, profile);

const app = require('express')();
app.use(auth); 
```

##In success:
```
in object request in express middleware saves this data.
request.locals.data = {addresses}
```

##In error:
```
return response with 400 or 401 error
```

#### Auth client 

This client work on client, that connected to service with authMiddleware 
and work with middleware-auth-service.

##How get token for client?
```
const tokenLib = new lib.Token({
    id: 'chronomint'
    provider: 'http://localhost:8083',
    secret: 'super',
});

const scopes = ['signing-service];
const token = await tokenLib.getToken(scopes);

await require('request-promise')({
    method: 'POST',
    uri: 'http://localhost:8087',
    headers: {authorization: 'Bearer ' + token}
});
```
Where parameters in constructor:
id - identificator of this service
provider - address of middleware-auth-service
secret - password of this service
scopes - array of scopes[services], that client want access

##How get token for user on client?
```
const tokenLib = new lib.Token({
    id: 'chronomint'
    provider: 'http://localhost:8083',
    secret: 'super',
});

const scopes = ['signing-service];
const userId = 'userId';
const token = await tokenLib.getUserToken(userId, scopes);

await require('request-promise')({
    method: 'POST',
    uri: 'http://localhost:8087',
    headers: {authorization: 'Bearer ' + token}
});
```
Where parameters in constructor:
id - identificator of this service
provider - address of middleware-auth-service
secret - password of this service
userId - id of client
scopes - array of scopes[services], that user want access



License
----
 [GNU AGPLv3](LICENSE)


Copyright
----
LaborX PTY
