import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
export default function AddProduct() {
  const [form, setForm] = useState({name:'',description:'',price:'',mrp:'',stock:'',unit:'piece',categoryId:'',tags:''});
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();
  useEffect(() => { api.get('/categories').then(r=>setCategories(r.data.categories||[])).catch(()=>{}); }, []);
  const set = (k,v) => setForm(p=>({...p,[k]:v}));
  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setMsg('');
    try {
      const payload = {...form, price:parseFloat(form.price), stock:parseInt(form.stock), mrp:form.mrp?parseFloat(form.mrp):undefined, tags:form.tags?form.tags.split(',').map(t=>t.trim()):[]};
      const {data} = await api.post('/products',payload);
      if(data.success) { setMsg('success'); setTimeout(()=>navigate('/seller/products'),1500); }
    } catch(err) { setMsg(err.response?.data?.message||'Failed to add product.'); }
    finally { setLoading(false); }
  };
  return (
    <div className="page-content"><div className="page-wrap" style={{maxWidth:'640px'}}>
      <button className="btn btn-ghost btn-sm" onClick={()=>navigate(-1)} style={{marginBottom:'1rem'}}>← Back</button>
      <h2 style={{marginBottom:'1.5rem'}}>➕ Add New Product</h2>
      {msg==='success' ? <div className="alert alert-success">✅ Product submitted for approval! Redirecting...</div> : (
        <div className="card card-body">
          {msg && <div className="alert alert-error">{msg}</div>}
          <form onSubmit={submit}>
            <div className="form-group"><label>Product Name *</label><input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Samsung Galaxy Buds" required /></div>
            <div className="form-group"><label>Description</label><textarea value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Describe your product..." rows={4} /></div>
            <div className="form-row">
              <div className="form-group"><label>Selling Price (₹) *</label><input value={form.price} onChange={e=>set('price',e.target.value)} type="number" min="0" step="0.01" placeholder="499" required /></div>
              <div className="form-group"><label>MRP / Original Price (₹)</label><input value={form.mrp} onChange={e=>set('mrp',e.target.value)} type="number" min="0" step="0.01" placeholder="999" /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Stock Quantity *</label><input value={form.stock} onChange={e=>set('stock',e.target.value)} type="number" min="0" placeholder="50" required /></div>
              <div className="form-group"><label>Unit</label><select value={form.unit} onChange={e=>set('unit',e.target.value)}>{['piece','kg','gram','litre','ml','pair','set','pack','dozen','box'].map(u=><option key={u} value={u}>{u}</option>)}</select></div>
            </div>
            <div className="form-group"><label>Category</label><select value={form.categoryId} onChange={e=>set('categoryId',e.target.value)}><option value="">Select category</option>{categories.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
            <div className="form-group"><label>Tags (comma separated)</label><input value={form.tags} onChange={e=>set('tags',e.target.value)} placeholder="wireless, bluetooth, audio" /></div>
            {form.mrp && form.price && parseFloat(form.mrp)>parseFloat(form.price) && <div className="alert alert-success" style={{marginBottom:'1rem'}}>🏷️ Discount: {Math.round((1-form.price/form.mrp)*100)}% off</div>}
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>{loading?'⏳ Submitting...':'📤 Submit for Approval'}</button>
          </form>
        </div>
      )}
    </div></div>
  );
}
