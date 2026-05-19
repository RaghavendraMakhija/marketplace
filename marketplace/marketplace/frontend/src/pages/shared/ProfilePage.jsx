import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
const ROLE_ICONS = { boss:'👑', seller:'🏪', consumer:'🛍️' };
export default function ProfilePage() {
  const { user, login } = useAuth();
  const [form, setForm] = useState({ name: user?.name||'', phone: user?.phone||'', address: user?.address||'', shopName: user?.sellerProfile?.shopName||'', shopDescription: user?.sellerProfile?.shopDescription||'' });
  const [pwForm, setPwForm] = useState({ currentPassword:'', newPassword:'' });
  const [msg, setMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k,v) => setForm(p=>({...p,[k]:v}));
  const save = async (e) => {
    e.preventDefault(); setLoading(true); setMsg('');
    try { await api.put('/auth/me', form); setMsg('✅ Profile updated!'); const r = await api.get('/auth/me'); login(r.data.user, localStorage.getItem('token')); }
    catch(err) { setMsg('❌ '+(err.response?.data?.message||'Update failed.')); }
    finally { setLoading(false); }
  };
  const changePw = async (e) => {
    e.preventDefault(); setPwMsg('');
    try { await api.put('/auth/change-password', pwForm); setPwMsg('✅ Password changed!'); setPwForm({currentPassword:'',newPassword:''}); }
    catch(err) { setPwMsg('❌ '+(err.response?.data?.message||'Failed.')); }
  };
  return (
    <div className="page-content"><div className="page-wrap" style={{maxWidth:'640px'}}>
      <h2 style={{marginBottom:'1.5rem'}}>👤 My Profile</h2>
      <div className="card card-body" style={{marginBottom:'1.5rem',display:'flex',alignItems:'center',gap:'1rem'}}>
        <div style={{width:'60px',height:'60px',borderRadius:'50%',background:'var(--surface-2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.8rem',flexShrink:0}}>{ROLE_ICONS[user?.role]}</div>
        <div>
          <div style={{fontWeight:700,fontSize:'1.1rem'}}>{user?.name}</div>
          <div style={{color:'var(--ink-3)',fontSize:'0.88rem'}}>{user?.email}</div>
          <span className={`role-pill ${user?.role}`} style={{marginTop:'0.4rem',display:'inline-flex'}}>{ROLE_ICONS[user?.role]} {user?.role}</span>
        </div>
      </div>
      <div className="card card-body" style={{marginBottom:'1.5rem'}}>
        <h3 style={{marginBottom:'1rem'}}>Edit Profile</h3>
        {msg && <div className={`alert ${msg.startsWith('✅')?'alert-success':'alert-error'}`}>{msg}</div>}
        <form onSubmit={save}>
          <div className="form-group"><label>Full Name</label><input value={form.name} onChange={e=>set('name',e.target.value)} /></div>
          <div className="form-group"><label>Phone</label><input value={form.phone} onChange={e=>set('phone',e.target.value)} type="tel" /></div>
          <div className="form-group"><label>Address</label><textarea value={form.address} onChange={e=>set('address',e.target.value)} rows={3} /></div>
          {user?.role==='seller' && <>
            <div className="form-group"><label>Shop Name</label><input value={form.shopName} onChange={e=>set('shopName',e.target.value)} /></div>
            <div className="form-group"><label>Shop Description</label><textarea value={form.shopDescription} onChange={e=>set('shopDescription',e.target.value)} rows={3} /></div>
          </>}
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Saving...':'Save Changes'}</button>
        </form>
      </div>
      <div className="card card-body">
        <h3 style={{marginBottom:'1rem'}}>🔑 Change Password</h3>
        {pwMsg && <div className={`alert ${pwMsg.startsWith('✅')?'alert-success':'alert-error'}`}>{pwMsg}</div>}
        <form onSubmit={changePw}>
          <div className="form-group"><label>Current Password</label><input value={pwForm.currentPassword} onChange={e=>setPwForm(p=>({...p,currentPassword:e.target.value}))} type="password" required /></div>
          <div className="form-group"><label>New Password</label><input value={pwForm.newPassword} onChange={e=>setPwForm(p=>({...p,newPassword:e.target.value}))} type="password" placeholder="Min 6 chars, 1 uppercase, 1 number" required /></div>
          <button type="submit" className="btn btn-secondary">Update Password</button>
        </form>
      </div>
    </div></div>
  );
}
