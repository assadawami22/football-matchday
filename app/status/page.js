'use client';

import { useState } from 'react';
import Link from 'next/link';
import PlayerSearch from '@/components/PlayerSearch';

export default function StatusPage() {
  const [player, setPlayer] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState(null);

  async function loadStatus(p) {
    setPlayer(p);
    setStatus(null);
    if (!p) return;
    setLoading(true);
    const res = await fetch(`/api/status?player_id=${p.id}`, { cache: 'no-store' });
    setStatus(await res.json());
    setLoading(false);
  }

  async function markPaid(registrationId) {
    setNote('جارٍ الإرسال...');
    const res = await fetch('/api/status/mark-paid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registration_id: registrationId }),
    });
    const data = await res.json();
    setNote(data.message || data.error);
    loadStatus(player);
  }

  async function payLateFee() {
    setNote('جارٍ الإرسال...');
    const res = await fetch('/api/status/pay-late-fee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: player.id }),
    });
    const data = await res.json();
    setNote(data.message || data.error);
    loadStatus(player);
  }

  async function withdraw(registrationId) {
    if (!confirm('هل تريد سحب اسمك من هذه المباراة؟')) return;
    setNote('جارٍ الإرسال...');
    const res = await fetch('/api/status/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registration_id: registrationId }),
    });
    const data = await res.json();
    setNote(data.message || data.error);
    loadStatus(player);
  }

  function statusLabel(r) {
    if (r.rejected) return 'تم الرفض من المسؤول';
    if (r.type === 'main') {
      if (r.approved) return 'مؤكد في القائمة الأساسية';
      if (r.paid) return 'بانتظار تأكيد المسؤول للدفع';
      return 'تمت الترقية للقائمة الأساسية — مطلوب الدفع';
    }
    return 'على قائمة الاحتياط';
  }

  return (
    <main className="max-w-xl mx-auto px-5 py-10 md:py-16">
      <div className="mb-8">
        <p className="eyebrow">يوم المباراة</p>
        <h1 className="font-display text-5xl md:text-6xl mt-1">حالتي</h1>
        <p className="text-chalk/60 mt-2">ابحث عن اسمك لمعرفة مكانك أو دفع غرامة تأخير.</p>
        <Link href="/" className="btn-ghost text-sm mt-4 inline-flex">العودة للتسجيل</Link>
      </div>

      <PlayerSearch selected={player} onSelect={loadStatus} />

      {loading && <p className="text-chalk/50 mt-6">جارٍ التحميل...</p>}

      {status?.player && (
        <div className="mt-8 space-y-6">
          {status.player.status === 'locked' && (
            <div className="card p-5 border-rust/50">
              <p className="text-rust font-semibold">
                عليك غرامة تأخير قدرها {status.player.balance} ريال.
              </p>
              <p className="text-sm text-chalk/70 mt-1">
                لا يمكنك التسجيل لمباريات جديدة حتى يتم دفع الغرامة والموافقة عليها.
              </p>
              {status.pendingLateFeeClaim ? (
                <p className="text-sm text-amber mt-3">تم إرسال الدفع — بانتظار موافقة المسؤول.</p>
              ) : (
                <button className="btn-primary mt-4" onClick={payLateFee}>
                  لقد دفعت الغرامة عبر STC Pay
                </button>
              )}
            </div>
          )}

          <div>
            <h2 className="label mb-3">تسجيلاتك</h2>
            {status.registrations.length === 0 && (
              <p className="text-chalk/50 text-sm">لا يوجد تسجيلات بعد.</p>
            )}
            <ul className="space-y-3">
              {status.registrations.map((r) => (
                <li key={r.id} className="card p-4">
                  <p className="font-semibold">
                    {r.matches?.day_type} · {r.matches?.match_date}
                  </p>
                  <p className="text-sm text-chalk/60 mt-1">{statusLabel(r)}</p>
                  {r.type === 'main' && !r.paid && !r.rejected && (
                    <button className="btn-primary mt-3 text-sm" onClick={() => markPaid(r.id)}>
                      لقد دفعت {r.matches?.match_fee} ريال عبر STC Pay
                    </button>
                  )}
                  {!r.rejected && r.matches?.status === 'open' && (
                    <button className="btn-danger mt-3 text-sm ms-2" onClick={() => withdraw(r.id)}>
                      سحب الاسم من المباراة
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {note && <p className="text-sm text-amber">{note}</p>}
        </div>
      )}
    </main>
  );
}
