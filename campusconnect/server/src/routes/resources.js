const r = require('express').Router(), path = require('path'), fs = require('fs'), db = require('../db');
const { auth, requireRole, upload } = require('../middleware');
r.use(auth);

r.get('/', async (req, res) => {
  const { subject = '', semester = '' } = req.query;
  const page = Math.max(+req.query.page || 1, 1), limit = Math.min(+req.query.limit || 10, 50);
  const args = [subject, semester || null];
  const where = `WHERE ($1='' OR subject ILIKE '%'||$1||'%') AND ($2::int IS NULL OR semester=$2::int)`;
  const { rows } = await db.query(
    `SELECT id,title,subject,semester,file_name,created_at FROM resources ${where}
     ORDER BY created_at DESC LIMIT ${limit} OFFSET ${(page - 1) * limit}`, args);
  const { rows: [{ n }] } = await db.query(`SELECT COUNT(*)::int n FROM resources ${where}`, args);
  res.json({ data: rows, page, total: n, pages: Math.max(Math.ceil(n / limit), 1) });
});

r.post('/', requireRole('admin'), upload.single('file'), async (req, res) => {
  const { title, subject, semester } = req.body;
  if (!req.file) return res.status(400).json({ error: 'File is required' });
  if (!title || !subject || !(+semester >= 1 && +semester <= 8)) {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: 'Title, subject and semester (1-8) are required' });
  }
  const { rows } = await db.query(
    'INSERT INTO resources(title,subject,semester,file_path,file_name,uploaded_by) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,title,subject,semester',
    [title, subject, +semester, req.file.path, req.file.originalname, req.user.id]);
  res.status(201).json(rows[0]);
});

r.get('/:id/download', async (req, res) => {
  const { rows: [f] } = await db.query('SELECT file_path,file_name FROM resources WHERE id=$1', [req.params.id]);
  if (!f) return res.status(404).json({ error: 'Resource not found' });
  res.download(path.resolve(f.file_path), f.file_name);
});

r.delete('/:id', requireRole('admin'), async (req, res) => {
  const { rows: [f] } = await db.query('DELETE FROM resources WHERE id=$1 RETURNING file_path', [req.params.id]);
  if (!f) return res.status(404).json({ error: 'Resource not found' });
  fs.unlink(f.file_path, () => {});
  res.json({ message: 'Deleted' });
});
module.exports = r;
