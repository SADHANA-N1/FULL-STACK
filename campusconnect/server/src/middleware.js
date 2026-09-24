const jwt = require('jsonwebtoken'), multer = require('multer');
const secret = () => process.env.JWT_SECRET || 'dev-secret';

const auth = (req, res, next) => {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token missing' });
  try { req.user = jwt.verify(token, secret()); next(); }
  catch { res.status(401).json({ error: 'Invalid or expired token' }); }
};
const requireRole = role => (req, res, next) =>
  req.user && req.user.role === role ? next() : res.status(403).json({ error: 'Forbidden' });
const validate = schema => (req, res, next) => {
  const r = schema.safeParse(req.body);
  if (!r.success) return res.status(400).json({ error: r.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ') });
  req.body = r.data; next();
};
const upload = multer({
  dest: 'uploads/', limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (q, f, cb) => {
    if (/\.(pdf|docx)$/i.test(f.originalname)) return cb(null, true);
    const e = new Error('Only PDF or DOCX files are allowed'); e.status = 400; cb(e);
  }
});
const errorHandler = (e, req, res, next) => {
  if (e.code === '23505') return res.status(409).json({ error: 'Already exists' });
  if (e.code === '22P02') return res.status(400).json({ error: 'Invalid id' });
  if (e.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File larger than 10 MB' });
  if (e.status) return res.status(e.status).json({ error: e.message });
  console.error(e); res.status(500).json({ error: 'Server error' });
};
module.exports = { auth, requireRole, validate, upload, errorHandler, secret };
