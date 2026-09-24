const r = require('express').Router(), db = require('../db');
const { auth, requireRole } = require('../middleware');
r.use(auth);

r.get('/student', requireRole('student'), async (req, res) => {
  const { rows: events } = await db.query(
    `SELECT e.id,e.title,e.category,e.event_date,e.venue,g.registered_at FROM registrations g
     JOIN events e ON e.id=g.event_id WHERE g.user_id=$1 ORDER BY e.event_date`, [req.user.id]);
  const { rows: resources } = await db.query('SELECT id,title,subject,semester FROM resources ORDER BY created_at DESC LIMIT 5');
  res.json({ events, resources });
});

r.get('/admin', requireRole('admin'), async (req, res) => {
  const { rows: [t] } = await db.query(
    `SELECT (SELECT COUNT(*) FROM events)::int total_events,
            (SELECT COUNT(*) FROM registrations)::int total_registrations,
            (SELECT COUNT(*) FROM users WHERE role='student')::int total_students,
            (SELECT COUNT(*) FROM resources)::int total_resources`);
  const { rows: top } = await db.query(
    `SELECT e.id,e.title,COUNT(g.id)::int regs FROM events e LEFT JOIN registrations g ON g.event_id=e.id
     GROUP BY e.id ORDER BY regs DESC LIMIT 5`);
  res.json({ ...t, top });
});
module.exports = r;
