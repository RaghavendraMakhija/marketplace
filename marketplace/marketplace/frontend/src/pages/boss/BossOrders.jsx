import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
const SB = { pending:'badge-yellow',confirmed:'badge-blue',packed:'badge-teal',shipped:'badge-purple',delivered:'badge-green',cancelled:'badge-red',refund_requested:'badge-yellow',refunded:'badge-gray' };
export default function BossOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  useEffect(() => { api.get('/orders/all').then(r=>setOrders(r.data.orders||[])).finally(()=>setLoading(false)); }, []);
  const update = async (id, status) => { await api.patch(`/orders/${id}/status`,{status}); setOrders(p=>p.map(o=>(o._id||o.id)===id?{...o,status}:o)); };
  const filtered = filter==='all' ? orders : orders.filter(o=>o.status===filter);
  if (loading) return <div className="loading-center"><div className="spinner"></div></div>;
  return (
    <div className="page-content"><div className="page-wrap">
      <h2 style={{marginBottom:'1.5rem'}}>📋 All Orders ({orders.length})</h2>
      <div style={{display:'flex',gap:'0.5rem',marginBottom:'1.5rem',flexWrap:'wrap'}}>
        {['all','pending','confirmed','shipped','delivered','cancelled','refund_requested'].map(s => <button key={s} className={`btn btn-sm ${filter===s?'btn-primary':'btn-secondary'}`} onClick={()=>setFilter(s)} style={{textTransform:'capitalize'}}>{s.replace('_',' ')}</button>)}
      </div>
      <div className="card"><div className="table-wrap"><table>
        <thead><tr><th>Order ID</th><th>Customer</th><th>Amount</th><th>Items</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
        <tbody>
          {filtered.map(o => (
            <tr key={o._id||o.id}>
              <td style={{fontFamily:'var(--font-mono)',fontSize:'0.8rem'}}>{(o._id||o.id)?.slice(0,8).toUpperCase()}</td>
              <td><div style={{fontWeight:500}}>{o.consumerName}</div><div style={{fontSize:'0.78rem',color:'var(--ink-3)'}}>{o.consumerEmail}</div></td>
              <td style={{fontFamily:'var(--font-mono)',fontWeight:600}}>₹{Number(o.totalAmount).toLocaleString('en-IN')}</td>
              <td>{o.itemCount}</td>
              <td><span className={`badge ${SB[o.status]||'badge-gray'}`}>{o.status}</span></td>
              <td style={{fontSize:'0.82rem',color:'var(--ink-3)'}}>{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
              <td><div style={{display:'flex',gap:'0.3rem',flexWrap:'wrap'}}>
                {o.status==='pending' && <button className="btn btn-success btn-sm" onClick={()=>update(o._id||o.id,'confirmed')}>Confirm</button>}
                {o.status==='refund_requested' && <button className="btn btn-secondary btn-sm" onClick={()=>update(o._id||o.id,'refunded')}>Refund</button>}
                {['pending','confirmed'].includes(o.status) && <button className="btn btn-danger btn-sm" onClick={()=>update(o._id||o.id,'cancelled')}>Cancel</button>}
              </div></td>
            </tr>
          ))}
        </tbody>
      </table></div></div>
    </div></div>
  );
}
