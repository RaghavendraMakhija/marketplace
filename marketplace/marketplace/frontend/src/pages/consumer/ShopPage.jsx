import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';

const CATEGORY_ICONS = { electronics: '📱', clothing: '👕', 'home-kitchen': '🏠', books: '📚', sports: '⚽', beauty: '💄', toys: '🧸', grocery: '🛒' };

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    sort: 'created_at',
    minPrice: '', maxPrice: '',
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)) };
      const { data } = await api.get('/products', { params });
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch { setProducts([]); } finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { api.get('/categories').then(r => setCategories(r.data.categories || [])).catch(() => {}); }, []);

  const addToCart = async (e, productId) => {
    e.stopPropagation();
    try {
      await api.post('/cart', { product_id: productId, quantity: 1 });
      alert('Added to cart!');
    } catch (err) {
      alert(err.response?.data?.message || 'Could not add to cart');
    }
  };

  const applyFilter = (k, v) => {
    setFilters(p => ({ ...p, [k]: v }));
    setPage(1);
  };

  const discountPct = (price, mrp) => mrp && mrp > price ? Math.round((1 - price / mrp) * 100) : 0;

  return (
    <div className="page-content">
      <div className="page-wrap">

        {/* Search bar */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.2rem', marginBottom: '1.5rem', display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
          <input
            value={filters.search}
            onChange={e => applyFilter('search', e.target.value)}
            placeholder="🔍  Search products, brands, categories..."
            style={{ flex: 1, minWidth: '200px', fontSize: '1rem', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.7rem 1rem' }}
          />
          <select value={filters.sort} onChange={e => applyFilter('sort', e.target.value)} style={{ width: 'auto' }}>
            <option value="created_at">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input value={filters.minPrice} onChange={e => applyFilter('minPrice', e.target.value)} placeholder="Min ₹" style={{ width: '90px' }} type="number" min="0" />
            <span style={{ color: 'var(--ink-3)' }}>–</span>
            <input value={filters.maxPrice} onChange={e => applyFilter('maxPrice', e.target.value)} placeholder="Max ₹" style={{ width: '90px' }} type="number" min="0" />
          </div>
        </div>

        {/* Categories */}
        <div style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', marginBottom: '1.5rem', paddingBottom: '0.3rem' }}>
          <button
            className={`btn btn-sm ${!filters.category ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => applyFilter('category', '')}
          >All</button>
          {categories.map(c => (
            <button key={c.id}
              className={`btn btn-sm ${filters.category === c.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => applyFilter('category', filters.category === c.id ? '' : c.id)}
              style={{ whiteSpace: 'nowrap' }}
            >
              {CATEGORY_ICONS[c.slug] || '📦'} {c.name}
            </button>
          ))}
        </div>

        {/* Results count */}
        {!loading && (
          <p style={{ color: 'var(--ink-3)', fontSize: '0.88rem', marginBottom: '1rem' }}>
            {total > 0 ? `Showing ${products.length} of ${total} products` : 'No products found'}
            {filters.search && ` for "${filters.search}"`}
          </p>
        )}

        {/* Products grid */}
        {loading ? (
          <div className="loading-center"><div className="spinner"></div></div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No products found</h3>
            <p>Try different search terms or remove filters</p>
            <button className="btn btn-primary" onClick={() => setFilters({ search: '', category: '', sort: 'created_at', minPrice: '', maxPrice: '' })}>Clear Filters</button>
          </div>
        ) : (
          <div className="grid-auto">
            {products.map(p => {
              const disc = discountPct(p.price, p.mrp);
              return (
                <div key={p.id} className="product-card" onClick={() => navigate(`/product/${p.id}`)}>
                  <div className="product-img">
                    {CATEGORY_ICONS[p.category_slug] || '📦'}
                  </div>
                  <div className="product-info">
                    <div className="product-name">{p.name}</div>
                    <div className="product-shop">🏪 {p.shop_name}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap' }}>
                      <span className="product-price">₹{Number(p.price).toLocaleString('en-IN')}</span>
                      {p.mrp && p.mrp > p.price && <span className="product-mrp">₹{Number(p.mrp).toLocaleString('en-IN')}</span>}
                      {disc > 0 && <span className="product-discount">{disc}% off</span>}
                    </div>
                    {p.avg_rating > 0 && (
                      <div className="product-rating">{'★'.repeat(Math.round(p.avg_rating))}{'☆'.repeat(5 - Math.round(p.avg_rating))} ({p.review_count})</div>
                    )}
                    <button
                      className="btn btn-primary btn-sm btn-full"
                      style={{ marginTop: '0.7rem' }}
                      onClick={e => addToCart(e, p.id)}
                    >Add to Cart</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
            {page > 1 && <button className="btn btn-secondary" onClick={() => setPage(p => p - 1)}>← Previous</button>}
            <span style={{ padding: '0.6rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '0.9rem' }}>Page {page}</span>
            {products.length === 20 && <button className="btn btn-secondary" onClick={() => setPage(p => p + 1)}>Next →</button>}
          </div>
        )}

      </div>
    </div>
  );
}
