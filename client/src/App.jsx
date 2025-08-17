import { Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DarkModeToggle from './components/DarkModeToggle.jsx';

export default function App() {
  const token = localStorage.getItem('token');

  const logout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <img src="/favicon.svg" alt="" className="w-6 h-6" /> Pro To‑Do
          </Link>
          <nav className="flex items-center gap-2">
            <DarkModeToggle />
            {token ? (
              <button className="btn-outline" onClick={logout}>Logout</button>
            ) : (
              <>
                <Link className="btn-outline" to="/login">Login</Link>
                <Link className="btn" to="/register">Register</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <Routes>
          <Route path="/" element={<ProtectedRoute><Dashboard/></ProtectedRoute>} />
          <Route path="/login" element={token ? <Navigate to="/" /> : <Login />} />
          <Route path="/register" element={token ? <Navigate to="/" /> : <Register />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="py-8 text-center text-xs text-slate-500">
        <p>Built with ❤️ using MERN</p>
      </footer>
    </div>
  );
}
