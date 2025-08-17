import { useState } from 'react';
import api from '../api';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    try {
      const { data } = await api.post('/auth/register', { email, password });
      localStorage.setItem('token', data.token);
      window.location.href = '/';
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to register');
    }
  }

  return (
    <div className="grid place-items-center">
      <div className="card w-full max-w-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Create account</h2>
        {err && <p className="mb-3 text-sm text-rose-600">{err}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="input" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
          <button className="btn w-full" type="submit">Register</button>
        </form>
      </div>
    </div>
  );
}
