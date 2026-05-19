import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

export default function CartPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [address, setAddress] = useState('');
  const [payment, setPayment] = useState('cod');
  const [step, setStep] = useState('cart');
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const fetchCart = () => {
    api.get('/cart').then(r => { setItems(r.data.items || []); setTotal(r.data.total || 0); }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchCart(); }, []);

  const updateQty = async (itemId, qty) => {
    await api.put(`/cart/${itemId}`, { quantity: qty });
    fetchCart();
  };

  const removeItem = async (itemId) => {
    await api.delete(`/cart/${itemId}`);
    fetchCart();
  };

  const placeOrder = async () => {
    if (!address.trim()) return setMsg('Please enter your delivery address.');
    setCheckingOut(true);
    try {
      const orderItems = items.map(i => ({ product_id: i.product_id, quantity: i.quantity }));
      const { data } = await api.post('/orders', { items: orderItems, shipping_address: address, payment_method: payment });
      if (data.success) {
        navigate(`/consumer/orders?success=${data.orderId}`);
      }
    } catch (err) {
      setMsg(err.response?.data?.message || 'Order failed. Please try again.');
    } finally { setCheckingOut(false); }
  };

  if (loading) return <div className="loading-center"><div className="spinner"></div></div>;

  if (items.length === 0 && step === 'cart') {
    return (
      <div className="page-content">
        <div className="page-wrap">
          <div className="empty-state">
            <div className="empty-icon">🛒</div>
            <h3>Your cart is empty</h3>
            <p>Add some products to get started</p>
            <button className="btn btn-primary" onClick={() => navigate('/shop')}>Start Shopping</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-wrap">
        <h2 style={{ marginBottom: '1.5rem' }}>{step === 'cart' ? '🛒 Your Cart' : '📦 Checkout'}</h2>

        {msg && <div className="alert alert-error">{msg}</div>}

        <div className="grid-2" style={{ alignItems: 'start' }}>
          {/* Items */}
          <div>
            {step === 'cart' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {items.map(item => (
                  <div key={item.id} className="card card-body" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ fontSize: '2rem', width: '60px', height: '60px', background: 'var(--surface-2)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>📦</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem', marginBottom: '0.2rem' }}>{item.name}</div>
                      <div style={{ color: 'var(--ink-3)', fontSize: '0.82rem', marginBottom: '0.4rem' }}>🏪 {item.shop_name}</div>
                      <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>₹{Number(item.price).toLocaleString('en-IN')}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => item.quantity > 1 ? updateQty(item.id, item.quantity - 1) : removeItem(item.id)}>−</button>
                      <span style={{ width: '1.5rem', textAlign: 'center' }}>{item.quantity}</span>
                      <button className="btn btn-secondary btn-sm" onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>₹{Number(item.price * item.quantity).toLocaleString('en-IN')}</div>
                      <button className="btn btn-ghost btn-sm" onClick={() => removeItem(item.id)} style={{ color: 'var(--danger)', marginTop: '0.3rem' }}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card card-body">
                <h3 style={{ marginBottom: '1rem' }}>Delivery Details</h3>
                <div className="form-group">
                  <label>Delivery Address *</label>
                  <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Full address: House/flat no, Street, Area, City, State, Pincode" rows={4} required />
                </div>
                <div className="form-group">
                  <label>Payment Method</label>
                  <select value={payment} onChange={e => setPayment(e.target.value)}>
                    <option value="cod">Cash on Delivery</option>
                    <option value="online">Online Payment</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                  <button className="btn btn-secondary" onClick={() => setStep('cart')}>← Back to Cart</button>
                  <button className="btn btn-primary btn-full" onClick={placeOrder} disabled={checkingOut}>
                    {checkingOut ? '⏳ Placing Order...' : '✅ Place Order'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="card card-body" style={{ position: 'sticky', top: '80px' }}>
            <h3 style={{ marginBottom: '1rem' }}>Order Summary</h3>
            {items.map(i => (
              <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.88rem' }}>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '0.5rem' }}>{i.name} ×{i.quantity}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>₹{Number(i.price * i.quantity).toLocaleString('en-IN')}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.8rem', paddingTop: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem' }}>
                <span>Total</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>₹{Number(total).toLocaleString('en-IN')}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: '0.3rem' }}>✓ Free delivery included</div>
            </div>
            {step === 'cart' && (
              <button className="btn btn-primary btn-full" style={{ marginTop: '1rem' }} onClick={() => setStep('checkout')}>
                Proceed to Checkout →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
