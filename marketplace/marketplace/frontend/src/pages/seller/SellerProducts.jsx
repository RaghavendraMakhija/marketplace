import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
export default function SellerProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const fetch = () => api.get('/products/seller/mine').then(r=>setProducts(r.data.products||[])).finally(()=>setLoading(false));
  useEffect(() => { fetch(); }, []);
  const del = async (id) => { if(!confirm('Remove this product?')) return; await api.delete(`/products/${id}`); fetch(); };
  if (loading) return <div className="loading-center"><div className="spinner"></div></div>;
  return (
    <div className="page-content"><div className="page-wrap">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
        <h2>📦 My Products ({products.length})</h2>
        <button className="btn btn-primary" onClick={()=>navigate('/seller/add-product')}>+ Add Product</button>
      </div>
      {products.length===0 ? <div className="empty-state"><div className="empty-icon">📦</div><h3>No products yet</h3><button className="btn btn-primary" onClick={()=>navigate('/seller/add-product')}>Add First Product</button></div> : (
        <div className="card"><div className="table-wrap"><table>
          <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {products.map(p=>(
              <tr key={p._id||p.id}>
                <td style={{fontWeight:500,maxWidth:'180px'}}><div style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div></td>
                <td><span className="badge badge-gray">{p.categoryName||'—'}</span></td>
                <td style={{fontFamily:'var(--font-mono)',fontWeight:600}}>₹{Number(p.price).toLocaleString('en-IN')}</td>
                <td><span className={`badge ${p.stock>5?'badge-green':p.stock>0?'badge-yellow':'badge-red'}`}>{p.stock}</span></td>
                <td><span className={`badge ${p.isApproved?'badge-green':'badge-yellow'}`}>{p.isApproved?'✓ Live':'⏳ Pending'}</span></td>
                <td><button className="btn btn-danger btn-sm" onClick={()=>del(p._id||p.id)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table></div></div>
      )}
    </div></div>
  );
}
