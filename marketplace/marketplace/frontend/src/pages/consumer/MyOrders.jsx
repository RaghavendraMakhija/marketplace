import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../utils/api';

const STATUS_STYLES = {
  pending: 'badge-yellow', confirmed: 'badge-blue', packed: 'badge-teal',
  shipped: 'badge-purple', delivered: 'badge-green', cancelled: 'badge-red',
  refund_requested: 'badge-yellow', refunded: 'badge-gray',
};

const STATUS_LABELS = {
  pending: '⏳ Pending', confirmed: '✅ Confirmed', packed: '📦 Packed',
  shipped: '🚚 Shipped', delivered: '✓ Delivered', cancelled: '✗ Cancelled',
  refund_requested: '↩ Refund Requested', refunded: '💰 Refunded',
};

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const successOrderId = searchParams.get('success');

  useEffect(() => {
    api.get('/orders/mine').then(r => setOrders(r.data.orders || [])).finally(() => setLoading(false));
  }, []);

  const cancelOrder = async (orderId) => {
    if (!confirm('Cancel this order?')) return;
    try {
      await api.patch(`/orders/${orderId}/status`, { status: 'cancelled' });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
    } catch (err) { alert(err.response?.data?.message || 'Could not cancel'); }
  };

  if (loading) return <div className="loading-center"><div className="spinner"></div></div>;

  return (
    <div className="page-content">
      <div className="page-wrap">
        <h2 style={{ marginBottom: '1.5rem' }}>📦 My Orders</h2>

        {successOrderId && (
          <div className="alert alert-success">
            🎉 Order placed successfully! Order ID: <strong>{successOrderId.slice(0, 8)}...</strong>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>No orders yet</h3>
            <p>Your orders will appear here once you start shopping</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {orders.map(order => {
              const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
              return (
                <div key={order.id} className="card">
                  <div className="card-header">
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--ink-3)', marginBottom: '0.2rem' }}>
                        Order #{order.id.slice(0, 8).toUpperCase()} · {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <span className={`badge ${STATUS_STYLES[order.status] || 'badge-gray'}`}>{STATUS_LABELS[order.status] || order.status}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem' }}>₹{Number(order.total_amount).toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--ink-3)' }}>{order.payment_method?.toUpperCase()}</div>
                    </div>
                  </div>
                  <div className="card-body">
                    {items?.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                        <div>
                          <div style={{ fontWeight: 500 }}>{item.product_name}</div>
                          <div style={{ color: 'var(--ink-3)', fontSize: '0.82rem' }}>🏪 {item.shop_name} · Qty: {item.quantity}</div>
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>₹{Number(item.price * item.quantity).toLocaleString('en-IN')}</div>
                      </div>
                    ))}
                    <div style={{ marginTop: '0.8rem', fontSize: '0.85rem', color: 'var(--ink-3)' }}>
                      📍 {order.shipping_address}
                    </div>
                    {['pending', 'confirmed'].includes(order.status) && (
                      <button className="btn btn-danger btn-sm" style={{ marginTop: '0.8rem' }} onClick={() => cancelOrder(order.id)}>Cancel Order</button>
                    )}
                    {order.status === 'delivered' && (
                      <button className="btn btn-secondary btn-sm" style={{ marginTop: '0.8rem' }} onClick={() => api.patch(`/orders/${order.id}/status`, { status: 'refund_requested' }).then(() => setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'refund_requested' } : o)))}>
                        Request Refund
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
