import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { Pager } from './Events';

export default function Resources() {
  const [q, setQ] = useState({ subject: '', semester: '' });
  const [page, setPage] = useState(1);
  const [d, setD] = useState({ data: [], pages: 1 });
  const [msg, setMsg] = useState('');
  useEffect(() => { api.get('/resources', { params: { ...q, page } }).then(r => setD(r.data)).catch(e => setMsg(errMsg(e))); }, [q, page]);
  const change = k => e => { setQ({ ...q, [k]: e.target.value }); setPage(1); };
  const download = async r => {
    try {
      const { data } = await api.get(`/resources/${r.id}/download`, { responseType: 'blob' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(data); a.download = r.file_name; a.click();
    } catch (x) { setMsg(errMsg(x)); }
  };
  return (
    <div>
      <h2>Notes and previous year papers</h2>
      <div className="filters">
        <input placeholder="Subject" value={q.subject} onChange={change('subject')} />
        <select value={q.semester} onChange={change('semester')}>
          <option value="">All semesters</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
        </select>
      </div>
      {msg && <p className="err">{msg}</p>}
      {d.data.length === 0 && <p>No resources uploaded for this filter yet.</p>}
      {d.data.map(r => (
        <div className="card row" key={r.id}>
          <div><b>{r.title}</b><br />{r.subject}, semester {r.semester}</div>
          <button onClick={() => download(r)}>Download</button>
        </div>
      ))}
      <Pager page={page} pages={d.pages} set={setPage} />
    </div>
  );
}
