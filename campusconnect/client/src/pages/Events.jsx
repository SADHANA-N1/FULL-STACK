import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../auth';

export const Pager = ({ page, pages, set }) => (
  <div className="pager">
    <button className="ghost" disabled={page <= 1} onClick={() => set(page - 1)}>Previous</button>
    <span>Page {page} of {pages}</span>
    <button className="ghost" disabled={page >= pages} onClick={() => set(page + 1)}>Next</button>
  </div>
);

export default function Events() {
  const { user } = useAuth();
  const [q, setQ] = useState({ search: '', category: '', date: '' });
  const [page, setPage] = useState(1);
  const [d, setD] = useState({ data: [], pages: 1 });
  const [msg, setMsg] = useState('');
  const load = () => api.get('/events', { params: { ...q, page } }).then(r => setD(r.data)).catch(e => setMsg(errMsg(e)));
  useEffect(() => { load(); }, [q, page]);
  const change = k => e => { setQ({ ...q, [k]: e.target.value }); setPage(1); };
  const act = async ev => {
    try { ev.registered ? await api.delete(`/events/${ev.id}/register`) : await api.post(`/events/${ev.id}/register`); setMsg(''); load(); }
    catch (x) { setMsg(errMsg(x)); }
  };
  return (
    <div>
      <h2>Upcoming events</h2>
      <div className="filters">
        <input placeholder="Search by name" value={q.search} onChange={change('search')} />
        <select value={q.category} onChange={change('category')}>
          <option value="">All categories</option><option value="workshop">Workshop</option>
          <option value="hackathon">Hackathon</option><option value="placement">Placement drive</option>
        </select>
        <input type="date" value={q.date} onChange={change('date')} />
      </div>
      {msg && <p className="err">{msg}</p>}
      {d.data.length === 0 && <p>No events match. Try clearing the filters.</p>}
      <div className="grid">
        {d.data.map(e => (
          <div className="card" key={e.id}>
            <span className="tag">{e.category}</span>
            <h3>{e.title}</h3>
            <p>{e.description}</p>
            <p><b>{new Date(e.event_date).toLocaleString()}</b><br />{e.venue}</p>
            <p className={e.seats_left <= 0 ? 'err' : ''}>{e.seats_left} of {e.capacity} seats left</p>
            {user.role === 'student' && (
              <button className={e.registered ? 'ghost' : ''} disabled={!e.registered && e.seats_left <= 0} onClick={() => act(e)}>
                {e.registered ? 'Cancel registration' : e.seats_left <= 0 ? 'Full' : 'Register'}
              </button>
            )}
          </div>
        ))}
      </div>
      <Pager page={page} pages={d.pages} set={setPage} />
    </div>
  );
}
