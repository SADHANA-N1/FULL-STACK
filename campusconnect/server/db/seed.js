require('dotenv').config();
const fs = require('fs'), path = require('path'), bcrypt = require('bcryptjs'), db = require('../src/db');
(async () => {
  await db.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
  await db.query(`INSERT INTO users(name,email,password_hash,role) VALUES('Admin','admin@campus.com',$1,'admin') ON CONFLICT (email) DO NOTHING`, [await bcrypt.hash('Admin@123', 10)]);
  console.log('Schema ready. Admin: admin@campus.com / Admin@123');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
