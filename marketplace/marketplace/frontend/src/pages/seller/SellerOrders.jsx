import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
const SB = {pending:'badge-yellow',confirmed:'badge-blue',packed:'badge-teal',shipped:'badge-purple',delivered:'badge-green',cancelled:'badge-red'};
export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  useEffect(() => { api.get('/orders/seller').then(r=>setOrders(r.data.orderItems||[])).finally(()=>setLoading(false)); }, []);
  const update = async (orderId, status) => {
    try { await api.patch(`/orders/${orderId}/status`,{status}); setOrders(p=>p.map(o=>o.orderId===orderId?{...o,orderStatus:status}:o)); }
    catch(err) { alert(err.response?.data?.message||'Failed.'); }
  };
  const filtered = filter==='all' ? orders : orders.filter(o=>o.orderStatus===filter);
  if (loading) return <div className="loading-center"><div className="spinner"></div></div>;
  return (
    <div className="page-content"><div className="page-wrap">
      <h2 style={{marginBottom:'1.5rem'}}>📋 Customer Orders</h2>
      <div style={{display:'flex',gap:'0.5rem',marginBottom:'1.5rem',flexWrap:'wrap'}}>
        {['all','pending','confirmed','packed','shipped','delivered','cancelled'].map(s=><button key={s} className={`btn btn-sm ${filter===s?'btn-primary':'btn-secondary'}`} onClick={()=>setFilter(s)} style={{textTransform:'capitalize'}}>{s}</button>)}
      </div>
      {filtered.length===0 ? <div className="empty-state"><div className="empty-icon">📋</div><h3>No orders here</h3></div> : (
        <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
          {filtered.map(o=>(
            <div key={o._id||o.id} className="card card-body">
              <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:'0.5rem',marginBottom:'0.8rem'}}>
                <div>
                  <div style={{fontWeight:600}}>{o.productName}</div>
                  <div style={{color:'var(--ink-3)',fontSize:'0.85rem'}}>Buyer: {o.consumerName} {o.consumerPhone&&`· ${o.consumerPhone}`}</div>
                  <div style={{color:'var(--ink-3)',fontSize:'0.82rem',marginTop:'0.2rem'}}>📍 {o.shippingAddress}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontFamily:'var(--font-mono)',fontWeight:700}}>₹{Number(o.price*o.quantity).toLocaleString('en-IN')}</div>
                  <div style={{fontSize:'0.82rem',color:'var(--ink-3)'}}>Qty: {o.quantity} · {o.paymentMethod?.toUpperCase()}</div>
                  <div style={{fontSize:'0.78rem',color:'var(--ink-4)',marginTop:'0.2rem'}}>{new Date(o.orderDate).toLocaleDateString('en-IN')}</div>
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'0.8rem',flexWrap:'wrap'}}>
                <span className={`badge ${SB[o.orderStatus]||'badge-gray'}`}>{o.orderStatus}</span>
                {o.orderStatus==='confirmed' && <button className="btn btn-secondary btn-sm" onClick={()=>update(o.orderId,'packed')}>Mark Packed</button>}
                {o.orderStatus==='packed' && <button className="btn btn-secondary btn-sm" onClick={()=>update(o.orderId,'shipped')}>Mark Shipped</button>}
                {o.orderStatus==='shipped' && <button className="btn btn-success btn-sm" onClick={()=>update(o.orderId,'delivered')}>Mark Delivered</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div></div>
  );
}
