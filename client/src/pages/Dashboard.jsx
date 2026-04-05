import { useEffect, useState } from 'react';
import api from '../api';
import TodoInput from '../components/TodoInput.jsx';
import TodoList from '../components/TodoList.jsx';
import { getApiErrorMessage } from '../utils/api-error';

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [allLoadedTasks, setAllLoadedTasks] = useState([]);
  const [query, setQuery] = useState({
    page: 1,
    limit: 10,
    status: 'all',
    search: '',
    sort: 'newest'
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [undoDeleteState, setUndoDeleteState] = useState(null);

  async function fetchTasks() {
    try {
      setErr('');
      const { data } = await api.get('/tasks', { params: query });

      if (Array.isArray(data)) {
        setTasks(data);
        setAllLoadedTasks((prev) => {
          const merged = [...prev];
          for (const item of data) {
            const idx = merged.findIndex((x) => x._id === item._id);
            if (idx === -1) merged.push(item);
            else merged[idx] = item;
          }
          return merged;
        });
        setPagination({
          total: data.length,
          page: 1,
          limit: data.length || 10,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false
        });
      } else {
        const items = data?.items || [];
        setTasks(items);
        setAllLoadedTasks((prev) => {
          const merged = [...prev];
          for (const item of items) {
            const idx = merged.findIndex((x) => x._id === item._id);
            if (idx === -1) merged.push(item);
            else merged[idx] = item;
          }
          return merged;
        });
        setPagination(data?.pagination || {
          total: items.length,
          page: query.page,
          limit: query.limit,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: query.page > 1
        });
      }
    } catch (e) {
      setErr(getApiErrorMessage(e, 'Failed to load tasks'));
    } finally {
      setLoading(false);
    }
  }

  async function addTask(payload) {
    const tempId = `temp-${Date.now()}`;
    const optimisticTask = {
      _id: tempId,
      title: payload.title,
      completed: false,
      dueDate: payload.dueDate || null,
      priority: payload.priority || 'medium',
      labels: payload.labels || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setTasks((prev) => [optimisticTask, ...prev]);
    setAllLoadedTasks((prev) => [optimisticTask, ...prev]);

    try {
      const { data } = await api.post('/tasks', payload);
      setTasks((prev) => prev.map((x) => (x._id === tempId ? data : x)));
      setAllLoadedTasks((prev) => prev.map((x) => (x._id === tempId ? data : x)));
    } catch (e) {
      setTasks((prev) => prev.filter((x) => x._id !== tempId));
      setAllLoadedTasks((prev) => prev.filter((x) => x._id !== tempId));
      setErr(getApiErrorMessage(e, 'Failed to add task'));
    }
  }

  async function toggleTask(t) {
    const previous = t.completed;
    setTasks((prev) => prev.map((x) => (x._id === t._id ? { ...x, completed: !x.completed } : x)));
    setAllLoadedTasks((prev) => prev.map((x) => (x._id === t._id ? { ...x, completed: !x.completed } : x)));

    try {
      const { data } = await api.patch(`/tasks/${t._id}`, { completed: !t.completed });
      setTasks((prev) => prev.map((x) => (x._id === data._id ? data : x)));
      setAllLoadedTasks((prev) => prev.map((x) => (x._id === data._id ? data : x)));
    } catch (e) {
      setTasks((prev) => prev.map((x) => (x._id === t._id ? { ...x, completed: previous } : x)));
      setAllLoadedTasks((prev) => prev.map((x) => (x._id === t._id ? { ...x, completed: previous } : x)));
      setErr(getApiErrorMessage(e, 'Failed to update task'));
    }
  }

  async function editTaskTitle(taskId, title) {
    const before = tasks.find((x) => x._id === taskId)?.title;
    setTasks((prev) => prev.map((x) => (x._id === taskId ? { ...x, title } : x)));
    setAllLoadedTasks((prev) => prev.map((x) => (x._id === taskId ? { ...x, title } : x)));

    try {
      const { data } = await api.patch(`/tasks/${taskId}`, { title });
      setTasks((prev) => prev.map((x) => (x._id === data._id ? data : x)));
      setAllLoadedTasks((prev) => prev.map((x) => (x._id === data._id ? data : x)));
    } catch (e) {
      setTasks((prev) => prev.map((x) => (x._id === taskId ? { ...x, title: before } : x)));
      setAllLoadedTasks((prev) => prev.map((x) => (x._id === taskId ? { ...x, title: before } : x)));
      setErr(getApiErrorMessage(e, 'Failed to update task'));
    }
  }

  async function finalizeDelete(task) {
    try {
      await api.delete(`/tasks/${task._id}`);
      setAllLoadedTasks((prev) => prev.filter((x) => x._id !== task._id));
    } catch (e) {
      setTasks((prev) => [task, ...prev]);
      setAllLoadedTasks((prev) => [task, ...prev]);
      setErr(getApiErrorMessage(e, 'Failed to delete task'));
    }
  }

  async function deleteTask(t) {
    const previousList = [...tasks];
    setTasks((prev) => prev.filter((x) => x._id !== t._id));

    const timeoutId = setTimeout(() => {
      finalizeDelete(t);
      setUndoDeleteState(null);
    }, 5000);

    setUndoDeleteState({ task: t, timeoutId, previousList });
  }

  function undoDelete() {
    if (!undoDeleteState) return;
    clearTimeout(undoDeleteState.timeoutId);
    setTasks(undoDeleteState.previousList);
    setUndoDeleteState(null);
  }

  function onQueryChange(patch) {
    setQuery((prev) => ({ ...prev, ...patch }));
  }

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.page, query.limit, query.status, query.search, query.sort]);

  const openCount = allLoadedTasks.filter((t) => !t.completed).length;
  const completedCount = allLoadedTasks.filter((t) => t.completed).length;

  if (loading) return <p className="text-center text-slate-500">Loading…</p>;
  return (
    <div className="grid gap-6">
      <section className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Your Tasks</h2>
          <span className="text-sm text-slate-500">{openCount} open</span>
        </div>
        <TodoInput onAdd={addTask} />
        {err && (
          <div className="mt-3 text-sm text-red-600 dark:text-red-400">{err}</div>
        )}
        {undoDeleteState && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-amber-300/70 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
            <span>Task deleted. Undo?</span>
            <button className="btn-outline px-2 py-1 text-xs" onClick={undoDelete}>Undo</button>
          </div>
        )}
        <div className="mt-4">
          <TodoList
            items={tasks}
            query={query}
            onQueryChange={onQueryChange}
            onToggle={toggleTask}
            onDelete={deleteTask}
            onEditTitle={editTaskTitle}
            openCount={openCount}
            completedCount={completedCount}
          />
          <div className="mt-4 flex items-center justify-between">
            <button
              className="btn-outline px-3 py-1 text-sm disabled:opacity-50"
              disabled={!pagination.hasPrevPage}
              onClick={() => onQueryChange({ page: Math.max(1, query.page - 1) })}
            >
              Previous
            </button>
            <span className="text-sm text-slate-500">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              className="btn-outline px-3 py-1 text-sm disabled:opacity-50"
              disabled={!pagination.hasNextPage}
              onClick={() => onQueryChange({ page: query.page + 1 })}
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-100">Tips</h3>
        <ul className="list-disc pl-6 text-sm text-slate-600 dark:text-slate-300 space-y-1">
          <li>Use filters, search, and sorting to quickly find tasks.</li>
          <li>Edit a task title inline and save without leaving the list.</li>
          <li>Deleted a task by mistake? Use Undo within 5 seconds.</li>
        </ul>
      </section>
    </div>
  );
}
