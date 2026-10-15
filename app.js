import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { findUser, addUser } from './store.js';
import { hashPassword, passwordMatches, issueToken, requireToken } from './auth.js';

const app = express();
const here = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json());
app.use(express.static(path.join(here, '..', 'public'))); // the little try-it page

const isText = (v) => typeof v === 'string';

app.post('/register', (req, res) => {
  const { username, password } = req.body || {};
  const name = isText(username) ? username.trim() : '';

  if (!name || !isText(password) || password.length < 6) {
    return res.status(400).json({ error: 'Invalid input' });
  }
  if (findUser(name)) {
    return res.status(409).json({ error: 'Username already exists' });
  }

  addUser(name, hashPassword(password));
  res.status(201).json({ message: 'User registered' });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = isText(username) ? findUser(username.trim()) : undefined;

  // same answer for "no such user" and "wrong password"
  if (!user || !isText(password) || !passwordMatches(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  res.status(200).json({ token: issueToken(user.username) });
});

app.get('/profile', requireToken, (req, res) => {
  res.status(200).json({ username: req.user.username });
});

// a broken JSON body shouldn't produce an HTML stack trace
app.use((err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid input' });
  }
  res.status(500).json({ error: 'Something went wrong' });
});

export default app;
