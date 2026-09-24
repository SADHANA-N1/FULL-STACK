const r = require('express').Router(), { z } = require('zod'), db = require('../db');
const { auth, requireRole, validate } = require('../middleware'), { hasSeats } = require('../seats');

const schema = z.object({
  title: z.string().min(3), description: z.string().optional(), venue: z.string().optional(),
  category: z.enum(['workshop', 'hackathon', 'placement']),
  event_date: z.string().refine(d => !isNaN(Date.parse(d)), 'invalid date'),
  capacity: z.coerce.number().int().positive()
});
r.use(auth);

r.get('/', async (req, res) => {
  const { search = '', category = '', date = '' } = req.query;
  const page = Math.max(+req.query.page || 1, 1), limit = Math.min(+req.query.limit || 10, 50);
  const args = [search, category, date || null];
  const where = `WHERE ($1='' OR e.title ILIKE '%'||$1||'%') AND ($2='' OR e.category=$2)
                 AND ($3::date IS NULL OR e.event_date::date=$3::date)`;
  const { rows } = await db.query(
    `SELECT e.*, e.capacity-COUNT(g.id)::int AS seats_left,
            COALESCE(BOOL_OR(g.user_id=$4),false) AS registered
     FROM events e LEFT JOIN registrations g ON g.event_id=e.id ${where}
     GROUP BY e.id ORDER BY e.event_date LIMIT ${limit} OFFSET ${(page - 1) * limit}`, [...args, req.user.id]);
  const { rows: [{ n }] } = await db.query(`SELECT COUNT(*)::int n FROM events e ${where}`, args);
  res.json({ data: rows, page, total: n, pages: Math.max(Math.ceil(n / limit), 1) });
});

r.post('/', requireRole('admin'), validate(schema), async (req, res) => {
  const b = req.body;
  const { rows } = await db.query(
    'INSERT INTO events(title,description,category,venue,event_date,capacity,created_by) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *',
    [b.title, b.description, b.category, b.venue, b.event_date, b.capacity, req.user.id]);
  res.status(201).json(rows[0]);
});

r.put('/:id', requireRole('admin'), validate(schema), async (req, res) => {
  const b = req.body;
  const { rows } = await db.query(
    'UPDATE events SET title=$1,description=$2,category=$3,venue=$4,event_date=$5,capacity=$6 WHERE id=$7 RETURNING *',
    [b.title, b.description, b.category, b.venue, b.event_date, b.capacity, req.params.id]);
  rows[0] ? res.json(rows[0]) : res.status(404).json({ error: 'Event not found' });
});

r.delete('/:id', requireRole('admin'), async (req, res) => {
  const { rowCount } = await db.query('DELETE FROM events WHERE id=$1', [req.params.id]);
  rowCount ? res.json({ message: 'Deleted' }) : res.status(404).json({ error: 'Event not found' });
});

r.post('/:id/register', requireRole('student'), async (req, res) => {
  const c = await db.connect();
  try {
    await c.query('BEGIN');
    const { rows: [e] } = await c.query('SELECT capacity FROM events WHERE id=$1 FOR UPDATE', [req.params.id]);
    if (!e) { await c.query('ROLLBACK'); return res.status(404).json({ error: 'Event not found' }); }
    const { rows: [{ n }] } = await c.query('SELECT COUNT(*)::int n FROM registrations WHERE event_id=$1', [req.params.id]);
    if (!hasSeats(e.capacity, n)) { await c.query('ROLLBACK'); return res.status(409).json({ error: 'Event is full' }); }
    await c.query('INSERT INTO registrations(user_id,event_id) VALUES($1,$2)', [req.user.id, req.params.id]);
    await c.query('COMMIT');
    res.status(201).json({ message: 'Registered' });
  } catch (err) {
    await c.query('ROLLBACK');
    if (err.code === '23505') return res.status(409).json({ error: 'You are already registered' });
    throw err;
  } finally { c.release(); }
});

r.delete('/:id/register', requireRole('student'), async (req, res) => {
  const { rowCount } = await db.query('DELETE FROM registrations WHERE user_id=$1 AND event_id=$2', [req.user.id, req.params.id]);
  rowCount ? res.json({ message: 'Unregistered' }) : res.status(404).json({ error: 'Not registered' });
});

r.get('/:id/registrations', requireRole('admin'), async (req, res) => {
  const { rows } = await db.query(
    `SELECT u.id,u.name,u.email,g.registered_at FROM registrations g JOIN users u ON u.id=g.user_id
     WHERE g.event_id=$1 ORDER BY g.registered_at`, [req.params.id]);
  res.json(rows);
});
module.exports = r;
