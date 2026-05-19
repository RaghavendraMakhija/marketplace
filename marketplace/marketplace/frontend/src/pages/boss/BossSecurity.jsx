import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
export default function BossSecurity() {
  const [ips, setIps] = useState([]);
  const [form, setForm] = useState({ ip:'', reason:'', hours:'' });
  const [msg, setMsg] = useState('');
  useEffect(() => { api.get('/boss/blocked-ips').then(r=>setIps(r.data.ips||[])).catch(()=>{}); }, []);
  const blockIp = async (e) => {
    e.preventDefault();
    try { await api.post('/boss/block-ip',form); setMsg('✅ IP blocked.'); setForm({ip:'',reason:'',hours:''}); api.get('/boss/blocked-ips').then(r=>setIps(r.data.ips||[])); }
    catch(err) { setMsg('❌ '+(err.response?.data?.message||'Failed.')); }
  };
  const unblock = async (ip) => { await api.delete(`/boss/block-ip/${encodeURIComponent(ip)}`); setIps(p=>p.filter(b=>b.ip!==ip)); };
  return (
    <div className="page-content"><div className="page-wrap">
      <h2 style={{marginBottom:'1.5rem'}}>🔒 Security Controls</h2>
      <div className="grid-2" style={{alignItems:'start'}}>
        <div className="card card-body">
          <h3 style={{marginBottom:'1rem'}}>Block an IP Address</h3>
          {msg && <div className={`alert ${msg.startsWith('✅')?'alert-success':'alert-error'}`}>{msg}</div>}
          <form onSubmit={blockIp}>
            <div className="form-group"><label>IP Address *</label><input value={form.ip} onChange={e=>setForm(p=>({...p,ip:e.target.value}))} placeholder="192.168.1.1" required /></div>
            <div className="form-group"><label>Reason</label><input value={form.reason} onChange={e=>setForm(p=>({...p,reason:e.target.value}))} placeholder="Spam / DDoS attempt" /></div>
            <div className="form-group"><label>Duration in hours (blank = permanent)</label><input value={form.hours} onChange={e=>setForm(p=>({...p,hours:e.target.value}))} type="number" min="1" placeholder="24" /></div>
            <button type="submit" className="btn btn-danger btn-full">🚫 Block IP</button>
          </form>
        </div>
        <div className="card">
          <div className="card-header"><h3>Blocked IPs ({ips.length})</h3></div>
          {ips.length===0 ? <div style={{padding:'2rem',textAlign:'center',color:'var(--ink-3)'}}>No blocked IPs</div> : (
            <div className="table-wrap"><table>
              <thead><tr><th>IP</th><th>Reason</th><th>Expires</th><th></th></tr></thead>
              <tbody>{ips.map(b=>(
                <tr key={b.ip}>
                  <td style={{fontFamily:'var(--font-mono)',fontWeight:500}}>{b.ip}</td>
                  <td style={{fontSize:'0.85rem'}}>{b.reason||'—'}</td>
                  <td style={{fontSize:'0.82rem',color:'var(--ink-3)'}}>{b.expiresAt?new Date(b.expiresAt).toLocaleDateString('en-IN'):'Permanent'}</td>
                  <td><button className="btn btn-secondary btn-sm" onClick={()=>unblock(b.ip)}>Unblock</button></td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </div>
      </div>
    </div></div>
  );
}
