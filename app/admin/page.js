'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (!res.ok) {
      setError('كلمة المرور غير صحيحة.');
      return;
    }
    router.push('/admin/dashboard');
  }

  return (
    <main className="max-w-sm mx-auto px-5 py-24">
      <p className="eyebrow">يوم المباراة</p>
      <h1 className="font-display text-4xl mt-1 mb-6">دخول المسؤول</h1>
      <form onSubmit={submit} className="space-y-4">
        <input
          type="password"
          className="input"
          placeholder="كلمة مرور المسؤول"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? 'جارٍ التحقق...' : 'دخول'}
        </button>
        {error && <p className="text-rust text-sm">{error}</p>}
      </form>
    </main>
  );
}
