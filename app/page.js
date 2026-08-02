'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PlayerSearch from '@/components/PlayerSearch';
import { formatPhoneInput, isValidSaudiPhone, toDigits } from '@/lib/phone';

function formatDay(dayType) {
  if (!dayType) return '';
  return dayType;
}

export default function RegisterPage() {
  const [matches, setMatches] = useState([]);
  const [matchId, setMatchId] = useState(null);
  const [player, setPlayer] = useState(null);
  const [phone, setPhone] = useState('');
  const [paid, setPaid] = useState(false);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [addRequestName, setAddRequestName] = useState(null);
  const [addRequestMessage, setAddRequestMessage] = useState(null);
  const [lockedPlayers, setLockedPlayers] = useState([]);
  const [lockedDetail, setLockedDetail] = useState(null);
  const [lockedNote, setLockedNote] = useState(null);

  useEffect(() => {
    loadMatches();
    loadLocked();
  }, []);

  async function loadLocked() {
    const res = await fetch('/api/list', { cache: 'no-store' });
    const data = await res.json();
    const sorted = [...(data.locked || [])].sort((a, b) => b.balance - a.balance);
    setLockedPlayers(sorted);
  }

  async function loadMatches() {
    const res = await fetch('/api/matches/open', { cache: 'no-store' });
    const data = await res.json();
    setMatches(data.matches || []);
    if (data.matches?.length) setMatchId(data.matches[0].id);
  }

  const currentMatch = matches.find((m) => m.id === matchId);
  const mainOpen = currentMatch ? currentMatch.main_count < currentMatch.main_capacity : false;

  useEffect(() => {
    setLockedDetail(null);
    setLockedNote(null);
    if (player?.status === 'locked') {
      loadLockedDetail(player.id);
    }
  }, [player]);

  async function loadLockedDetail(playerId) {
    const res = await fetch(`/api/status?player_id=${playerId}`, { cache: 'no-store' });
    const data = await res.json();
    setLockedDetail(data);
  }

  async function payLateFee() {
    if (!player) return;
    setLockedNote('جارٍ الإرسال...');
    const res = await fetch('/api/status/pay-late-fee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: player.id }),
    });
    const data = await res.json();
    setLockedNote(data.message || data.error);
    loadLockedDetail(player.id);
  }

  async function submit(e) {
    e.preventDefault();
    if (!player || !matchId) return;
    setSubmitting(true);
    setResult(null);
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: player.id, match_id: matchId, phone: toDigits(phone), paid }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setResult({ ok: false, message: data.message || data.error });
    } else {
      setResult({ ok: true, message: data.message, type: data.type });
      loadMatches();
      loadLocked();
    }
  }

  async function requestAdd(name) {
    if (mainOpen && !paid) {
      setAddRequestName(name);
      setAddRequestMessage('أكّد أنك دفعت عبر مربع "لقد دفعت..." أعلاه أولاً، ثم اضغط لإضافة الاسم مرة أخرى.');
      return;
    }
    setAddRequestName(name);
    setAddRequestMessage('جارٍ الإرسال...');
    const res = await fetch('/api/players/request-add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone: toDigits(phone), match_id: matchId, paid }),
    });
    const data = await res.json();
    setAddRequestMessage(data.message || data.error);
    loadMatches();
    loadLocked();
  }

  const isLocked = player?.status === 'locked';

  return (
    <main className="max-w-xl mx-auto px-5 py-10 md:py-16">
      <div className="mb-10">
        <p className="eyebrow">يوم المباراة</p>
        <h1 className="font-display text-5xl md:text-6xl mt-1">سجّل للعب</h1>
        <p className="text-chalk/60 mt-2">
          اختر المباراة، أدخل جوالك وأكّد دفع حصتك، ثم ابحث عن اسمك وستكون على القائمة.
        </p>
        <div className="flex gap-3 mt-4">
          <Link href="/list" className="btn-ghost text-sm">عرض قائمة اللاعبين</Link>
          <Link href="/status" className="btn-ghost text-sm">تحقق من حالتي</Link>
        </div>
      </div>

      {lockedPlayers.length > 0 && (
        <div className="card p-4 border-rust/40 mb-8">
          <h2 className="text-xs text-rust font-semibold mb-2">
            عليه غرامة تأخير — محظور من التسجيل
          </h2>
          <p className="text-xs text-chalk/50 mb-2">اضغط على اسمك للدفع وإلغاء الحظر.</p>
          <ul className="space-y-1.5">
            {lockedPlayers.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setPlayer({ id: p.id, name: p.name, status: 'locked' })}
                  className="w-full flex items-center justify-between text-sm hover:text-amber transition text-start"
                >
                  <span>{p.name}</span>
                  <span className="text-rust font-semibold">{p.balance} ريال</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isLocked ? (
        <div className="card p-5 border-rust/50 text-sm">
          <p className="text-rust font-semibold">
            عليك غرامة تأخير قدرها {lockedDetail?.player?.balance ?? '...'} ريال.
          </p>
          <p className="text-chalk/70 mt-1">
            لا يمكنك التسجيل لمباريات جديدة حتى يتم دفع الغرامة والموافقة عليها.
          </p>
          {lockedDetail?.pendingLateFeeClaim ? (
            <p className="text-amber mt-3">تم إرسال الدفع — بانتظار موافقة المسؤول.</p>
          ) : (
            <button type="button" className="btn-primary mt-3" onClick={payLateFee}>
              لقد دفعت الغرامة عبر STC Pay
            </button>
          )}
          {lockedNote && <p className="text-chalk/60 mt-2">{lockedNote}</p>}
        </div>
      ) : matches.length === 0 ? (
        <div className="card p-6 text-chalk/70">
          لا توجد مباراة مفتوحة للتسجيل حالياً. تحقق لاحقاً قرب يوم الأحد أو الثلاثاء، أو اطلب من المسؤول فتح التسجيل.
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-6">
          <div>
            <label className="label">المباراة</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1.5">
              {matches.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setMatchId(m.id)}
                  className={`card p-4 text-start transition ${
                    matchId === m.id ? 'border-amber ring-1 ring-amber' : 'hover:border-chalk/30'
                  }`}
                >
                  <p className="font-display text-2xl">{formatDay(m.day_type)}</p>
                  <p className="text-xs text-chalk/60 mt-1">{m.match_date}</p>
                  <p className="text-xs text-chalk/60 mt-2">
                    {m.main_count}/{m.main_capacity} أساسي · {m.bench_count}/{m.bench_capacity} احتياط
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">رقم الجوال</label>
            <input
              type="tel"
              inputMode="numeric"
              dir="ltr"
              className="input mt-1.5 text-start"
              placeholder="05X XXX XXXX"
              value={phone}
              onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
              required
            />
            {phone.length > 0 && !isValidSaudiPhone(phone) && (
              <p className="text-xs text-rust mt-1.5">
                أدخل رقم جوال سعودي صحيح، مثال: 05X XXX XXXX
              </p>
            )}
          </div>

          {currentMatch && mainOpen && (
            <label className="flex items-start gap-3 card p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={paid}
                onChange={(e) => setPaid(e.target.checked)}
                className="mt-1 w-4 h-4 accent-amber"
              />
              <span className="text-sm text-chalk/80">
                لقد دفعت <strong>{currentMatch.match_fee} ريال</strong> عبر STC Pay لهذه المباراة.
                يوجد مكان في القائمة الأساسية — هذا مطلوب لإضافتك إليها.
              </span>
            </label>
          )}

          {currentMatch && !mainOpen && (
            <div className="card p-4 text-sm text-chalk/70">
              القائمة الأساسية مكتملة. سيتم تسجيلك على <strong>قائمة الاحتياط</strong> — لا حاجة للدفع الآن.
              إذا فتح مكان سيُطلب منك الدفع حينها.
            </div>
          )}

          <PlayerSearch
            selected={player}
            onSelect={setPlayer}
            onRequestAdd={(name) => requestAdd(name)}
          />

          {addRequestName && (
            <p className="text-sm text-amber -mt-3">{addRequestMessage}</p>
          )}

          <button
            type="submit"
            disabled={!player || !isValidSaudiPhone(phone) || (mainOpen && !paid) || submitting}
            className="btn-primary w-full disabled:opacity-40"
          >
            {submitting ? 'جارٍ الإرسال...' : 'تسجيل'}
          </button>

          {mainOpen && !paid && player && isValidSaudiPhone(phone) && (
            <p className="text-xs text-rust -mt-3 text-center">
              أكّد الدفع بالضغط على مربع "لقد دفعت..." أعلاه لتفعيل زر التسجيل.
            </p>
          )}

          {result && (
            <div className={`card p-4 text-sm ${result.ok ? 'border-amber/50' : 'border-rust/50'}`}>
              <p className={result.ok ? 'text-amber' : 'text-rust'}>{result.message}</p>
            </div>
          )}
        </form>
      )}
    </main>
  );
}
