import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get(`/products/${id}`).then(r => setProduct(r.data.product)).catch(() => navigate('/shop')).finally(() => setLoading(false));
  }, [id]);

  const addToCart = async () => {
    if (!user) return navigate('/login');
    try {
      await api.post('/cart', { product_id: id, quantity: qty });
      setMsg('✅ Added to cart!');
    } catch (err) { setMsg('❌ ' + (err.response?.data?.message || 'Error')); }
  };

  const buyNow = async () => {
    if (!user) return navigate('/login');
    await addToCart();
    navigate('/cart');
  };

  if (loading) return <div className="loading-center"><div className="spinner"></div></div>;
  if (!product) return <div className="empty-state"><div className="empty-icon">😕</div><h3>Product not found</h3></div>;

  const disc = product.mrp && product.mrp > product.price ? Math.round((1 - product.price / product.mrp) * 100) : 0;

  return (
    <div className="page-content">
      <div className="page-wrap">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>← Back</button>

        <div className="grid-2" style={{ gap: '2rem' }}>
          {/* Image */}
          <div className="card" style={{ height: '360px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '6rem' }}>
            📦
          </div>

          {/* Info */}
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.7rem', flexWrap: 'wrap' }}>
              {product.category_name && <span className="badge badge-blue">{product.category_name}</span>}
              {disc > 0 && <span className="badge badge-green">{disc}% OFF</span>}
              {product.stock < 5 && product.stock > 0 && <span className="badge badge-yellow">Only {product.stock} left</span>}
              {product.stock === 0 && <span className="badge badge-red">Out of Stock</span>}
            </div>

            <h1 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>{product.name}</h1>
            <p style={{ color: 'var(--ink-3)', fontSize: '0.88rem', marginBottom: '1rem' }}>
              Sold by <strong style={{ color: 'var(--seller)' }}>{product.shop_name}</strong>
            </p>

            {product.avg_rating > 0 && (
              <div style={{ marginBottom: '0.8rem', color: 'var(--warning)', fontSize: '1rem' }}>
                {'★'.repeat(Math.round(product.avg_rating))}{'☆'.repeat(5 - Math.round(product.avg_rating))}
                <span style={{ color: 'var(--ink-3)', fontSize: '0.85rem', marginLeft: '0.4rem' }}>({product.review_count} reviews)</span>
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>₹{Number(product.price).toLocaleString('en-IN')}</span>
              {product.mrp && product.mrp > product.price && (
                <span style={{ color: 'var(--ink-4)', textDecoration: 'line-through', marginLeft: '0.8rem', fontSize: '1.1rem' }}>₹{Number(product.mrp).toLocaleString('en-IN')}</span>
              )}
            </div>

            {product.description && (
              <p style={{ color: 'var(--ink-2)', fontSize: '0.92rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>{product.description}</p>
            )}

            {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}

            {product.stock > 0 && user?.role !== 'seller' && user?.role !== 'boss' && (
              <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
                  <span style={{ width: '2rem', textAlign: 'center', fontWeight: 600 }}>{qty}</span>
                  <button className="btn btn-secondary btn-sm" onClick={() => setQty(Math.min(product.stock, qty + 1))}>+</button>
                </div>
                <button className="btn btn-secondary" onClick={addToCart}>🛒 Add to Cart</button>
                <button className="btn btn-primary" onClick={buyNow}>Buy Now</button>
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        {product.reviews?.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>Customer Reviews</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {product.reviews.map(r => (
                <div key={r.id} className="card card-body" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <strong>{r.reviewer_name}</strong>
                    <span style={{ color: 'var(--warning)' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  </div>
                  {r.comment && <p style={{ color: 'var(--ink-2)', fontSize: '0.9rem' }}>{r.comment}</p>}
                  {r.is_verified_purchase === 1 && <span className="badge badge-green" style={{ marginTop: '0.4rem' }}>✓ Verified Purchase</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
