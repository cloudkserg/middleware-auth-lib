/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg11gmail.com>
 */

require('dotenv/config');
process.env.LOG_LEVEL = 'error';

const authTests = require('./authMiddleware'),
  profileTests = require('./profileMiddleware'),
  tokenTests = require('./Token'),
  ctx = {};

describe('core/middleware-auth-lib', function () {
  describe('authMiddleware', () => authTests(ctx));
  describe('profileMiddleware', () => profileTests(ctx));
  describe('Token', () => tokenTests(ctx));
});
