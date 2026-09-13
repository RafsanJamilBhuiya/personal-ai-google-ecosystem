import test from 'node:test';
import assert from 'node:assert/strict';
import { authConfigured, authConstants, sessionCookie, clearSessionCookie } from '../../backend/security/auth.js';

test('auth configuration requires the complete admin verification chain', () => {
  const env={OAUTH_TOKEN_STORE:{},GOOGLE_OAUTH_CLIENT_ID:'id',GOOGLE_OAUTH_CLIENT_SECRET:'secret',GOOGLE_OAUTH_REDIRECT_URI:'https://example.test/callback',ADMIN_GOOGLE_EMAIL:'admin@example.test',OAUTH_STATE_SECRET:'state',TELEGRAM_BOT_TOKEN:'bot',TELEGRAM_CHAT_ID:'chat'};
  assert.equal(authConfigured(env),true);
  assert.equal(authConfigured({...env,GOOGLE_OAUTH_CLIENT_SECRET:''}),false);
  assert.equal(authConfigured({...env,TELEGRAM_CHAT_ID:''}),false);
});

test('authentication time limits are fixed and bounded', () => {
  assert.equal(authConstants.OTP_TTL,300);
  assert.equal(authConstants.MAX_ATTEMPTS,5);
  assert.equal(authConstants.INACTIVITY_MS,3*60*60*1000);
  assert.equal(authConstants.SESSION_MAX_MS,24*60*60*1000);
});

test('session cookies are HttpOnly, Secure and cross-site compatible', () => {
  const cookie=sessionCookie('session-id');
  assert.match(cookie,/HttpOnly/); assert.match(cookie,/Secure/); assert.match(cookie,/SameSite=None/); assert.match(cookie,/Max-Age=86400/);
  assert.match(clearSessionCookie,/Max-Age=0/);
});
