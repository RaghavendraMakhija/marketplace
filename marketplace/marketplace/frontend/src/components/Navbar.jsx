import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const ROLE_ICONS = { boss: '👑', seller: '🏪', consumer: '🛍️' };
const ROLE_COLORS = { boss: 'boss', seller: 'seller', consumer: 'consumer' };

export default function Navbar() {
  const { user, logout, unreadCount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  React.useEffect(() => {
    if (user?.role === 'consumer') {
      api.get('/cart').then(r => setCartCount(r.data.count || 0)).catch(() => {});
    }
  }, [user, location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const links = {
    boss: [
      { to: '/boss', label: 'Dashboard' },
      { to: '/boss/sellers', label: 'Sellers' },
      { to: '/boss/products', label: 'Products' },
      { to: '/boss/orders', label: 'Orders' },
      { to: '/boss/users', label: 'Users' },
      { to: '/boss/security', label: 'Security' },
    ],
    seller: [
      { to: '/seller', label: 'Dashboard' },
      { to: '/seller/products', label: 'My Products' },
      { to: '/seller/orders', label: 'Orders' },
      { to: '/seller/add-product', label: '+ Add Product' },
    ],
    consumer: [
      { to: '/shop', label: 'Shop' },
      { to: '/consumer/orders', label: 'My Orders' },
    ],
  };

  const navLinks = user ? (links[user.role] || []) : [];

  return (
    <nav style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0,
      zIndex: 100,
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div className="page-wrap" style={{ display: 'flex', alignItems: 'center', height: '60px', gap: '1rem' }}>
        {/* Logo */}
        <Link to={user ? `/${user.role}` : '/'} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <span style={{ fontSize: '1.4rem' }}>🛒</span>
          <span style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>BazaarX</span>
        </Link>

        {/* Desktop nav links */}
        <div style={{ display: 'flex', gap: '0.2rem', flex: 1, overflow: 'hidden' }} className="desktop-nav">
          {navLinks.map(l => (
            <Link key={l.to} to={l.to} style={{
              padding: '0.4rem 0.8rem',
              borderRadius: 'var(--radius)',
              fontSize: '0.88rem',
              fontWeight: location.pathname === l.to ? 600 : 400,
              color: location.pathname === l.to ? 'var(--accent)' : 'var(--ink-2)',
              background: location.pathname === l.to ? 'var(--accent-light)' : 'transparent',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              transition: 'all var(--transition)',
            }}>{l.label}</Link>
          ))}
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
          {user?.role === 'consumer' && (
            <Link to="/cart" style={{ position: 'relative', textDecoration: 'none' }}>
              <button className="btn btn-secondary btn-sm">
                🛒 Cart {cartCount > 0 && <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: '20px', padding: '0 5px', fontSize: '0.7rem' }}>{cartCount}</span>}
              </button>
            </Link>
          )}

          {user && (
            <Link to={`/${user.role}/notifications`} style={{ position: 'relative', textDecoration: 'none' }}>
              <button className="btn btn-ghost btn-sm" style={{ position: 'relative' }}>
                🔔
                {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </button>
            </Link>
          )}

          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setMenuOpen(!menuOpen)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <span className={`role-pill ${ROLE_COLORS[user.role]}`}>{ROLE_ICONS[user.role]} {user.role}</span>
                <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</span>
                ▾
              </button>

              {menuOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: '110%',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  boxShadow: 'var(--shadow-lg)',
                  minWidth: '180px',
                  zIndex: 200,
                  overflow: 'hidden',
                }}>
                  <div style={{ padding: '0.8rem 1rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--ink-3)' }}>{user.email}</div>
                  </div>
                  <Link to={`/${user.role}/profile`} onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '0.65rem 1rem', fontSize: '0.88rem', color: 'var(--ink)', textDecoration: 'none' }}>
                    👤 My Profile
                  </Link>
                  <button onClick={handleLogout} style={{ width: '100%', text: 'left', padding: '0.65rem 1rem', fontSize: '0.88rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', textAlign: 'left', display: 'block' }}>
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login"><button className="btn btn-primary btn-sm">Sign In</button></Link>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) { .desktop-nav { display: none !important; } }
      `}</style>

      {menuOpen && <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />}
    </nav>
  );
}
