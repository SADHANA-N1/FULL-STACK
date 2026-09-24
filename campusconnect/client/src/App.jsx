import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { AuthProvider, Protected, useAuth } from './auth';
import Auth from './pages/Auth';
import Events from './pages/Events';
import Resources from './pages/Resources';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';

function Nav() {
  const { user, logout } = useAuth();
  return (
    <nav>
      <b className="brand">CampusConnect</b>
      {user && <>
        <NavLink to="/">Events</NavLink>
        <NavLink to="/resources">Resources</NavLink>
        <NavLink to="/dashboard">Dashboard</NavLink>
        {user.role === 'admin' && <NavLink to="/admin">Manage</NavLink>}
        <button className="ghost" onClick={logout}>Log out ({user.name})</button>
      </>}
    </nav>
  );
}
export default function App() {
  return (
    <AuthProvider><BrowserRouter><Nav /><main>
      <Routes>
        <Route path="/login" element={<Auth />} />
        <Route path="/signup" element={<Auth signup />} />
        <Route path="/" element={<Protected><Events /></Protected>} />
        <Route path="/resources" element={<Protected><Resources /></Protected>} />
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/admin" element={<Protected role="admin"><Admin /></Protected>} />
      </Routes>
    </main></BrowserRouter></AuthProvider>
  );
}
