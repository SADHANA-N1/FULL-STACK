import request from 'supertest';
import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { clearUsers } from '../src/store.js';
import { SECRET } from '../src/auth.js';

const creds = { username: 'meera', password: 'secret123' };
const signUp = () => request(app).post('/register').send(creds);
const logIn = async () => (await request(app).post('/login').send(creds)).body.token;

beforeEach(() => clearUsers());

describe('POST /register', () => {
  it('creates a user', async () => {
    const res = await signUp();
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ message: 'User registered' });
  });

  it.each([
    ['no username', { password: 'secret123' }],
    ['blank username', { username: '   ', password: 'secret123' }],
    ['no password', { username: 'meera' }],
    ['short password', { username: 'meera', password: '12345' }],
  ])('rejects %s', async (_label, body) => {
    const res = await request(app).post('/register').send(body);
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid input' });
  });

  it('refuses a taken username', async () => {
    await signUp();
    const res = await signUp();
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: 'Username already exists' });
  });
});

describe('POST /login', () => {
  it('returns a token that holds the username and lasts one hour', async () => {
    await signUp();
    const res = await request(app).post('/login').send(creds);
    expect(res.status).toBe(200);

    const payload = jwt.verify(res.body.token, SECRET);
    expect(payload.username).toBe('meera');
    expect(payload.exp - payload.iat).toBe(3600);
  });

  it('rejects a wrong password and an unknown user the same way', async () => {
    await signUp();
    const wrong = await request(app).post('/login').send({ ...creds, password: 'nope-nope' });
    const ghost = await request(app).post('/login').send({ username: 'ghost', password: 'secret123' });
    for (const res of [wrong, ghost]) {
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Invalid credentials' });
    }
  });
});

describe('GET /profile', () => {
  it('shows the username for a good token', async () => {
    await signUp();
    const res = await request(app).get('/profile').set('Authorization', `Bearer ${await logIn()}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ username: 'meera' });
  });

  it('rejects a missing header', async () => {
    const res = await request(app).get('/profile');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
  });

  it('rejects a malformed token', async () => {
    const res = await request(app).get('/profile').set('Authorization', 'Bearer not.a.jwt');
    expect(res.status).toBe(401);
  });

  it('rejects a token signed with a different secret', async () => {
    const forged = jwt.sign({ username: 'meera' }, 'someone-elses-secret');
    const res = await request(app).get('/profile').set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });

  it('rejects an expired token', async () => {
    const stale = jwt.sign({ username: 'meera' }, SECRET, { expiresIn: -10 });
    const res = await request(app).get('/profile').set('Authorization', `Bearer ${stale}`);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
  });
});
