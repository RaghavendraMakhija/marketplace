import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function SellerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/products/seller/mine').then(r => setProducts(r.data.products || [])).catch(() => {}),
      api.get('/orders/seller').then(r => setOrders(r.data.orderItems || [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const isApproved = user?.sellerProfile?.is_approved;

  const stats = {
    totalProducts: products.length,
    liveProducts: products.filter(p => p.is_approved).length,
    pendingProducts: products.filter(p => !p.is_approved).length,
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    revenue: orders.filter(o => ['delivered'].includes(o.status)).reduce((s, o) => s + o.price * o.quantity, 0),
  };

  if (loading) return <div className="loading-center"><div className="spinner"></div></div>;

  if (!isApproved) {
    return (
      <div className="page-content">
        <div className="page-wrap">
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <h3>Account Pending Approval</h3>
            <p>Your seller account is being reviewed by our team. You'll be notified once approved.</p>
            <div className="alert alert-info" style={{ maxWidth: '400px', margin: '1rem auto 0', textAlign: 'left' }}>
              <div>Shop: <strong>{user?.sellerProfile?.shop_name}</strong></div>
              <div style={{ marginTop: '0.3rem' }}>Email: {user?.email}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2>🏪 {user?.sellerProfile?.shop_name || 'My Shop'}</h2>
            <p style={{ color: 'var(--ink-3)', fontSize: '0.88rem' }}>Welcome back, {user?.name}</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/seller/add-product')}>+ Add Product</button>
        </div>

        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: '2rem' }}>
          {[
            { label: 'Live Products', value: stats.liveProducts, sub: `${stats.pendingProducts} pending`, icon: '📦' },
            { label: 'Total Orders', value: stats.totalOrders, sub: `${stats.pendingOrders} pending`, icon: '📋' },
            { label: 'Revenue Earned', value: `₹${Number(stats.revenue).toLocaleString('en-IN')}`, sub: 'From delivered orders', icon: '💰' },
            { label: 'Shop Rating', value: Number(user?.sellerProfile?.rating || 0).toFixed(1), sub: 'Average rating', icon: '⭐' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{s.icon}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ fontSize: '1.6rem' }}>{s.value}</div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Recent products */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3>Recent Products</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/seller/products')}>View All →</button>
          </div>
          {products.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <p>No products yet. <button className="btn btn-ghost btn-sm" onClick={() => navigate('/seller/add-product')}>Add your first product</button></p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Status</th><th>Rating</th></tr></thead>
                <tbody>
                  {products.slice(0, 5).map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 500 }}>{p.name}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>₹{Number(p.price).toLocaleString('en-IN')}</td>
                      <td><span className={`badge ${p.stock > 5 ? 'badge-green' : p.stock > 0 ? 'badge-yellow' : 'badge-red'}`}>{p.stock} {p.unit}</span></td>
                      <td><span className={`badge ${p.is_approved ? 'badge-green' : 'badge-yellow'}`}>{p.is_approved ? 'Live' : 'Pending'}</span></td>
                      <td style={{ color: 'var(--warning)' }}>{'★'.repeat(Math.round(p.avg_rating || 0))} {p.avg_rating ? Number(p.avg_rating).toFixed(1) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Orders</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/seller/orders')}>View All →</button>
          </div>
          {orders.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}><p>No orders yet.</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Product</th><th>Buyer</th><th>Qty</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {orders.slice(0, 5).map(o => (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 500 }}>{o.product_name}</td>
                      <td>{o.consumer_name}</td>
                      <td>{o.quantity}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>₹{Number(o.price * o.quantity).toLocaleString('en-IN')}</td>
                      <td><span className={`badge badge-${o.status === 'delivered' ? 'green' : 'yellow'}`}>{o.status}</span></td>
                      <td style={{ color: 'var(--ink-3)', fontSize: '0.82rem' }}>{new Date(o.order_date).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
