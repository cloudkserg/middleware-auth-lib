/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg11gmail.com>
 */
const express = require('express'),
  jwt = require('jsonwebtoken'),
  config = require('../config');


const failure = (response) => {
  response.status(400);
  response.send('Failure in custom request');
};


const init = async () => {

  const app = express();
  app.use(express.json());


  let userTokenIndex = 0;
  app.post('/user/tokens', (req, response) => {
    if (!config.tokens.includes(req.body.token)) 
      return failure(response, 'user1');
    if (!req.body.scopes[0] === config.scope) 
      return failure(response, 'user2');
    if (!req.body.userId === config.userId)
      return failure(response, 'user3');

    const userToken = config.userTokens[userTokenIndex];
    userTokenIndex = (userTokenIndex === 0 ? 1 : 0);
    return response.send({ok: true, token: userToken});
  });
  app.post('/tokens', (req, response) => {
    if (!req.body.scopes[0] === config.scope) 
      return failure(response, 'token1');
    if (!req.body.id === config.clientId)
      return failure(response, 'token2');
    if (!req.body.secret === config.secret)
      return failure(response, 'token3');
    response.send({ok: true, token: config.tokens[0],  
      refreshToken: jwt.sign({
        clientId: config.clientId,
        scopes: [config.scope]
      }, 'fsdfsdf', { expiresIn: 15 })
    });
  });
  app.post('/tokens/refresh', (req, response) => {
    if (!req.body.token === config.refreshToken)
      return failure(response, 'refresh');
    response.send({token: config.tokens[1], ok: true});
  });

  app.get('/tokens/check', (req, response) => {
    const data = req.body; 
    if (!data.id || data.id !== config.clientId)
      return failure(response, 'check1');
    if (!data.token || !config.tokens.includes(data.token))
      return failure(response, 'check2');
    if (!data.scope || data.scope !== config.scope)
      return failure(response, 'check3');
    response.send({ok: true});
  });

  app.get('/user/tokens/check', (req, response) => {
    const data = req.body; 
    if (!data.userId || data.userId !== config.userId)
      return failure(response, 'userCheck1');
    if (!data.token || !config.userTokens.includes(data.token))
      return failure(response, 'userCheck2');
    if (!data.scope || data.scope !== config.scope)
      return failure(response, 'userCheck3');
    response.send({ok: true});
  });


  app.listen(config.httpPort);
  console.log('start on' + config.httpPort);
};

module.exports = init();
