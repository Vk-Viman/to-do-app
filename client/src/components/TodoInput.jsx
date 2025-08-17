import { useState } from 'react';

export default function TodoInput({ onAdd }) {
  const [title, setTitle] = useState('');
  return (
    <form
      onSubmit={(e)=>{e.preventDefault(); const v=title.trim(); if(v){ onAdd(v); setTitle(''); }}}
      className="flex gap-2"
    >
      <input
        className="input"
        placeholder="Add a task…"
        value={title}
        onChange={(e)=>setTitle(e.target.value)}
      />
      <button className="btn" type="submit">Add</button>
    </form>
  );
}
