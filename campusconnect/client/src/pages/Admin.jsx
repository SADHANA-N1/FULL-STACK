import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';

export default function Admin() {
  const [ev, setEv] = useState([]);
  const [regs, setRegs] = useState({});
  const [msg, setMsg] = useState('');
  const [f, setF] = useState({ title: '', category: 'workshop', venue: '', event_date: '', capacity: 50, description: '' });
  const [rf, setRf] = useState({ title: '', subject: '', semester: 1, file: null });
  const load = () => api.get('/events', { params: { limit: 50 } }).then(r => setEv(r.data.data));
  useEffect(() => { load(); }, []);
  const run = async fn => { try { await fn(); setMsg('Saved.'); load(); } catch (e) { setMsg(errMsg(e)); } };
  const addEvent = e => {
    e.preventDefault();
    if (f.title.trim().length < 3 || !f.event_date || +f.capacity < 1) return setMsg('Enter a title (3+ characters), a date and a capacity of at least 1.');
    run(() => api.post('/events', f));
  };
  const upload = e => {
    e.preventDefault();
    if (!rf.file || !rf.title || !rf.subject) return setMsg('Enter a title, subject and choose a PDF or DOCX file.');
    const fd = new FormData();
    ['title', 'subject', 'semester'].forEach(k => fd.append(k, rf[k])); fd.append('file', rf.file);
    run(() => api.post('/resources', fd));
  };
  const toggle = async id => {
    if (regs[id]) return setRegs({ ...regs, [id]: null });
    const { data } = await api.get(`/events/${id}/registrations`); setRegs({ ...regs, [id]: data });
  };
  const s = k => e => setF({ ...f, [k]: e.target.value });
  const r = k => e => setRf({ ...rf, [k]: e.target.value });
  return (
    <div>
      <h2>Manage events and resources</h2>
      {msg && <p className="err">{msg}</p>}
      <div className="grid">
        <form className="card" onSubmit={addEvent}>
          <h3>New event</h3>
          <input placeholder="Title" value={f.title} onChange={s('title')} />
          <select value={f.category} onChange={s('category')}>
            <option value="workshop">Workshop</option><option value="hackathon">Hackathon</option><option value="placement">Placement drive</option>
          </select>
          <input placeholder="Venue" value={f.venue} onChange={s('venue')} />
          <input type="datetime-local" value={f.event_date} onChange={s('event_date')} />
          <input type="number" min="1" placeholder="Capacity" value={f.capacity} onChange={s('capacity')} />
          <input placeholder="Description" value={f.description} onChange={s('description')} />
          <button>Create event</button>
        </form>
        <form className="card" onSubmit={upload}>
          <h3>Upload resource</h3>
          <input placeholder="Title" value={rf.title} onChange={r('title')} />
          <input placeholder="Subject" value={rf.subject} onChange={r('subject')} />
          <select value={rf.semester} onChange={r('semester')}>{[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>Semester {n}</option>)}</select>
          <input type="file" accept=".pdf,.docx" onChange={e => setRf({ ...rf, file: e.target.files[0] })} />
          <button>Upload file</button>
        </form>
      </div>
      <h3>All events</h3>
      {ev.map(e => (
        <div className="card" key={e.id}>
          <div className="row">
            <div><b>{e.title}</b><br />{new Date(e.event_date).toLocaleString()}, {e.capacity - e.seats_left} of {e.capacity} registered</div>
            <div>
              <button className="ghost" onClick={() => toggle(e.id)}>{regs[e.id] ? 'Hide students' : 'View students'}</button>{' '}
              <button className="danger" onClick={() => window.confirm('Delete this event?') && run(() => api.delete('/events/' + e.id))}>Delete</button>
            </div>
          </div>
          {regs[e.id] && (regs[e.id].length ? regs[e.id].map(u => <p key={u.id}>{u.name} ({u.email})</p>) : <p>No students registered yet.</p>)}
        </div>
      ))}
    </div>
  );
}
