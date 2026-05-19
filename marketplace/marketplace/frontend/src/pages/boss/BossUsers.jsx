import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
export default function BossUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  useEffect(() => { api.get('/boss/users',{params:{role:filter!=='all'?filter:undefined,search:search||undefined}}).then(r=>setUsers(r.data.users||[])).finally(()=>setLoading(false)); }, [filter, search]);
  const toggle = async (id, cur) => { await api.patch(`/boss/users/${id}/toggle`); setUsers(p=>p.map(u=>(u._id||u.id)===id?{...u,isActive:!cur}:u)); };
  return (
    <div className="page-content"><div className="page-wrap">
      <h2 style={{marginBottom:'1.5rem'}}>👥 User Management</h2>
      <div style={{display:'flex',gap:'0.8rem',marginBottom:'1.5rem',flexWrap:'wrap'}}>
        {['all','consumer','seller'].map(f=><button key={f} className={`btn btn-sm ${filter===f?'btn-primary':'btn-secondary'}`} onClick={()=>setFilter(f)} style={{textTransform:'capitalize'}}>{f}</button>)}
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search name or email..." style={{flex:1,minWidth:'200px'}} />
      </div>
      {loading ? <div className="loading-center"><div className="spinner"></div></div> : (
        <div className="card"><div className="table-wrap"><table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Phone</th><th>Joined</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id||u.id}>
                <td style={{fontWeight:500}}>{u.name}</td>
                <td style={{fontSize:'0.85rem'}}>{u.email}</td>
                <td><span className={`role-pill ${u.role}`}>{u.role==='consumer'?'🛍️':'🏪'} {u.role}</span></td>
                <td style={{color:'var(--ink-3)',fontSize:'0.85rem'}}>{u.phone||'—'}</td>
                <td style={{color:'var(--ink-3)',fontSize:'0.82rem'}}>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                <td><span className={`badge ${u.isActive?'badge-green':'badge-red'}`}>{u.isActive?'Active':'Inactive'}</span></td>
                <td><button className={`btn btn-sm ${u.isActive?'btn-danger':'btn-success'}`} onClick={()=>toggle(u._id||u.id,u.isActive)}>{u.isActive?'Deactivate':'Activate'}</button></td>
              </tr>
            ))}
          </tbody>
        </table></div></div>
      )}
    </div></div>
  );
}
