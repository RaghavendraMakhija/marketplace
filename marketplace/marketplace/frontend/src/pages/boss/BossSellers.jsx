import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
export default function BossSellers() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/boss/sellers/pending').then(r => setPending(r.data.sellers||[])).finally(() => setLoading(false)); }, []);
  const approve = async (id) => { await api.post(`/boss/sellers/${id}/approve`); setPending(p=>p.filter(s=>(s._id||s.id)!==id)); };
  const reject = async (id) => { if(!confirm('Reject this seller?')) return; await api.post(`/boss/sellers/${id}/reject`); setPending(p=>p.filter(s=>(s._id||s.id)!==id)); };
  if (loading) return <div className="loading-center"><div className="spinner"></div></div>;
  return (
    <div className="page-content"><div className="page-wrap">
      <h2 style={{marginBottom:'1.5rem'}}>🏪 Seller Approvals ({pending.length} pending)</h2>
      {pending.length === 0 ? <div className="empty-state"><div className="empty-icon">✅</div><h3>All caught up!</h3><p>No sellers pending.</p></div> : (
        <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
          {pending.map(s => (
            <div key={s._id||s.id} className="card card-body">
              <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:'1rem'}}>
                <div>
                  <h3 style={{marginBottom:'0.3rem'}}>🏪 {s.shopName}</h3>
                  <p style={{color:'var(--ink-2)',marginBottom:'0.2rem'}}>👤 {s.userName} · {s.userEmail}</p>
                  {s.userPhone && <p style={{color:'var(--ink-3)',fontSize:'0.85rem'}}>📞 {s.userPhone}</p>}
                  {s.shopDescription && <p style={{color:'var(--ink-3)',fontSize:'0.85rem',marginTop:'0.4rem'}}>{s.shopDescription}</p>}
                  <p style={{color:'var(--ink-4)',fontSize:'0.8rem',marginTop:'0.4rem'}}>Applied: {new Date(s.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                <div style={{display:'flex',gap:'0.6rem',alignItems:'flex-start'}}>
                  <button className="btn btn-success" onClick={() => approve(s._id||s.id)}>✅ Approve</button>
                  <button className="btn btn-danger" onClick={() => reject(s._id||s.id)}>✗ Reject</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div></div>
  );
}
