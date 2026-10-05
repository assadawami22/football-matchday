'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export default function ListPage() {
  const [data, setData] = useState(null);
  const [generating, setGenerating] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await fetch('/api/list', { cache: 'no-store' });
    setData(await res.json());
  }

  async function generateImage() {
    if (!data?.match) return;
    setGenerating(true);

    const { match, main, bench, locked } = data;
    const sortedLockedForImage = [...locked].sort((a, b) => b.balance - a.balance);
    const width = 800;
    const rowHeight = 56;
    const sectionGap = 70;
    const topPadding = 190;
    const bottomPadding = 60;
    const height =
      topPadding +
      Math.max(main.length, 1) * rowHeight +
      sectionGap +
      Math.max(bench.length, 1) * rowHeight +
      (sortedLockedForImage.length > 0 ? sectionGap + sortedLockedForImage.length * rowHeight : 0) +
      bottomPadding;

    const canvas = document.createElement('canvas');
    const scale = 2; // render at 2x for a crisp image
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.direction = 'rtl';

    // Background — pitch gradient with faint vertical stripes, matching the site
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, '#16412F');
    bg.addColorStop(1, '#0B241A');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(245,241,230,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    const rightEdge = width - 40;

    // Title
    ctx.textAlign = 'right';
    ctx.fillStyle = '#C98A2C';
    ctx.font = 'bold 16px Tahoma, Arial, sans-serif';
    ctx.fillText('يوم المباراة', rightEdge, 50);

    ctx.fillStyle = '#F5F1E6';
    ctx.font = 'bold 44px Tahoma, Arial, sans-serif';
    ctx.fillText(match.day_type, rightEdge, 98);

    ctx.fillStyle = 'rgba(245,241,230,0.6)';
    ctx.font = '18px Tahoma, Arial, sans-serif';
    ctx.fillText(match.match_date, rightEdge, 128);

    let y = topPadding;

    function drawBadge(cx, cy, label, filled) {
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.fillStyle = filled ? '#C98A2C' : '#1F5C3F';
      ctx.fill();
      ctx.strokeStyle = 'rgba(245,241,230,0.25)';
      ctx.stroke();
      ctx.fillStyle = '#F5F1E6';
      ctx.font = 'bold 15px Tahoma, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, cx, cy + 5);
      ctx.textAlign = 'right';
    }

    // Section: main list
    ctx.fillStyle = 'rgba(245,241,230,0.5)';
    ctx.font = 'bold 15px Tahoma, Arial, sans-serif';
    ctx.fillText(`القائمة الأساسية · ${main.length}/${match.main_capacity}`, rightEdge, y);
    y += 34;

    if (main.length === 0) {
      ctx.fillStyle = 'rgba(245,241,230,0.4)';
      ctx.font = '16px Tahoma, Arial, sans-serif';
      ctx.fillText('لا يوجد لاعبين مؤكدين بعد.', rightEdge, y + 20);
      y += rowHeight;
    } else {
      main.forEach((r, i) => {
        const rowY = y + i * rowHeight;
        ctx.fillStyle = 'rgba(245,241,230,0.03)';
        ctx.fillRect(40, rowY - 8, width - 80, 40);
        drawBadge(rightEdge - 20, rowY + 12, String(i + 1), false);
        ctx.fillStyle = '#F5F1E6';
        ctx.font = 'bold 18px Tahoma, Arial, sans-serif';
        ctx.fillText(r.players?.name || '', rightEdge - 55, rowY + 18);
        if (!r.approved) {
          ctx.fillStyle = '#C98A2C';
          ctx.font = 'bold 13px Tahoma, Arial, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('بانتظار الدفع', 55, rowY + 18);
          ctx.textAlign = 'right';
        }
      });
      y += main.length * rowHeight;
    }

    y += sectionGap - rowHeight + 34;

    // Section: bench
    ctx.fillStyle = 'rgba(245,241,230,0.5)';
    ctx.font = 'bold 15px Tahoma, Arial, sans-serif';
    ctx.fillText(`الاحتياط · ${bench.length}/${match.bench_capacity}`, rightEdge, y);
    y += 34;

    if (bench.length === 0) {
      ctx.fillStyle = 'rgba(245,241,230,0.4)';
      ctx.font = '16px Tahoma, Arial, sans-serif';
      ctx.fillText('لا يوجد أحد على الاحتياط.', rightEdge, y + 20);
      y += rowHeight;
    } else {
      bench.forEach((r, i) => {
        const rowY = y + i * rowHeight;
        ctx.fillStyle = 'rgba(201,138,44,0.06)';
        ctx.fillRect(40, rowY - 8, width - 80, 40);
        drawBadge(rightEdge - 20, rowY + 12, `إ${i + 1}`, true);
        ctx.fillStyle = '#F5F1E6';
        ctx.font = 'bold 18px Tahoma, Arial, sans-serif';
        ctx.fillText(r.players?.name || '', rightEdge - 55, rowY + 18);
      });
      y += bench.length * rowHeight;
    }

    // Section: locked / owes a late fee
    if (sortedLockedForImage.length > 0) {
      y += sectionGap - rowHeight + 34;

      ctx.fillStyle = '#B23A2E';
      ctx.font = 'bold 15px Tahoma, Arial, sans-serif';
      ctx.fillText(`محظور — عليه غرامة تأخير · ${sortedLockedForImage.length}`, rightEdge, y);
      y += 34;

      sortedLockedForImage.forEach((p, i) => {
        const rowY = y + i * rowHeight;
        ctx.fillStyle = 'rgba(178,58,46,0.08)';
        ctx.fillRect(40, rowY - 8, width - 80, 40);
        ctx.fillStyle = '#F5F1E6';
        ctx.font = 'bold 18px Tahoma, Arial, sans-serif';
        ctx.fillText(p.name || '', rightEdge - 12, rowY + 18);
        ctx.fillStyle = '#B23A2E';
        ctx.font = 'bold 16px Tahoma, Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${p.balance} ريال`, 55, rowY + 18);
        ctx.textAlign = 'right';
      });
    }

    canvasRef.current = canvas;

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    const fileName = `قائمة-${match.day_type}-${match.match_date}.png`;
    const file = new File([blob], fileName, { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: fileName });
        setGenerating(false);
        return;
      } catch (e) {
        // user cancelled the share sheet — fall through to download
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    setGenerating(false);
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
        <div className="flex gap-3 mt-4 flex-wrap">
          <Link href="/" className="btn-ghost text-sm">الصفحة الرئيسية </Link>
          {match && (
            <button className="btn-primary text-sm" onClick={generateImage} disabled={generating}>
              {generating ? 'جارٍ إنشاء الصورة...' : 'تحميل صورة القائمة'}
            </button>
          )}
        </div>
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
                  <span className="font-semibold text-orange-400">{r.players?.name}</span>                 
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