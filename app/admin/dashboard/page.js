'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatPhoneInput, toDigits } from '@/lib/phone';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function waLink(phone, message) {
  const digits = (phone || '').replace(/[^0-9]/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [matches, setMatches] = useState([]);
  const [pending, setPending] = useState([]);
  const [claims, setClaims] = useState([]);
  const [players, setPlayers] = useState([]);
  const [benchByMatch, setBenchByMatch] = useState({});
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPhone, setNewPlayerPhone] = useState('');
  const [roster_query, setRosterQuery] = useState('');
  const [newMatchDate, setNewMatchDate] = useState(todayISO());
  const [newMatchLabel, setNewMatchLabel] = useState('الأحد');
  const [matchError, setMatchError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [matchPlayers, setMatchPlayers] = useState({ main: [], bench: [] });
  const [matchPlayersLoading, setMatchPlayersLoading] = useState(false);

  useEffect(() => {
    loadAll();

    // Keep the dashboard fresh automatically: poll every 20s, and refresh
    // right away whenever the admin switches back to this tab — otherwise
    // new registrations from other people won't show up until a manual
    // reload, which is confusing when the tab is just left open.
    const interval = setInterval(loadAll, 20000);
    function onFocus() {
      loadAll();
    }
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') loadAll();
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  async function loadAll() {
    const [m, p, c, pl] = await Promise.all([
      fetch('/api/admin/matches', { cache: 'no-store' }).then((r) => r.json()),
      fetch('/api/admin/pending', { cache: 'no-store' }).then((r) => r.json()),
      fetch('/api/admin/late-fee-payments', { cache: 'no-store' }).then((r) => r.json()),
      fetch('/api/admin/players', { cache: 'no-store' }).then((r) => r.json()),
    ]);
    setMatches(m.matches || []);
    setPending(p.pending || []);
    setClaims(c.claims || []);
    setPlayers(pl.players || []);

    const openMatches = (m.matches || []).filter((x) => x.status === 'open');
    const benchData = {};
    for (const match of openMatches) {
      const res = await fetch(`/api/admin/bench?match_id=${match.id}`, { cache: 'no-store' }).then((r) => r.json());
      benchData[match.id] = res.bench || [];
    }
    setBenchByMatch(benchData);
    setLastUpdated(new Date());
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin');
  }

  async function loadMatchPlayers(matchId) {
    setMatchPlayersLoading(true);
    const res = await fetch(`/api/admin/match-players?match_id=${matchId}`, { cache: 'no-store' }).then((r) => r.json());
    setMatchPlayers({ main: res.main || [], bench: res.bench || [] });
    setMatchPlayersLoading(false);
  }

  function toggleMatchPanel(matchId) {
    if (selectedMatchId === matchId) {
      setSelectedMatchId(null);
      return;
    }
    setSelectedMatchId(matchId);
    loadMatchPlayers(matchId);
  }

  async function refreshMatchPanel() {
    if (selectedMatchId) loadMatchPlayers(selectedMatchId);
  }

  async function openMatch(e) {
    e.preventDefault();
    if (!newMatchDate || !newMatchLabel.trim()) return;
    setMatchError(null);
    const res = await fetch('/api/admin/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_date: newMatchDate, day_type: newMatchLabel.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMatchError(data.error || 'فشل إنشاء المباراة.');
      return;
    }
    loadAll();
  }

  async function deleteMatch(id) {
    if (!confirm('حذف هذه المباراة نهائياً؟ سيتم أيضاً حذف كل تسجيلاتها.')) return;
    await fetch('/api/admin/matches/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id: id }),
    });
    loadAll();
  }

  async function closeMatch(id) {
    await fetch('/api/admin/matches/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id: id }),
    });
    loadAll();
  }

  async function approve(registration_id) {
    await fetch('/api/admin/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registration_id }),
    });
    loadAll();
    refreshMatchPanel();
  }

  async function reject(registration_id) {
    await fetch('/api/admin/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registration_id }),
    });
    loadAll();
    refreshMatchPanel();
  }

  async function approveClaim(claim_id) {
    await fetch('/api/admin/late-fee-payments/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claim_id }),
    });
    loadAll();
    refreshMatchPanel();
  }

  async function rejectClaim(claim_id) {
    await fetch('/api/admin/late-fee-payments/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claim_id }),
    });
    loadAll();
    refreshMatchPanel();
  }

  async function markLate(player_id) {
    await fetch('/api/admin/mark-late', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id }),
    });
    loadAll();
    refreshMatchPanel();
  }

  async function unlockPlayer(player_id) {
    await fetch('/api/admin/unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id }),
    });
    loadAll();
    refreshMatchPanel();
  }

  async function addPlayer(e) {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    await fetch('/api/admin/players/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newPlayerName.trim(), phone: toDigits(newPlayerPhone) }),
    });
    setNewPlayerName('');
    setNewPlayerPhone('');
    loadAll();
  }

  async function promote(registration_id) {
    const res = await fetch('/api/admin/promote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registration_id }),
    }).then((r) => r.json());
    loadAll();
    refreshMatchPanel();
    if (res.ok) {
      const link = waLink(
        res.player.phone,
        `تمت ترقيتك! فتح مكان في القائمة الأساسية. الرجاء دفع ${res.match_fee} ريال عبر STC Pay ثم التأكيد في صفحة الحالة: ${typeof window !== 'undefined' ? window.location.origin : ''}/status`
      );
      window.open(link, '_blank');
    }
  }

  const openMatches = matches.filter((m) => m.status === 'open');
  const filteredPlayers = players.filter((p) =>
    p.name.toLowerCase().includes(roster_query.toLowerCase())
  );

  return (
    <main className="max-w-3xl mx-auto px-5 py-10 md:py-14 space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">يوم المباراة</p>
          <h1 className="font-display text-5xl">المسؤول</h1>
          {lastUpdated && (
            <p className="text-xs text-chalk/40 mt-1">
              آخر تحديث: {lastUpdated.toLocaleTimeString('ar-SA')}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost text-sm" onClick={loadAll}>تحديث</button>
          <button className="btn-ghost text-sm" onClick={logout}>تسجيل الخروج</button>
        </div>
      </div>

      {/* Matches */}
      <section>
        <h2 className="label mb-3">المباريات</h2>
        <form onSubmit={openMatch} className="card p-4 flex flex-wrap items-end gap-3 mb-4">
          <div>
            <label className="label block mb-1.5">التاريخ</label>
            <input
              type="date"
              className="input"
              value={newMatchDate}
              onChange={(e) => setNewMatchDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label block mb-1.5">الاسم</label>
            <input
              className="input"
              placeholder="مثال: الأحد، جمعة مساءً"
              value={newMatchLabel}
              onChange={(e) => setNewMatchLabel(e.target.value)}
            />
          </div>
          <button className="btn-primary text-sm">فتح مباراة</button>
        </form>

        {matchError && (
          <p className="text-rust text-sm mb-4">{matchError}</p>
        )}

        <ul className="space-y-2">
          {matches.map((m) => (
            <li key={m.id}>
              <div className="card p-4 flex items-center justify-between">
                <button
                  type="button"
                  className="text-start flex-1"
                  onClick={() => toggleMatchPanel(m.id)}
                >
                  <p className="font-semibold">{m.day_type} · {m.match_date}</p>
                  <p className="text-xs text-chalk/50">
                    {m.status === 'open' ? 'مفتوح' : 'مغلق'} — اضغط لعرض اللاعبين
                  </p>
                </button>
                <div className="flex gap-2">
                  {m.status === 'open' ? (
                    <button className="btn-ghost text-xs" onClick={() => closeMatch(m.id)}>إغلاق</button>
                  ) : (
                    <button className="btn-danger text-xs" onClick={() => deleteMatch(m.id)}>حذف</button>
                  )}
                </div>
              </div>

              {selectedMatchId === m.id && (
                <div className="card p-4 mt-2 border-amber/30 space-y-5">
                  {matchPlayersLoading ? (
                    <p className="text-chalk/50 text-sm">جارٍ التحميل...</p>
                  ) : (
                    <>
                      <div>
                        <p className="text-xs text-chalk/50 font-semibold mb-2">
                          القائمة الأساسية ({matchPlayers.main.length})
                        </p>
                        <ul className="space-y-2">
                          {matchPlayers.main.map((r) => (
                            <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
                              <div>
                                <span className="font-semibold">{r.players?.name}</span>
                                {' '}
                                {!r.approved && r.paid && (
                                  <span className="text-amber text-xs">بانتظار الموافقة</span>
                                )}
                                {!r.paid && (
                                  <span className="text-rust text-xs">بانتظار الدفع</span>
                                )}
                                {r.players?.status === 'locked' && (
                                  <span className="text-rust text-xs font-semibold ms-1">
                                    محظور · {r.players?.balance} ريال
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-1.5 flex-wrap justify-end">
                                {!r.approved && r.paid && (
                                  <>
                                    <button className="btn-primary text-xs" onClick={() => approve(r.id)}>موافقة</button>
                                    <button className="btn-danger text-xs" onClick={() => reject(r.id)}>رفض</button>
                                  </>
                                )}
                                {r.players?.status === 'locked' ? (
                                  <button className="btn-primary text-xs" onClick={() => unlockPlayer(r.players.id)}>إلغاء الحظر</button>
                                ) : (
                                  <button className="btn-danger text-xs" onClick={() => markLate(r.players.id)}>تسجيل تأخير</button>
                                )}
                              </div>
                            </li>
                          ))}
                          {matchPlayers.main.length === 0 && (
                            <li className="text-chalk/50 text-sm">لا يوجد لاعبين بعد.</li>
                          )}
                        </ul>
                      </div>

                      <div>
                        <p className="text-xs text-chalk/50 font-semibold mb-2">
                          الاحتياط ({matchPlayers.bench.length})
                        </p>
                        <ul className="space-y-2">
                          {matchPlayers.bench.map((r) => (
                            <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
                              <div>
                                <span className="font-semibold">{r.players?.name}</span>
                                {r.players?.status === 'locked' && (
                                  <span className="text-rust text-xs font-semibold ms-1">
                                    محظور · {r.players?.balance} ريال
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-1.5 flex-wrap justify-end">
                                <button className="btn-primary text-xs" onClick={() => promote(r.id)}>ترقية</button>
                                {r.players?.status === 'locked' ? (
                                  <button className="btn-primary text-xs" onClick={() => unlockPlayer(r.players.id)}>إلغاء الحظر</button>
                                ) : (
                                  <button className="btn-danger text-xs" onClick={() => markLate(r.players.id)}>تسجيل تأخير</button>
                                )}
                              </div>
                            </li>
                          ))}
                          {matchPlayers.bench.length === 0 && (
                            <li className="text-chalk/50 text-sm">الاحتياط فارغ.</li>
                          )}
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Pending payment approvals */}
      <section>
        <h2 className="label mb-3">بانتظار الموافقة على الدفع ({pending.length})</h2>
        {pending.length === 0 && <p className="text-chalk/50 text-sm">لا يوجد شيء بانتظار الموافقة.</p>}
        <ul className="space-y-2">
          {pending.map((r) => (
            <li key={r.id} className="card p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">{r.players?.name}</p>
                <p className="text-xs text-chalk/50">
                  {r.matches?.day_type} {r.matches?.match_date} · {formatPhoneInput(r.players?.phone)}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="btn-primary text-xs" onClick={() => approve(r.id)}>موافقة</button>
                <button className="btn-danger text-xs" onClick={() => reject(r.id)}>رفض</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Late fee claims */}
      <section>
        <h2 className="label mb-3">مطالبات دفع الغرامات ({claims.length})</h2>
        {claims.length === 0 && <p className="text-chalk/50 text-sm">لا يوجد شيء بانتظار الموافقة.</p>}
        <ul className="space-y-2">
          {claims.map((c) => (
            <li key={c.id} className="card p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">{c.players?.name}</p>
                <p className="text-xs text-chalk/50">{c.amount} ريال · {formatPhoneInput(c.players?.phone)}</p>
              </div>
              <div className="flex gap-2">
                <button className="btn-primary text-xs" onClick={() => approveClaim(c.id)}>موافقة وإلغاء الحظر</button>
                <button className="btn-danger text-xs" onClick={() => rejectClaim(c.id)}>رفض</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Bench / promotion */}
      <section>
        <h2 className="label mb-3">الاحتياط والترقية</h2>
        {openMatches.length === 0 && <p className="text-chalk/50 text-sm">لا توجد مباراة مفتوحة.</p>}
        {openMatches.map((m) => (
          <div key={m.id} className="mb-6">
            <p className="text-sm text-chalk/60 mb-2">{m.day_type} · {m.match_date}</p>
            <ul className="space-y-2">
              {(benchByMatch[m.id] || []).map((b, i) => (
                <li key={b.id} className="card p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="badge-number bg-amber/20 text-sm">إ{i + 1}</span>
                    <span>{b.players?.name}</span>
                  </div>
                  <button className="btn-primary text-xs" onClick={() => promote(b.id)}>
                    ترقية للقائمة الأساسية
                  </button>
                </li>
              ))}
              {(benchByMatch[m.id] || []).length === 0 && (
                <li className="text-chalk/50 text-sm">الاحتياط فارغ.</li>
              )}
            </ul>
          </div>
        ))}
      </section>

      {/* Roster + late marking */}
      <section>
        <h2 className="label mb-3">قائمة اللاعبين ({players.length})</h2>

        <form onSubmit={addPlayer} className="flex gap-2 mb-4">
          <input
            className="input"
            placeholder="اسم لاعب جديد"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
          />
          <input
            className="input"
            type="tel"
            inputMode="numeric"
            dir="ltr"
            placeholder="الجوال (اختياري) 05X XXX XXXX"
            value={newPlayerPhone}
            onChange={(e) => setNewPlayerPhone(formatPhoneInput(e.target.value))}
          />
          <button className="btn-primary whitespace-nowrap">إضافة</button>
        </form>

        <input
          className="input mb-3"
          placeholder="البحث في القائمة..."
          value={roster_query}
          onChange={(e) => setRosterQuery(e.target.value)}
        />
        <ul className="space-y-2 max-h-96 overflow-y-auto">
          {filteredPlayers.map((p) => (
            <li key={p.id} className="card p-3 flex items-center justify-between">
              <div>
                <p className="font-semibold">
                  {p.name}{' '}
                  {p.status === 'locked' && (
                    <span className="text-rust text-xs font-semibold ms-1">
                      محظور · {p.balance} ريال
                    </span>
                  )}
                </p>
                <p className="text-xs text-chalk/40">{formatPhoneInput(p.phone)}</p>
              </div>
              {p.status === 'locked' ? (
                <button className="btn-primary text-xs" onClick={() => unlockPlayer(p.id)}>
                  إلغاء الحظر
                </button>
              ) : (
                <button className="btn-danger text-xs" onClick={() => markLate(p.id)}>
                  تسجيل تأخير
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
