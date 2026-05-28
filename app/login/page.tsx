'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        setError('Wrong password. Try again.');
      }
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#f2f2f0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    }}>
      <div style={{
        background: '#fff', borderRadius: '10px', padding: '40px 36px',
        width: '340px', boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <img src="/logo.png" alt="Aruma" style={{ height: '44px' }} />
        </div>

        <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#1a1a1a', marginBottom: '4px', textAlign: 'center' }}>
          Invoice Portal
        </h2>
        <p style={{ fontSize: '11px', color: '#999', textAlign: 'center', marginBottom: '24px' }}>
          Enter your password to continue
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '10.5px', color: '#666', fontWeight: 500, marginBottom: '5px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
              style={{
                width: '100%', padding: '9px 11px', border: '1px solid #ddd',
                borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit',
                background: '#fafafa', boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <div style={{ fontSize: '11px', color: '#e53e3e', marginBottom: '12px' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: '100%', padding: '11px', background: '#1a1a1a',
              color: '#fff', border: 'none', borderRadius: '7px',
              fontSize: '12.5px', fontWeight: 600, cursor: 'pointer',
              opacity: loading || !password ? 0.5 : 1,
            }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
