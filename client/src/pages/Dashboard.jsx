import { useEffect, useState } from 'react';
import api from '../api';
import TodoInput from '../components/TodoInput.jsx';
import TodoList from '../components/TodoList.jsx';

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  async function fetchTasks() {
    try {
      const { data } = await api.get('/tasks');
      setTasks(data);
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }

  async function addTask(title) {
    try {
      const { data } = await api.post('/tasks', { title });
      setTasks(prev => [data, ...prev]);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to add task');
    }
  }

  async function toggleTask(t) {
    try {
      const { data } = await api.patch(`/tasks/${t._id}`, { completed: !t.completed });
      setTasks(prev => prev.map(x => (x._id === data._id ? data : x)));
    } catch {
      alert('Failed to update task');
    }
  }

  async function deleteTask(t) {
    try {
      await api.delete(`/tasks/${t._id}`);
      setTasks(prev => prev.filter(x => x._id !== t._id));
    } catch {
      alert('Failed to delete task');
    }
  }

  useEffect(() => { fetchTasks(); }, []);

  if (loading) return <p className="text-center text-slate-500">Loading…</p>;
  return (
    <div className="grid gap-6">
      <section className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Your Tasks</h2>
          <span className="text-sm text-slate-500">{tasks.filter(t=>!t.completed).length} open</span>
        </div>
        <TodoInput onAdd={addTask} />
        <div className="mt-4">
          <TodoList items={tasks} onToggle={toggleTask} onDelete={deleteTask} />
        </div>
      </section>

      <section className="card p-6">
        <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-100">Tips</h3>
        <ul className="list-disc pl-6 text-sm text-slate-600 dark:text-slate-300 space-y-1">
          <li>Click the checkbox to mark tasks complete.</li>
          <li>Use the delete button to remove tasks.</li>
          <li>Toggle dark mode from the header.</li>
        </ul>
      </section>
    </div>
  );
}
