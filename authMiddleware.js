/**
* Copyright 2017–2018, LaborX PTY
* Licensed under the AGPL Version 3 license.
* @author Kirill Sergeev <cloudkserg11@gmail.com>
*/
const _ = require('lodash'),
  request = require('request-promise'),
  jwt = require('jsonwebtoken');

const getAuthToken = (req) => { 
  const authorization = _.get(req, 'headers.authorization', '');
  if (authorization === '')
    return false;

  const params = authorization.split(' ');
  if (!isToken(params[0])) 
    return false;
  return params[1];
};

const isToken = (nameToken) => { 
  return nameToken === 'Bearer';
};

const getTokenData = (token) => {
  try {
    const tokenData = jwt.decode(token);
    if (!tokenData['scopes']) 
      throw new Error('not set scopes in token');
    return tokenData;
  } catch (e) {
    return false;
  }
};

const hasServiceScope = (tokenData, scope) => {
  if (!tokenData.scopes) 
    return false;
  const scopes = tokenData.scopes;
  return (scopes.includes && scopes.includes(scope));
};

const checkClientTokenInAuth = async (provider, scope, clientId, token) => {
  const response = await request({
    method: 'GET',
    uri: provider + '/tokens/check',
    json: {
      id: clientId,
      scope: scope,
      token: token
    }
  }).catch(e => {throw e; });
  return (response.ok === true);
};


const checkUserTokenInAuth = async (provider, scope, userId, token) => {
  const response = await request({
    method: 'GET',
    uri: provider + '/user/tokens/check',
    json: {
      userId: userId,
      scope: scope,
      token: token
    }
  }).catch(e => { throw e; });
  return (response.ok === true);
};

const getAuthData = async (serviceId, provider, token, jwtData) => {
  if (!hasServiceScope(jwtData, serviceId))
    throw new Error('Not right scope in token');

  if (!jwtData['clientId']) 
    throw new Error('Not set clientId in token');

  if (jwtData['userId'] && (await checkUserTokenInAuth(
    provider, serviceId, jwtData['userId'], token)))
    return {userId: jwtData['userId']};
    
  if (await checkClientTokenInAuth(provider, serviceId, 
    jwtData['clientId'], token))
    return {clientId: jwtData['clientId']};
  
  throw new Error('Not right auth');
};


const defaultAdditionalMiddleware = (req, res, next) => {
  res.statusCode = '400';
  res.send('Not jwt token');
  return;
};

/**
 * 
 * @param {{serviceId: String, provider: String}} config 
 * @param {Function} additionalMiddleware  func (req, res, next)
 */
module.exports = (config, additionalMiddleware = null) => {
  if (!config.serviceId || !config.provider) 
    throw new Error('not found serviceId or provider in config');
    
  if (!additionalMiddleware)
    additionalMiddleware = defaultAdditionalMiddleware;

  return async (req, response, next) => {
    const token = getAuthToken(req);
    if (!token) {
      response.statusCode = '400';
      response.send('Not set authorization headers');
      return;
    }

    const jwtData = getTokenData(token);
    if (!jwtData) 
      return additionalMiddleware(req, response, next);

    try {
      response.locals.data =  await getAuthData(config.serviceId, config.provider, token, jwtData);
    } catch(e) {
      response.statusCode = '401';
      response.send('Not right authorization ' + e.toString());
      return;
    }
    

    next();
  };
};
