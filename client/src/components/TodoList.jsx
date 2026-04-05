import { useState } from 'react';

function formatDueDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
}

function priorityBadgeClass(priority) {
  if (priority === 'high') return 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300';
  if (priority === 'low') return 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300';
  return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300';
}

export default function TodoList({
  items,
  query,
  onQueryChange,
  onToggle,
  onDelete,
  onEditTitle,
  openCount,
  completedCount
}) {
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  const startEdit = (task) => {
    setEditingTaskId(task._id);
    setEditingTitle(task.title);
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
    setEditingTitle('');
  };

  const saveEdit = async () => {
    const title = editingTitle.trim();
    if (!title) return;
    await onEditTitle(editingTaskId, title);
    cancelEdit();
  };

  if (!items.length) return (
    <>
      <div className="grid gap-2 md:grid-cols-12 mb-4">
        <select
          className="input md:col-span-3"
          value={query.status}
          onChange={(e) => onQueryChange({ status: e.target.value, page: 1 })}
        >
          <option value="all">All ({openCount + completedCount})</option>
          <option value="open">Open ({openCount})</option>
          <option value="completed">Completed ({completedCount})</option>
        </select>
        <input
          className="input md:col-span-5"
          placeholder="Search title or labels"
          value={query.search}
          onChange={(e) => onQueryChange({ search: e.target.value, page: 1 })}
        />
        <select
          className="input md:col-span-4"
          value={query.sort}
          onChange={(e) => onQueryChange({ sort: e.target.value, page: 1 })}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="dueSoon">Due Soon</option>
          <option value="dueLate">Due Late</option>
          <option value="priorityHigh">Priority: High to Low</option>
          <option value="priorityLow">Priority: Low to High</option>
          <option value="alpha">A-Z</option>
        </select>
      </div>
      <div className="text-center text-slate-500 py-10">
        <p className="text-lg">You’re all caught up 🎉</p>
        <p className="text-sm">Add a task to get started.</p>
      </div>
    </>
  );

  return (
    <>
      <div className="grid gap-2 md:grid-cols-12 mb-4">
        <select
          className="input md:col-span-3"
          value={query.status}
          onChange={(e) => onQueryChange({ status: e.target.value, page: 1 })}
        >
          <option value="all">All ({openCount + completedCount})</option>
          <option value="open">Open ({openCount})</option>
          <option value="completed">Completed ({completedCount})</option>
        </select>
        <input
          className="input md:col-span-5"
          placeholder="Search title or labels"
          value={query.search}
          onChange={(e) => onQueryChange({ search: e.target.value, page: 1 })}
        />
        <select
          className="input md:col-span-4"
          value={query.sort}
          onChange={(e) => onQueryChange({ sort: e.target.value, page: 1 })}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="dueSoon">Due Soon</option>
          <option value="dueLate">Due Late</option>
          <option value="priorityHigh">Priority: High to Low</option>
          <option value="priorityLow">Priority: Low to High</option>
          <option value="alpha">A-Z</option>
        </select>
      </div>
      <ul className="divide-y divide-slate-200 dark:divide-slate-800">
        {items.map((t) => {
          const isEditing = editingTaskId === t._id;
          const dueDate = formatDueDate(t.dueDate);
          return (
            <li key={t._id} className="py-3 group">
              <div className="flex items-start gap-3">
                <input type="checkbox" checked={t.completed} onChange={() => onToggle(t)} className="checkbox mt-1" />
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="flex flex-wrap gap-2">
                      <input
                        className="input flex-1"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                      />
                      <button className="btn px-3 py-1 text-xs" onClick={saveEdit}>Save</button>
                      <button className="btn-outline px-3 py-1 text-xs" onClick={cancelEdit}>Cancel</button>
                    </div>
                  ) : (
                    <>
                      <p className={t.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}>
                        {t.title}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {dueDate && (
                          <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            Due {dueDate}
                          </span>
                        )}
                        <span className={`text-xs px-2 py-1 rounded-full ${priorityBadgeClass(t.priority || 'medium')}`}>
                          {(t.priority || 'medium').toUpperCase()}
                        </span>
                        {(t.labels || []).map((label) => (
                          <span
                            key={`${t._id}-${label}`}
                            className="text-xs px-2 py-1 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
                          >
                            #{label}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                {!isEditing && (
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(t)}
                      className="btn-outline px-2 py-1 text-xs"
                      title="Edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(t)}
                      className="btn-outline px-2 py-1 text-xs"
                      title="Delete"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
