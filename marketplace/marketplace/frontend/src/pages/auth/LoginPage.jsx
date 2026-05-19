import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const ROLES = [
  { id: 'consumer', label: 'Buyer', icon: '🛍️', desc: 'Browse and buy products', color: 'var(--accent)', bg: 'var(--accent-light)' },
  { id: 'seller', label: 'Seller', icon: '🏪', desc: 'Sell your products', color: 'var(--seller)', bg: 'var(--seller-light)' },
  { id: 'boss', label: 'Admin', icon: '👑', desc: 'Platform management', color: 'var(--boss)', bg: 'var(--boss-light)' },
];

export default function LoginPage() {
  const [tab, setTab] = useState('login');
  const [selectedRole, setSelectedRole] = useState('consumer');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', shopName: '', role: 'consumer' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError(''); };

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    set('role', roleId);
    if (roleId === 'boss') setTab('login');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = tab === 'login' ? '/auth/login' : '/auth/register';
      const payload = tab === 'login'
        ? { email: form.email, password: form.password }
        : { ...form, role: selectedRole };
      const { data } = await api.post(endpoint, payload);
      if (data.success) {
        login(data.user, data.token);
        const dest = { boss: '/boss', seller: '/seller', consumer: '/shop' };
        navigate(dest[data.user.role] || '/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🛒</div>
        <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', marginBottom: '0.3rem' }}>BazaarX</h1>
        <p style={{ color: 'var(--ink-3)', fontSize: '0.92rem' }}>Your trusted online marketplace</p>
      </div>

      <div className="card fade-in" style={{ width: '100%', maxWidth: '440px' }}>
        {/* Tab switcher */}
        {selectedRole !== 'boss' && (
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            {['login', 'register'].map(t => (
              <button key={t} onClick={() => { setTab(t); setError(''); }}
                style={{
                  flex: 1, padding: '1rem', background: 'none', cursor: 'pointer',
                  fontWeight: tab === t ? 600 : 400,
                  color: tab === t ? 'var(--accent)' : 'var(--ink-3)',
                  borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
                  fontSize: '0.92rem', textTransform: 'capitalize',
                }}
              >{t === 'login' ? 'Sign In' : 'Create Account'}</button>
            ))}
          </div>
        )}

        <div className="card-body">
          {/* Role selector */}
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--ink-3)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>I am a</p>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              {ROLES.map(r => (
                <button key={r.id} onClick={() => handleRoleSelect(r.id)}
                  style={{
                    flex: 1, padding: '0.8rem 0.4rem', borderRadius: 'var(--radius)',
                    border: `2px solid ${selectedRole === r.id ? r.color : 'var(--border)'}`,
                    background: selectedRole === r.id ? r.bg : 'var(--surface)',
                    cursor: 'pointer', textAlign: 'center', transition: 'all var(--transition)',
                  }}>
                  <div style={{ fontSize: '1.3rem' }}>{r.icon}</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: selectedRole === r.id ? r.color : 'var(--ink-2)', marginTop: '0.2rem' }}>{r.label}</div>
                </button>
              ))}
            </div>
            {selectedRole !== 'consumer' && (
              <p style={{ fontSize: '0.8rem', color: 'var(--ink-3)', marginTop: '0.5rem', textAlign: 'center' }}>
                {ROLES.find(r => r.id === selectedRole)?.desc}
              </p>
            )}
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            {tab === 'register' && selectedRole !== 'boss' && (
              <>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your full name" required />
                </div>
                {selectedRole === 'seller' && (
                  <div className="form-group">
                    <label>Shop Name *</label>
                    <input value={form.shopName} onChange={e => set('shopName', e.target.value)} placeholder="e.g. Ravi Electronics" required />
                  </div>
                )}
                <div className="form-group">
                  <label>Phone</label>
                  <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="Mobile number" type="tel" />
                </div>
              </>
            )}

            <div className="form-group">
              <label>Email Address *</label>
              <input value={form.email} onChange={e => set('email', e.target.value)} type="email" placeholder="your@email.com" required autoComplete="email" />
            </div>

            <div className="form-group">
              <label>Password *</label>
              <input value={form.password} onChange={e => set('password', e.target.value)} type="password" placeholder={tab === 'register' ? 'Min 6 chars, 1 uppercase, 1 number' : 'Your password'} required autoComplete={tab === 'login' ? 'current-password' : 'new-password'} />
              {tab === 'register' && <span className="help-text">Must have uppercase letter and number</span>}
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span> Please wait...</> : (tab === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          {tab === 'login' && selectedRole === 'boss' && (
            <p style={{ fontSize: '0.8rem', color: 'var(--ink-3)', textAlign: 'center', marginTop: '1rem' }}>
              Default: boss@marketplace.com / Boss@1234
            </p>
          )}
        </div>
      </div>

      <p style={{ fontSize: '0.78rem', color: 'var(--ink-4)', marginTop: '1.5rem', textAlign: 'center' }}>
        By signing in, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}
