export default function TodoList({ items, onToggle, onDelete }) {
  if (!items.length) return (
    <div className="text-center text-slate-500 py-10">
      <p className="text-lg">You’re all caught up 🎉</p>
      <p className="text-sm">Add a task to get started.</p>
    </div>
  );

  return (
    <ul className="divide-y divide-slate-200 dark:divide-slate-800">
      {items.map(t => (
        <li key={t._id} className="flex items-center gap-3 py-3 group">
          <input type="checkbox" checked={t.completed} onChange={()=>onToggle(t)} className="checkbox" />
          <span className={"flex-1 " + (t.completed ? "line-through text-slate-400" : "text-slate-800 dark:text-slate-100")}>
            {t.title}
          </span>
          <button
            onClick={()=>onDelete(t)}
            className="opacity-0 group-hover:opacity-100 btn-outline px-2 py-1 text-xs"
            title="Delete"
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}
