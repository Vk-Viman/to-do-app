import { useState } from 'react';

export default function TodoInput({ onAdd }) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [labels, setLabels] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    const value = title.trim();
    if (!value) return;

    const parsedLabels = [...new Set(
      labels
        .split(',')
        .map((label) => label.trim().toLowerCase())
        .filter(Boolean)
    )];

    await onAdd({
      title: value,
      dueDate: dueDate || null,
      priority,
      labels: parsedLabels
    });

    setTitle('');
    setDueDate('');
    setPriority('medium');
    setLabels('');
  };

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-2 md:grid-cols-12"
    >
      <input
        className="input md:col-span-5"
        placeholder="Add a task…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        className="input md:col-span-2"
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />
      <select
        className="input md:col-span-2"
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      <input
        className="input md:col-span-2"
        placeholder="labels, comma"
        value={labels}
        onChange={(e) => setLabels(e.target.value)}
      />
      <button className="btn md:col-span-1" type="submit">Add</button>
    </form>
  );
}
