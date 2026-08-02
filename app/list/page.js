'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ListPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await fetch('/api/list', { cache: 'no-store' });
    setData(await res.json());
  }

  if (!data) {
    return (
      <main className="max-w-xl mx-auto px-5 py-16 text-chalk/60">جارٍ التحميل...</main>
    );
  }

  const { match, main, bench, locked } = data;
  const sortedLocked = [...locked].sort((a, b) => b.balance - a.balance);

  return (
    <main className="max-w-xl mx-auto px-5 py-10 md:py-16">
      <div className="mb-8">
        <p className="eyebrow">قائمة اللاعبين</p>
        <h1 className="font-display text-5xl md:text-6xl mt-1">
          {match ? match.day_type : 'لا توجد مباراة مفتوحة'}
        </h1>
        {match && <p className="text-chalk/60 mt-1">{match.match_date}</p>}
        <Link href="/" className="btn-ghost text-sm mt-4 inline-flex">التسجيل / تعديل مكاني</Link>
      </div>

      {!match ? (
        <div className="card p-6 text-chalk/70">لا توجد مباراة مفتوحة للتسجيل حالياً.</div>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="label mb-3">القائمة الأساسية · {main.length}/{match.main_capacity}</h2>
            <ol className="space-y-2">
              {main.map((r, i) => (
                <li key={r.id} className="card p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="badge-number">{i + 1}</span>
                    <span className="font-semibold">{r.players?.name}</span>
                  </div>
                  {!r.approved && (
                    <span className="text-xs text-amber font-semibold whitespace-nowrap">
                      بانتظار الدفع
                    </span>
                  )}
                </li>
              ))}
              {main.length === 0 && (
                <li className="text-chalk/50 text-sm">لا يوجد لاعبين مؤكدين بعد.</li>
              )}
            </ol>
          </section>

          <section>
            <h2 className="label mb-3">الاحتياط · {bench.length}/{match.bench_capacity}</h2>
            <ol className="space-y-2">
              {bench.map((r, i) => (
                <li key={r.id} className="card p-3 flex items-center gap-3 border-amber/20">
                  <span className="badge-number bg-amber/20">إ{i + 1}</span>
                  <span className="font-semibold">{r.players?.name}</span>
                </li>
              ))}
              {bench.length === 0 && (
                <li className="text-chalk/50 text-sm">لا يوجد أحد على الاحتياط.</li>
              )}
            </ol>
          </section>
        </div>
      )}

      {locked.length > 0 && (
        <section className="mt-10">
          <h2 className="label mb-3 text-rust">محظور — عليه غرامة تأخير</h2>
          <ul className="space-y-2">
            {sortedLocked.map((p) => (
              <li key={p.id} className="card p-3 flex items-center justify-between border-rust/30">
                <span>{p.name}</span>
                <span className="text-rust text-sm font-semibold">{p.balance} ريال</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
