'use client';

import { useEffect, useRef, useState } from 'react';

export default function PlayerSearch({ selected, onSelect, onRequestAdd }) {
  const [query, setQuery] = useState(selected?.name || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    if (selected) {
      setQuery(selected.name);
      setOpen(false);
    }
  }, [selected]);

  useEffect(() => {
    function onClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    if (selected && query === selected.name) return;

    const t = setTimeout(async () => {
      setLoading(true);
      const res = await fetch(`/api/players/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setResults(data.players || []);
      setLoading(false);
    }, 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function openDropdown() {
    setOpen(true);
    setLoading(true);
    fetch(`/api/players/search?q=${encodeURIComponent(query.trim())}`)
      .then((r) => r.json())
      .then((data) => setResults(data.players || []))
      .finally(() => setLoading(false));
  }

  return (
    <div className="relative" ref={boxRef}>
      <label className="label">اسمك</label>
      <input
        className="input mt-1.5"
        placeholder="اضغط لتصفح القائمة أو ابدأ الكتابة..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          onSelect(null);
        }}
        onFocus={openDropdown}
      />
      {open && (
        <div className="absolute z-20 mt-2 w-full card overflow-hidden shadow-xl">
          {loading && (
            <div className="px-4 py-3 text-sm text-chalk/50">جارٍ البحث...</div>
          )}
          {!loading && results.length > 0 && (
            <ul className="max-h-60 overflow-y-auto divide-y divide-chalk/10">
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="w-full text-start px-4 py-3 hover:bg-chalk/10 transition flex items-center justify-between"
                    onClick={() => {
                      onSelect(p);
                      setQuery(p.name);
                      setOpen(false);
                    }}
                  >
                    <span>{p.name}</span>
                    {p.status === 'locked' && (
                      <span className="text-xs text-rust font-semibold">محظور</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!loading && results.length === 0 && query.trim().length > 0 && (
            <div className="px-4 py-4 text-sm text-chalk/60">
              <p className="mb-2">لم يتم العثور على "{query.trim()}".</p>
              {onRequestAdd && (
                <button type="button" className="btn-ghost text-xs" onClick={() => onRequestAdd(query.trim())}>
                  اطلب إضافة هذا الاسم
                </button>
              )}
            </div>
          )}
          {!loading && results.length === 0 && query.trim().length === 0 && (
            <div className="px-4 py-4 text-sm text-chalk/50">لا يوجد لاعبين في القائمة بعد.</div>
          )}
        </div>
      )}
    </div>
  );
}
