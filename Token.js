/**
* Copyright 2017–2018, LaborX PTY
* Licensed under the AGPL Version 3 license.
* @author Kirill Sergeev <cloudkserg11@gmail.com>
*/
const request = require('request-promise'),
  jwt = require('jsonwebtoken');

/**
 * 
 * 
 * @class TokenStorage
 * 
 * for saved tokens in cache
 */
class TokenStorage {

  constructor () {
    this.tokens = {};
    this.refreshes = {};
    this.userTokens = {};
  }

  getUserToken (userId, scopes) {
    if (!this.userTokens[userId]) 
      return false;
    return this.userTokens[userId][this._key(scopes)];
  }

  addUserToken (userId, scopes, token) {
    if (!this.userTokens[userId]) 
      this.userTokens[userId] = {};
    this.userTokens[userId][this._key(scopes)] = token;
  }

  _key (scopes) {
    return scopes.join(',');
  }

  getToken (scopes) {
    return this.tokens[this._key(scopes)];
  }


  addToken (scopes, token) {
    this.tokens[this._key(scopes)] = token;
  }

  addRefreshToken (scopes, token) {
    this.refreshes[this._key(scopes)] = token;
  }


  getRefreshToken (scopes) {
    return this.refreshes[this._key(scopes)];
  }

}

/**
 * minimum timeout we ready valid token
 * if token valid les than this value - reload token
 */
const TIMEOUT_TOKEN_YET = 10;

/**
 * 
 * 
 * @class Token
 * 
 * class for work with token for middleware-auth-service
 * 
 * in constructor get config with parameters
 * provider - path to auth provider (http://localhost:8082)
 * secret - pass of service
 * id - id of service
 * 
 * has two main functions
 * 
 * getToken(scopes) - get valid client Token for id and scopes
 *     (get new or get saved in cache or get reloaded by refresh)
 * 
 * getUserToken (userId, scopes) - get valid userToken for id, userId and scopes
 *    (get new or get saved in cache) 
 *    (if needed - reloading main token by function getToken)
 * 
 */
class Token {

  /**
   * Creates an instance of Token.
   * @param {id: String, provider: String, secret: String} config 
   * 
   * @memberOf Token
   */
  constructor (config) {
    if (!config.id || !config.provider || !config.secret)
      throw new Error('not found for id or provider or secret');
    this.id = config.id;
    this.provider = config.provider;
    this.secret = config.secret;
    this.storage = new TokenStorage();
  }

  _isValidToken (token) {
    const tokenData = jwt.decode(token);
    return (tokenData.exp - Math.floor(Date.now()/1000)) >= TIMEOUT_TOKEN_YET;
  }

  async _refreshToken (refreshToken, scopes) {
    const response = await request(`${this.provider}/tokens/refresh`, {
      method: 'POST',
      json: {
        token: refreshToken
      }
    });
    this.storage.addToken(scopes, response.token);
    return response.token;
  }

  async _reloadUserToken (token, userId, scopes) {
    const response = await request(`${this.provider}/user/tokens`, {
      method: 'POST',
      json: {
        token: token,
        userId,
        scopes
      }
    });
    return response.token;
  }

  async _reloadToken (scopes) {
    const response = await request(`${this.provider}/tokens`, {
      method: 'POST',
      json: {
        id: this.id,
        secret: this.secret,
        scopes
      }
    });
    this.storage.addToken(scopes, response.token);
    this.storage.addRefreshToken(scopes, response.refreshToken);
    return response.token;
  }

  async _reloadInvalidToken (token, scopes) {
    if (token) {
      const refreshToken = this.storage.getRefreshToken(scopes);
      if (this._isValidToken(refreshToken))
        return await this._refreshToken(refreshToken, scopes);
    }
    
    return await this._reloadToken(scopes);
  }

  /**
   * 
   * 
   * @param {Array} scopes 
   * @returns {String}
   * 
   * @memberOf Token
   */
  async getToken (scopes) {
    let token = this.storage.getToken(scopes);
    if (token && this._isValidToken(token))
      return token;
    return await this._reloadInvalidToken(token, scopes);
  }

  async _reoladInvalidUserToken (userId, scopes) {
    const token = await this.getToken(scopes);
    return await this._reloadUserToken(token, userId, scopes);
  }


  /**
   * 
   * 
   * @param {String} userId 
   * @param {Array} scopes 
   * @returns {String}
   * 
   * @memberOf Token
   */
  async getUserToken (userId, scopes) {
    let token = this.storage.getUserToken(userId, scopes);
    if (token && this._isValidToken(token))
      return token;
    return await this._reoladInvalidUserToken(userId, scopes);
  }
}


module.exports = Token;
