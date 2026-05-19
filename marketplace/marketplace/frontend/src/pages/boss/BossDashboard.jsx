import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
export default function BossDashboard() {
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();
  useEffect(() => { api.get('/boss/dashboard').then(r => setStats(r.data.stats)).catch(() => {}); }, []);
  if (!stats) return <div className="loading-center"><div className="spinner"></div></div>;
  const cards = [
    { label: 'Total Users', value: stats.totalUsers, sub: `${stats.totalSellers} sellers · ${stats.totalConsumers} buyers`, icon: '👥', link: '/boss/users', color: 'var(--accent)' },
    { label: 'Pending Sellers', value: stats.pendingSellerApprovals, sub: 'Awaiting review', icon: '⏳', link: '/boss/sellers', color: 'var(--warning)' },
    { label: 'Live Products', value: stats.totalProducts, sub: `${stats.pendingProducts} pending`, icon: '📦', link: '/boss/products', color: 'var(--success)' },
    { label: 'Total Orders', value: stats.totalOrders, sub: `${stats.pendingOrders} pending · ${stats.todayOrders} today`, icon: '📋', link: '/boss/orders', color: 'var(--seller)' },
    { label: 'Total Revenue', value: `₹${Number(stats.totalRevenue||0).toLocaleString('en-IN')}`, sub: 'From delivered orders', icon: '💰', link: '/boss/orders', color: 'var(--boss)' },
    { label: 'Pending Products', value: stats.pendingProducts, sub: 'Awaiting approval', icon: '🔍', link: '/boss/products', color: 'var(--danger)' },
  ];
  return (
    <div className="page-content"><div className="page-wrap">
      <div style={{ marginBottom: '2rem' }}><h2>👑 Admin Dashboard</h2><p style={{ color: 'var(--ink-3)', marginTop: '0.3rem' }}>Platform overview</p></div>
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        {cards.map(c => (
          <div key={c.label} className="stat-card" style={{ cursor: 'pointer', borderTop: `3px solid ${c.color}` }} onClick={() => navigate(c.link)}>
            <div style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>{c.icon}</div>
            <div className="stat-label">{c.label}</div>
            <div className="stat-value" style={{ fontSize: '1.8rem' }}>{c.value}</div>
            <div className="stat-sub">{c.sub}</div>
          </div>
        ))}
      </div>
      {(stats.pendingSellerApprovals > 0 || stats.pendingProducts > 0) && (
        <div className="card card-body" style={{ borderLeft: '4px solid var(--warning)' }}>
          <h3 style={{ marginBottom: '0.8rem' }}>⚠️ Action Required</h3>
          {stats.pendingSellerApprovals > 0 && <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.5rem' }}><span>{stats.pendingSellerApprovals} seller(s) waiting for approval</span><button className="btn btn-primary btn-sm" onClick={() => navigate('/boss/sellers')}>Review</button></div>}
          {stats.pendingProducts > 0 && <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}><span>{stats.pendingProducts} product(s) waiting for approval</span><button className="btn btn-primary btn-sm" onClick={() => navigate('/boss/products')}>Review</button></div>}
        </div>
      )}
    </div></div>
  );
}
