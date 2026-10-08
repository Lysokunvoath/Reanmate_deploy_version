import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { Reflector } from '@nestjs/core';
import { verifyPassword } from 'better-auth/crypto';
import { createApp } from '../dist/create-app.js';
import { DatabaseService } from '../dist/database/database.service.js';
import { AUTH_INSTANCE } from '../dist/auth/auth.constants.js';
import { AuthGuard } from '../dist/auth/auth.guard.js';
import { ROLES_KEY } from '../dist/auth/auth.decorators.js';

process.env.AUTH_EMAIL_DELIVERY = 'console';

// Uses only accounts created by this run; never drops or clears a database.
test('MongoDB authentication integration', { timeout: 120000 }, async (t) => {
  assert.ok(process.env.MONGODB_URI, 'Configure MONGODB_URI before running integration tests');
  let app = await createApp();
  await app.listen(0, '127.0.0.1');
  let base = await app.getUrl();
  let database = app.get(DatabaseService);
  const email = `reanmate-test-${randomUUID()}@example.com`;
  const otpEmail = `reanmate-otp-${randomUUID()}@example.com`;
  const password = randomBytes(24).toString('base64url');
  let activePassword = password;
  const testIp = `198.18.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
  let cookie;
  let storedUser;
  let requestNumber = 0;
  const origin = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
  async function request(path, { body, session = cookie, headers = {}, ip } = {}) {
    const response = await fetch(`${base}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        origin, 'content-type': 'application/json',
        'x-forwarded-for': ip ?? `198.19.${testIp.split(".")[2]}.${++requestNumber}`,
        ...(session ? { cookie: session } : {}), ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { response, data: await response.json().catch(() => null) };
  }
  function getCookie(response) {
    return response.headers.getSetCookie().map((value) => value.split(';')[0]).join('; ');
  }
  try {
    await t.test('anonymous and forged sessions cannot access /auth/me', async () => {
      assert.equal((await request('/auth/me')).response.status, 401);
      assert.equal((await request('/auth/get-session')).data, null);
      assert.equal((await request('/auth/me', { session: 'better-auth.session_token=forged' })).response.status, 401);
    });
    await t.test('registration persists a student with a hashed password and secure cookie attributes', async () => {
      const { response, data } = await request('/auth/sign-up/email', {
        body: { name: '  សិស្សសាកល្បង  ', email, password, role: 'admin' },
      });
      assert.equal(response.status, 200, JSON.stringify(data));
      assert.equal(data.user.role, 'student', 'signup must not accept admin role');
      assert.equal(data.user.name, 'សិស្សសាកល្បង');
      cookie = getCookie(response);
      assert.match(response.headers.get('set-cookie'), /HttpOnly/i);
      assert.match(response.headers.get('set-cookie'), /SameSite=Lax/i);
      assert.match(response.headers.get('set-cookie'), /Max-Age=/i);
      storedUser = await database.db.collection('user').findOne({ email });
      assert.ok(storedUser);
      const account = await database.db.collection('account').findOne({ userId: storedUser._id });
      assert.ok(account?.password);
      assert.notEqual(account.password, password);
      assert.equal(await verifyPassword({ hash: account.password, password }), true);
      assert.ok(await database.db.collection('session').findOne({ userId: storedUser._id }));
      const me = await request('/auth/me');
      assert.equal(me.response.status, 200);
      assert.deepEqual(me.data.user, { id: data.user.id, email, displayName: data.user.name, role: 'student' });
      assert.match(me.response.headers.get('cache-control'), /no-store/);
      assert.equal(response.headers.get('access-control-allow-origin'), origin);
    });
    await t.test('duplicate registration and invalid inputs are rejected', async () => {
      const duplicate = await request('/auth/sign-up/email', { body: { name: 'Duplicate', email: email.toUpperCase(), password } });
      assert.ok([400, 422].includes(duplicate.response.status), JSON.stringify(duplicate.data));
      for (const body of [
        { name: 'Test', email, password: 'short' },
        { name: 'Test', email: 'invalid-email', password },
      ]) {
        assert.ok((await request('/auth/sign-up/email', { body })).response.status >= 400);
      }
      assert.equal(await database.db.collection('user').countDocuments({ email }), 1);
    });
    await t.test('email OTP sign-in endpoints are disabled', async () => {
      const send = await request('/auth/email-otp/send-verification-otp', {
        body: { email: otpEmail, type: 'sign-in' },
        session: '',
      });
      assert.equal(send.response.status, 404, JSON.stringify(send.data));
      assert.equal(send.data.code, 'OTP_SIGN_IN_DISABLED');
      const login = await request('/auth/sign-in/email-otp', {
        body: { email: otpEmail, otp: '123456' },
        session: '',
      });
      assert.equal(login.response.status, 404, JSON.stringify(login.data));
      assert.equal(login.data.code, 'OTP_SIGN_IN_DISABLED');
    });
    await t.test('forgot password uses an email code and updates the credential password', async () => {
      const nextPassword = randomBytes(24).toString('base64url');
      const send = await request('/auth/email-otp/request-password-reset', {
        body: { email },
        session: '',
      });
      assert.equal(send.response.status, 200, JSON.stringify(send.data));
      assert.equal(send.data.success, true);
      const verification = await database.db.collection('verification').findOne({ identifier: `forget-password-otp-${email}` });
      assert.ok(verification?.value);
      const otp = verification.value.split(':')[0];
      assert.match(otp, /^\d{6}$/);
      const reset = await request('/auth/email-otp/reset-password', {
        body: { email, otp, password: nextPassword },
        session: '',
      });
      assert.equal(reset.response.status, 200, JSON.stringify(reset.data));
      assert.equal(reset.data.success, true);
      assert.equal((await request('/auth/sign-in/email', { body: { email, password }, session: '' })).response.status, 401);
      const login = await request('/auth/sign-in/email', {
        body: { email, password: nextPassword },
        session: '',
      });
      assert.equal(login.response.status, 200, JSON.stringify(login.data));
      activePassword = nextPassword;
    });
    await t.test('wrong passwords and untrusted origins are rejected', async () => {
      assert.equal((await request('/auth/sign-in/email', { body: { email, password: 'wrong-password' }, session: '' })).response.status, 401);
      assert.equal((await request('/auth/sign-in/email', { body: { email, password }, headers: { origin: 'https://untrusted.example' } })).response.status, 403);
    });
    await t.test('roles are checked against the database on every protected request', async () => {
      const guard = new AuthGuard(app.get(AUTH_INSTANCE), new Reflector());
      const handler = () => {};
      Reflect.defineMetadata(ROLES_KEY, ['admin'], handler);
      const context = { getHandler: () => handler, getClass: () => class {}, switchToHttp: () => ({ getRequest: () => ({ headers: { cookie } }) }) };
      await assert.rejects(guard.canActivate(context), (error) => error.getStatus() === 403);
      await database.db.collection('user').updateOne({ _id: storedUser._id }, { $set: { role: 'admin' } });
      assert.equal(await guard.canActivate(context), true);
      await database.db.collection('user').updateOne({ _id: storedUser._id }, { $set: { role: 'student' } });
      await assert.rejects(guard.canActivate(context), (error) => error.getStatus() === 403);
    });
    await t.test('session persists across backend restarts', async () => {
      await app.close();
      app = await createApp();
      await app.listen(0, '127.0.0.1');
      base = await app.getUrl();
      database = app.get(DatabaseService);
      assert.equal((await request('/auth/me')).response.status, 200);
    });
    await t.test('logout revokes the session; valid credentials create a new session', async () => {
      const oldCookie = cookie;
      assert.equal((await request('/auth/sign-out', { body: {} })).response.status, 200);
      assert.equal((await request('/auth/me', { session: oldCookie })).response.status, 401);
      assert.equal((await request('/auth/get-session', { session: oldCookie })).data, null);
      const login = await request('/auth/sign-in/email', { body: { email, password: activePassword }, session: '' });
      assert.equal(login.response.status, 200);
      cookie = getCookie(login.response);
      assert.notEqual(cookie, oldCookie);
      assert.equal((await request('/auth/me')).response.status, 200);
    });
    await t.test('expired sessions are refused immediately', async () => {
      await database.db.collection('session').updateMany({ userId: storedUser._id }, { $set: { expiresAt: new Date(0) } });
      assert.equal((await request('/auth/me')).response.status, 401);
    });
    await t.test('repeated login attempts are rate limited', async () => {
      let last;
      for (let i = 0; i < 11; i++) last = await request('/auth/sign-in/email', {
        body: { email, password: 'wrong-password' }, session: '', ip: testIp,
      });
      assert.equal(last.response.status, 429);
      assert.ok(Number(last.response.headers.get('x-retry-after')) > 0);
    });
  } finally {
    for (const cleanupEmail of [email, otpEmail]) {
      const user = await database.db.collection('user').findOne({ email: cleanupEmail });
      if (user) {
        await database.db.collection('session').deleteMany({ userId: user._id });
        await database.db.collection('account').deleteMany({ userId: user._id });
        await database.db.collection('user').deleteOne({ _id: user._id });
      }
    }
    await database.db.collection('verification').deleteMany({
      identifier: { $in: [`sign-in-otp-${otpEmail}`, `forget-password-otp-${email}`] },
    });
    await database.db.collection('rateLimit').deleteMany({ key: { $regex: `^198\\.(18|19)\\.${testIp.split('.')[2]}\\.` } });
    await app.close();
  }
});
