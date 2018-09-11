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
  profileMiddleware = require('../profileMiddleware');

module.exports = (ctx) => {

  before (async () => {
    ctx.authPid = spawn('node', ['tests/utils/laborxProxy.js'], {env: process.env, stdio: 'ignore'});
    ctx.provider = 'http://localhost:' + config.laborx.proxyPort + '/api/v1/security';
    await Promise.delay(5000);
  });

  it('profile middleware - call without parameters - error', async () => {
    expect(function () { profileMiddleware(); }).to.throw();
  });

  it ('profile middleware - call with right parameters - call next function', async () => {
    
    const profile = profileMiddleware({
      provider: ctx.provider
    });

    const req = {
      headers: {
        authorization: 'Bearer ' + config.laborx.token
      }
    };
    const response = {
      locals: {},
      send: function (msg) {
        console.error(msg);
      }
    };

    const result = await new Promise(res => profile(req, response, function () {
      res('success');
    }));
    expect(result).to.equal('success');
  });


  it ('profile middleware - call with empty auth headers - get 400 error', async () => {
    
    const profile = profileMiddleware({
      provider: ctx.provider
    });

    const req = {};
    const response = {
      statusCode: 0,
      sendText: 0,
      locals: {},
      send: function (msg) {
        this.sendText = msg;
      }
    };

    await profile(req, response);
    expect(response.statusCode).to.equal('400');
    expect(response.sendText).to.equal('Not set authorization headers');
  });



  it ('profile middleware - call with not Bearer string - get 400 error', async () => {
    
    const profile = profileMiddleware({
      provider: ctx.provider
    });

    const req = {
      headers: {
        authorization: 'sdfsdfsd sdfsdf'
      }
    };
    const response = {
      statusCode: 0,
      locals: {},
      sendText: 0,
      send: function (msg) {
        this.sendText = msg;
      }
    };

    await profile(req, response);
    expect(response.statusCode).to.equal('400');
    expect(response.sendText).to.equal('Not set authorization headers');
  });


  it ('profile middleware - call with not right token - get error', async () => {
    const profile = profileMiddleware({
      provider: ctx.provider
    });

    const req = {
      headers: {
        authorization: 'Bearer sdfdsdfsdf'
      }
    };
    const response = {
      statusCode: 0,
      locals: {},
      sendText: 0,
      send: function (msg) {
        this.sendText = msg;
      }
    };

    await profile(req, response);
    expect(response.statusCode).to.equal('401');
  });




  after (async () => {
    ctx.authPid.kill();
  });
};
