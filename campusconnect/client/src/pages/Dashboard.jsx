import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../auth';

export default function Dashboard() {
  const { user } = useAuth();
  const [d, setD] = useState(null);
  useEffect(() => { api.get('/dashboard/' + user.role).then(r => setD(r.data)); }, []);
  if (!d) return <p>Loading dashboard...</p>;
  if (user.role === 'admin') {
    const stats = [['Events', d.total_events], ['Registrations', d.total_registrations], ['Students', d.total_students], ['Resources', d.total_resources]];
    return (
      <div>
        <h2>Admin dashboard</h2>
        <div className="grid">{stats.map(([l, v]) => <div className="card stat" key={l}><b>{v}</b>{l}</div>)}</div>
        <h3>Most registered events</h3>
        {d.top.map(e => <p key={e.id}>{e.title}: {e.regs} registrations</p>)}
      </div>
    );
  }
  return (
    <div>
      <h2>My events</h2>
      {d.events.length === 0 && <p>You haven't registered for anything yet. Browse events to sign up.</p>}
      {d.events.map(e => (
        <div className="card" key={e.id}><b>{e.title}</b><br />{e.category}, {new Date(e.event_date).toLocaleString()}</div>
      ))}
      <h3>Latest resources</h3>
      {d.resources.map(r => <p key={r.id}>{r.title} ({r.subject}, semester {r.semester})</p>)}
    </div>
  );
}
