import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
export default function BossProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/boss/products/pending').then(r => setProducts(r.data.products||[])).finally(() => setLoading(false)); }, []);
  const approve = async (id) => { await api.post(`/boss/products/${id}/approve`); setProducts(p=>p.filter(x=>(x._id||x.id)!==id)); };
  const reject = async (id) => { const r = prompt('Reason (optional):'); await api.post(`/boss/products/${id}/reject`,{reason:r}); setProducts(p=>p.filter(x=>(x._id||x.id)!==id)); };
  if (loading) return <div className="loading-center"><div className="spinner"></div></div>;
  return (
    <div className="page-content"><div className="page-wrap">
      <h2 style={{marginBottom:'1.5rem'}}>📦 Product Approvals ({products.length} pending)</h2>
      {products.length === 0 ? <div className="empty-state"><div className="empty-icon">✅</div><h3>No products to review</h3></div> : (
        <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
          {products.map(p => (
            <div key={p._id||p.id} className="card card-body">
              <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:'1rem'}}>
                <div style={{flex:1}}>
                  {p.categoryName && <span className="badge badge-blue" style={{marginBottom:'0.4rem',display:'inline-block'}}>{p.categoryName}</span>}
                  <h3 style={{marginBottom:'0.3rem'}}>{p.name}</h3>
                  <p style={{color:'var(--ink-3)',fontSize:'0.85rem',marginBottom:'0.3rem'}}>🏪 {p.shopName} · by {p.sellerName}</p>
                  {p.description && <p style={{color:'var(--ink-2)',fontSize:'0.88rem',marginBottom:'0.4rem'}}>{p.description.slice(0,150)}{p.description.length>150?'...':''}</p>}
                  <div style={{display:'flex',gap:'1rem',fontSize:'0.88rem',flexWrap:'wrap'}}>
                    <span>💰 ₹{Number(p.price).toLocaleString('en-IN')}{p.mrp?` (MRP ₹${Number(p.mrp).toLocaleString('en-IN')})`  :''}</span>
                    <span>📦 Stock: {p.stock} {p.unit}</span>
                  </div>
                </div>
                <div style={{display:'flex',gap:'0.6rem',alignItems:'flex-start'}}>
                  <button className="btn btn-success" onClick={()=>approve(p._id||p.id)}>✅ Approve</button>
                  <button className="btn btn-danger" onClick={()=>reject(p._id||p.id)}>✗ Reject</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div></div>
  );
}
