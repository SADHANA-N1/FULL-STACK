const r = require('express').Router(), bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken');
const { z } = require('zod'), rateLimit = require('express-rate-limit');
const db = require('../db'), { validate, secret } = require('../middleware');

const sign = u => jwt.sign({ id: u.id, role: u.role, name: u.name }, secret(), { expiresIn: '1d' });
const signupSchema = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(6) });
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, message: { error: 'Too many login attempts. Try again in 15 minutes.' } });

r.post('/signup', validate(signupSchema), async (req, res) => {
  const { name, email, password } = req.body;
  const { rows } = await db.query(
    'INSERT INTO users(name,email,password_hash) VALUES($1,$2,$3) RETURNING id,name,role',
    [name, email.toLowerCase(), await bcrypt.hash(password, 10)]);
  res.status(201).json({ token: sign(rows[0]), user: rows[0] });
});

r.post('/login', limiter, validate(loginSchema), async (req, res) => {
  const { rows } = await db.query('SELECT * FROM users WHERE email=$1', [req.body.email.toLowerCase()]);
  const u = rows[0];
  if (!u || !(await bcrypt.compare(req.body.password, u.password_hash)))
    return res.status(401).json({ error: 'Invalid email or password' });
  res.json({ token: sign(u), user: { id: u.id, name: u.name, role: u.role } });
});
module.exports = r;
