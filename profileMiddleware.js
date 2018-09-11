/**
* Copyright 2017–2018, LaborX PTY
* Licensed under the AGPL Version 3 license.
* @author Kirill Sergeev <cloudkserg11@gmail.com>
*/
const _ = require('lodash'),
  request = require('request-promise');

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

const getAddressesFromLaborx = async (provider, token) => {
  const response = await request({
    method: 'POST',
    uri: provider + '/signin/signature/chronomint',
    json: true,
    headers: {
      'Authorization': 'Bearer ' + token
    }
  });
  if (_.get(response, 'addresses', null) == null) 
    throw new Error('not found addresses from auth response ' + response);
  return response.addresses;
};

/**
 * 
 * @param {{provider: String}} config 
 * @returns {Function}
 */
module.exports = (config) => {
  const provider = config.provider;

  /**
   * @param {Request} request
   * @param {Response} response
   * @param {Function} next
   * @returns {any}
   */
  return async (req, response, next) => {
    const token = getAuthToken(req);
    if (!token) {
      response.statusCode = '400';
      response.send('Not set authorization headers');
      return;
    }

    try {
      response.locals.data =  await getAddressesFromLaborx(provider, token);
    } catch (err) {
      response.statusCode = '401';
      response.send('Not set right authorization ' + err.toString());
      return;
    }
    next();
  };
};
