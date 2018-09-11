/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg11gmail.com>
 */

require('dotenv/config');
process.env.LOG_LEVEL = 'error';

const config = require('./config'),
  spawn = require('child_process').spawn,
  Promise = require('bluebird'),
  expect = require('chai').expect,
  Token = require('../Token');

module.exports = (ctx) => {

  before (async () => {
    ctx.authPid = spawn('node', ['tests/utils/authProxy.js'], {env: process.env, stdio: 'ignore'});
    ctx.provider = 'http://localhost:' + config.httpPort;
    await Promise.delay(5000);
  });

  // it('Token - constructor without parameters - error', async () => {
  //   expect(function () { new Token(); }).to.throw();
  // });

  it ('Token - constructor with right parameters - get token', async () => {
    const tokenLib = new Token({
      id: config.clientId,
      provider: ctx.provider,
      secret: config.secret
    });

    const token = await tokenLib.getToken([config.scope]);
    expect(token).to.be.equal(config.tokens[0]);
  });


  it ('Token - constructor with right parameters - get userToken', async () => {
    const tokenLib = new Token({
      id: config.clientId,
      provider: ctx.provider,
      secret: config.secret
    });

    const userToken = await tokenLib.getUserToken(config.userId, [config.scope]);
    expect(userToken).to.be.equal(config.userTokens[0]);
  });


  it ('Token - constructor with right parameters - wait for timeout and get after refresh token', async () => {
    const tokenLib = new Token({
      id: config.clientId,
      provider: ctx.provider,
      secret: config.secret
    });

    let token = await tokenLib.getToken([config.scope]);
    await Promise.delay(1000);
    token = await tokenLib.getToken([config.scope]);
    expect(token).to.be.equal(config.tokens[1]);
  });


  it ('Token - constructor with right parameters - wait for timeout, more than refresh stales, and get new token', async () => {
    const tokenLib = new Token({
      id: config.clientId,
      provider: ctx.provider,
      secret: config.secret
    });

    let token = await tokenLib.getToken([config.scope]);
    await Promise.delay(7000);
    token = await tokenLib.getToken([config.scope]);
    expect(token).to.be.equal(config.tokens[0]);
  });


  it ('Token - constructor with right parameters - get userToken, wait for Timeout and get new Token', async () => {
    const tokenLib = new Token({
      id: config.clientId,
      provider: ctx.provider,
      secret: config.secret
    });

    const oldToken = await tokenLib.getUserToken(config.userId, [config.scope]);
    await Promise.delay(1000);
    const token = await tokenLib.getUserToken(config.userId, [config.scope]);
    expect(token).to.not.be.equal(oldToken);
    expect(config.userTokens).to.includes(token);
  });


  it ('Token - constructor with right parameters - get userToken for one user and get another userToken for another user', async () => {
    const tokenLib = new Token({
      id: config.clientId,
      provider: ctx.provider,
      secret: config.secret
    });

    const oldToken = await tokenLib.getUserToken(config.userId, [config.scope]);
    const token = await tokenLib.getUserToken('bart', [config.scope]);
    expect(token).to.not.be.equal(oldToken);
  });

  after (async () => {
    ctx.authPid.kill();
  });
};
