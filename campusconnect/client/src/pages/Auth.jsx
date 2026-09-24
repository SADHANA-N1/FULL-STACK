import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../auth';

export default function Auth({ signup }) {
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const { login } = useAuth(); const nav = useNavigate();
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const submit = async e => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(f.email) || f.password.length < 6 || (signup && f.name.trim().length < 2))
      return setErr('Enter a valid email, a password of 6+ characters' + (signup ? ' and your name.' : '.'));
    try { const { data } = await api.post(signup ? '/auth/signup' : '/auth/login', f); login(data); nav('/'); }
    catch (x) { setErr(errMsg(x)); }
  };
  return (
    <form className="card narrow" onSubmit={submit}>
      <h2>{signup ? 'Create your account' : 'Log in'}</h2>
      {err && <p className="err">{err}</p>}
      {signup && <input placeholder="Full name" value={f.name} onChange={set('name')} />}
      <input placeholder="Email" value={f.email} onChange={set('email')} />
      <input type="password" placeholder="Password" value={f.password} onChange={set('password')} />
      <button>{signup ? 'Sign up' : 'Log in'}</button>
      <p>{signup ? <Link to="/login">Already registered? Log in</Link> : <Link to="/signup">New student? Sign up</Link>}</p>
    </form>
  );
}
