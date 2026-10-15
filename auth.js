import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

// Falls back to a dev secret so `npm start` works out of the box.
// Set JWT_SECRET properly for anything that isn't a lab machine.
export const SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';

// scrypt ships with Node, so no extra package for hashing.
export function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(plain, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function passwordMatches(plain, stored) {
  const [salt, hash] = stored.split(':');
  const attempt = crypto.scryptSync(plain, salt, 64);
  return crypto.timingSafeEqual(attempt, Buffer.from(hash, 'hex'));
}

export function issueToken(username) {
  return jwt.sign({ username }, SECRET, { algorithm: 'HS256', expiresIn: '1h' });
}

// Middleware: every failure mode (no header, junk token, bad signature, expired)
// gets the same 401 on purpose - we don't tell the caller which one it was.
export function requireToken(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    req.user = jwt.verify(token, SECRET, { algorithms: ['HS256'] });
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
