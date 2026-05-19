import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
const TYPE_ICON = { success:'✅', warning:'⚠️', action:'🔔', info:'ℹ️' };
export default function NotificationsPage() {
  const { notifications, fetchNotifications, unreadCount } = useAuth();
  useEffect(() => { fetchNotifications(); }, []);
  const markAll = async () => { await api.patch('/notifications/read-all'); fetchNotifications(); };
  return (
    <div className="page-content"><div className="page-wrap" style={{maxWidth:'640px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
        <h2>🔔 Notifications {unreadCount>0 && <span className="badge badge-red" style={{marginLeft:'0.5rem'}}>{unreadCount} new</span>}</h2>
        {unreadCount>0 && <button className="btn btn-ghost btn-sm" onClick={markAll}>Mark all read</button>}
      </div>
      {notifications.length===0 ? (
        <div className="empty-state"><div className="empty-icon">🔔</div><h3>No notifications</h3><p>You're all caught up!</p></div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:'0.6rem'}}>
          {notifications.map(n => (
            <div key={n._id||n.id} className="card card-body" style={{background:n.isRead?'var(--surface)':'var(--accent-light)',borderLeft:`3px solid ${n.isRead?'var(--border)':'var(--accent)'}`,padding:'0.9rem 1.1rem'}}>
              <div style={{display:'flex',gap:'0.8rem',alignItems:'flex-start'}}>
                <span style={{fontSize:'1.2rem'}}>{TYPE_ICON[n.type]||'ℹ️'}</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:n.isRead?400:600,marginBottom:'0.2rem'}}>{n.title}</div>
                  <div style={{fontSize:'0.88rem',color:'var(--ink-2)'}}>{n.message}</div>
                  <div style={{fontSize:'0.78rem',color:'var(--ink-4)',marginTop:'0.3rem'}}>{new Date(n.createdAt).toLocaleString('en-IN')}</div>
                </div>
                {!n.isRead && <span style={{width:'8px',height:'8px',borderRadius:'50%',background:'var(--accent)',flexShrink:0,marginTop:'4px'}}></span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div></div>
  );
}
