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
  authMiddleware = require('../authMiddleware');

module.exports = (ctx) => {

  before (async () => {
    ctx.authPid = spawn('node', ['tests/utils/authProxy.js'], {env: process.env, stdio: 'ignore'});
    ctx.provider = 'http://localhost:' + config.httpPort;
    await Promise.delay(5000);
  });

  it('auth middleware - call without parameters - error', async () => {
    expect(function () { authMiddleware(); }).to.throw();
  });

  it ('auth middleware - call with right parameters - call next function', async () => {
    
    const auth = authMiddleware({
      serviceId: config.scope,
      provider: ctx.provider
    });

    const req = {
      headers: {
        authorization: 'Bearer ' + config.tokens[0]
      }
    };
    
    const response = {
      status: 0,
      locals: {},
      statusText: 'sdfsdf',
      send: function (msg) {
        this.statusText = msg;
      }
    };

    const result = await new Promise(res => {
      auth(req, response, function () {
        res('success');
      });
    });
    expect(result).to.equal('success');
  });


  it ('auth middleware - call with empty auth headers - get 400 error', async () => {
    
    const auth = authMiddleware({
      serviceId: config.scope,
      provider: ctx.provider
    });

    const req = {};
    const response = {
      statusCode: 0,
      sendText: 0,
      send: function (msg) {
        this.sendText = msg;
      }
    };

    await auth(req, response);
    expect(response.statusCode).to.equal('400');
    expect(response.sendText).to.equal('Not set authorization headers');
  });



  it ('auth middleware - call with not Bearer string - get 400 error', async () => {
    
    const auth = authMiddleware({
      serviceId: config.scope,
      provider: ctx.provider
    });

    const req = {
      headers: {
        authorization: 'sdfsdfsd sdfsdf'
      }
    };
    const response = {
      statusCode: 0,
      sendText: 0,
      send: function (msg) {
        this.sendText = msg;
      }
    };

    await auth(req, response);
    expect(response.statusCode).to.equal('400');
    expect(response.sendText).to.equal('Not set authorization headers');
  });


  it ('auth middleware - call with not jwt string and without additional middleware - get 400 error', async () => {
    
    const auth = authMiddleware({
      serviceId: config.scope,
      provider: ctx.provider
    });

    const req = {
      headers: {
        authorization: 'Bearer not right token'
      }
    };
    const response = {
      statusCode: 0,
      sendText: 0,
      send: function (msg) {
        this.sendText = msg;
      }
    };

    await auth(req, response);
    expect(response.statusCode).to.equal('400');
    expect(response.sendText).to.equal('Not jwt token');
  });



  it ('auth middleware - call with not jwt string and with additional middleware - get additional middleware', async () => {
    const req = {
      headers: {
        authorization: 'Bearer not_right'
      }
    };
    const res = {
      status: 'use_additional'
    };

    const additionalMiddleware = (req, res, next) => {
      expect(req.headers.authorization).to.equal('Bearer not_right');
      res.status = 'use_additional';
    };
    const auth = authMiddleware({
      serviceId: config.scope,
      provider: ctx.provider
    }, additionalMiddleware);

    auth(req, res, () => {});
    expect(res.status).to.equal('use_additional');
  });



  it ('auth middleware - call with not right jwt string - get 401 error', async () => {
    
    const auth = authMiddleware({
      serviceId: config.scope,
      provider: ctx.provider
    });

    const req = {
      headers: {
        authorization: 'Bearer ' + config.notRightToken
      }
    };
    const response = {
      statusCode: 0,
      sendText: 0,
      send: function (msg) {
        this.sendText = msg;
      }
    };

    await auth(req, response);
    expect(response.statusCode).to.equal('400');
  });




  after (async () => {
    ctx.authPid.kill();
  });
};
