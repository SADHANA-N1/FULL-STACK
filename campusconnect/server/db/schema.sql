CREATE TABLE IF NOT EXISTS users(
  id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  role VARCHAR(10) NOT NULL DEFAULT 'student' CHECK (role IN ('student','admin')),
  created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS events(
  id SERIAL PRIMARY KEY, title VARCHAR(150) NOT NULL, description TEXT,
  category VARCHAR(20) NOT NULL CHECK (category IN ('workshop','hackathon','placement')),
  venue VARCHAR(150), event_date TIMESTAMPTZ NOT NULL, capacity INT NOT NULL CHECK (capacity > 0),
  created_by INT REFERENCES users(id), created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS registrations(
  id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id) ON DELETE CASCADE,
  event_id INT REFERENCES events(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ DEFAULT now(), UNIQUE (user_id, event_id));
CREATE TABLE IF NOT EXISTS resources(
  id SERIAL PRIMARY KEY, title VARCHAR(150) NOT NULL, subject VARCHAR(100) NOT NULL,
  semester INT NOT NULL CHECK (semester BETWEEN 1 AND 8), file_path VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL, uploaded_by INT REFERENCES users(id), created_at TIMESTAMPTZ DEFAULT now());
-- Indexes (for the bonus: drop these, run EXPLAIN ANALYZE, recreate, run again)
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_reg_event ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_reg_user ON registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_res_subject_sem ON resources(subject, semester);
