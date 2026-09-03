import React, { useState, useEffect } from 'react'
import { Shield, Search, Plus, Trash2, AlertTriangle, RefreshCw, X, User, FileText, FileDown } from 'lucide-react'

const API_URL = '/api'

function WatchlistManager() {
  const [entries, setEntries]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [showAdd, setShowAdd]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState(null)
  const [form, setForm]         = useState({
    name: '', dob: '', document_number: '', nationality: '', reason: '', threat_level: 'HIGH'
  })

  const fetchEntries = async () => {
    setLoading(true)
    try {
      const r = await fetch(`${API_URL}/watchlist?search=${encodeURIComponent(search)}`)
      if (r.ok) { const d = await r.json(); setEntries(d.entries || []) }
    } catch { setEntries([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchEntries() }, [])

  const handleSearch = (e) => { e.preventDefault(); fetchEntries() }

  const handleAdd = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const r = await fetch(`${API_URL}/watchlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (r.ok) {
        setMsg({ text: '✅ Entry added to watchlist.', ok: true })
        setShowAdd(false)
        setForm({ name:'', dob:'', document_number:'', nationality:'', reason:'', threat_level:'HIGH' })
        fetchEntries()
      } else { setMsg({ text: '❌ Failed to add entry.', ok: false }) }
    } catch { setMsg({ text: '❌ Network error.', ok: false }) }
    finally { setSaving(false); setTimeout(() => setMsg(null), 3500) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this entry from the watchlist?')) return
    try {
      const r = await fetch(`${API_URL}/watchlist/${id}`, { method: 'DELETE' })
      if (r.ok) { fetchEntries(); setMsg({ text: '🗑️ Entry removed.', ok: true }) }
    } catch {}
    setTimeout(() => setMsg(null), 3000)
  }

  const threatColor = (t) => t === 'CRITICAL' ? '#dc2626' : t === 'HIGH' ? '#ea580c' : t === 'MEDIUM' ? '#d97706' : '#64748b'
  const threatBg    = (t) => t === 'CRITICAL' ? '#fef2f2' : t === 'HIGH' ? '#fff7ed' : t === 'MEDIUM' ? '#fffbeb' : '#f8fafc'

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:'20px' }}>
        <h2 style={{ fontSize:'1.5rem', fontWeight:800, color:'var(--text-primary)', display:'flex', alignItems:'center', gap:'10px', marginBottom:'4px' }}>
          <Shield size={22} color="#dc2626"/> Watchlist &amp; Blacklist Management
        </h2>
        <p style={{ fontSize:'0.85rem', color:'var(--text-secondary)' }}>
          Flagged persons database. All screenings are automatically cross-checked against this list.
        </p>
      </div>

      {/* Toast */}
      {msg && (
        <div style={{
          marginBottom:'14px', padding:'10px 16px', borderRadius:'8px', fontWeight:700, fontSize:'0.85rem',
          background: msg.ok ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${msg.ok ? '#86efac' : '#fca5a5'}`,
          color: msg.ok ? '#14532d' : '#991b1b'
        }}>{msg.text}</div>
      )}

      {/* Toolbar */}
      <div style={{ display:'flex', gap:'10px', marginBottom:'18px', flexWrap:'wrap' }}>
        <form onSubmit={handleSearch} style={{ display:'flex', gap:'8px', flex:1, minWidth:'260px' }}>
          <div style={{ position:'relative', flex:1 }}>
            <input type="text" placeholder="Search by name, DOB, document number…" value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width:'100%', padding:'8px 10px 8px 34px', borderRadius:'8px', border:'1.5px solid var(--border-medium)', background:'var(--bg-surface)', color:'var(--text-primary)', fontSize:'0.85rem', outline:'none', boxSizing:'border-box' }}/>
            <Search size={14} color="#94a3b8" style={{ position:'absolute', left:'10px', top:'10px' }}/>
          </div>
          <button type="submit" className="btn-primary" style={{ padding:'8px 14px', fontSize:'0.83rem' }}>
            <Search size={13}/> Search
          </button>
        </form>
        <button onClick={() => fetchEntries()} className="btn-secondary" style={{ padding:'8px 12px', fontSize:'0.83rem' }}>
          <RefreshCw size={13}/> Refresh
        </button>
        <a href={`${API_URL}/export/watchlist`} download="watchlist_export.csv"
          className="btn-secondary"
          style={{ padding:'8px 12px', fontSize:'0.83rem', display:'inline-flex', alignItems:'center', gap:'6px', textDecoration:'none', color:'inherit' }}>
          <FileDown size={13}/> Export CSV
        </a>
        <button onClick={() => setShowAdd(true)} className="btn-primary"
          style={{ padding:'8px 14px', fontSize:'0.83rem', background:'#dc2626', borderColor:'#dc2626' }}>
          <Plus size={13}/> Add to Watchlist
        </button>
      </div>

      {/* Stats bar */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px,1fr))', gap:'12px', marginBottom:'18px' }}>
        {[
          { label:'Total Entries', val: entries.length, color:'#1e40af' },
          { label:'Critical',  val: entries.filter(e => e.threat_level==='CRITICAL').length, color:'#dc2626' },
          { label:'High',      val: entries.filter(e => e.threat_level==='HIGH').length,     color:'#ea580c' },
          { label:'Medium',    val: entries.filter(e => e.threat_level==='MEDIUM').length,   color:'#d97706' },
        ].map(s => (
          <div key={s.label} className="panel" style={{ padding:'14px 18px', textAlign:'center' }}>
            <div style={{ fontSize:'1.7rem', fontWeight:800, color:s.color, fontFamily:'var(--font-mono)' }}>{s.val}</div>
            <div style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.04em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="panel">
        <div className="panel-header">
          <h3 className="panel-title"><AlertTriangle size={16} color="#dc2626"/> Flagged Persons Registry</h3>
          <span style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{entries.length} records</span>
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:'40px', color:'var(--text-muted)' }}>
            <RefreshCw size={18} className="animate-spin" style={{ margin:'0 auto 8px' }}/><br/>Loading watchlist…
          </div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px', color:'var(--text-muted)', fontSize:'0.875rem' }}>
            <Shield size={32} style={{ margin:'0 auto 12px', opacity:0.3 }}/><br/>
            No watchlist entries found. Add flagged individuals above.
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th><th>Name</th><th>DOB</th><th>Document No.</th>
                  <th>Nationality</th><th>Threat Level</th><th>Reason</th>
                  <th>Added</th><th style={{ textAlign:'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id}>
                    <td className="font-mono" style={{ fontWeight:700, color:'#1e40af', fontSize:'0.78rem' }}>WL-{String(e.id).padStart(4,'0')}</td>
                    <td style={{ fontWeight:800, color:'var(--text-primary)', display:'flex', alignItems:'center', gap:'7px' }}>
                      <User size={13} color="#64748b"/>{e.name}
                    </td>
                    <td className="font-mono" style={{ fontSize:'0.82rem' }}>{e.dob||'—'}</td>
                    <td className="font-mono" style={{ fontWeight:700, fontSize:'0.82rem' }}>{e.document_number||'—'}</td>
                    <td style={{ fontSize:'0.83rem' }}>{e.nationality||'—'}</td>
                    <td>
                      <span style={{
                        display:'inline-block', padding:'2px 9px', borderRadius:'20px', fontSize:'0.72rem', fontWeight:800,
                        background: threatBg(e.threat_level), color: threatColor(e.threat_level),
                        border: `1px solid ${threatColor(e.threat_level)}40`
                      }}>{e.threat_level}</span>
                    </td>
                    <td style={{ fontSize:'0.8rem', maxWidth:'200px', color:'var(--text-secondary)' }}>{e.reason||'—'}</td>
                    <td className="font-mono" style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>
                      {e.created_at ? new Date(e.created_at).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td style={{ textAlign:'center' }}>
                      <button onClick={() => handleDelete(e.id)} className="btn-secondary"
                        style={{ padding:'3px 8px', fontSize:'0.72rem', color:'#dc2626', borderColor:'#fca5a5', background:'#fef2f2', display:'inline-flex', alignItems:'center', gap:'3px' }}>
                        <Trash2 size={11}/> Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="modal-backdrop" onClick={() => setShowAdd(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth:'520px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 22px', borderBottom:'1px solid var(--border-subtle)', background:'#fef2f2' }}>
              <h3 style={{ fontSize:'1rem', fontWeight:800, color:'#991b1b', margin:0, display:'flex', alignItems:'center', gap:'8px' }}>
                <AlertTriangle size={16}/> Add to Watchlist
              </h3>
              <button onClick={() => setShowAdd(false)} className="btn-ghost" style={{ padding:'4px' }}><X size={16}/></button>
            </div>
            <form onSubmit={handleAdd} style={{ padding:'22px', display:'flex', flexDirection:'column', gap:'14px' }}>
              {[
                { key:'name',            label:'Full Name *',        type:'text',   required:true,  placeholder:'As on document' },
                { key:'dob',             label:'Date of Birth',      type:'date',   required:false, placeholder:'' },
                { key:'document_number', label:'Document Number',    type:'text',   required:false, placeholder:'Passport / NID / Citizenship No.' },
                { key:'nationality',     label:'Nationality',        type:'text',   required:false, placeholder:'e.g. Nepalese, Indian, Bangladeshi' },
                { key:'reason',          label:'Reason for Flagging',type:'text',   required:false, placeholder:'e.g. Suspected human trafficking' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.04em' }}>{f.label}</label>
                  <input type={f.type} required={f.required} placeholder={f.placeholder}
                    value={form[f.key]} onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))}
                    style={{ width:'100%', padding:'8px 11px', borderRadius:'7px', border:'1.5px solid var(--border-medium)', background:'var(--bg-surface)', color:'var(--text-primary)', fontSize:'0.85rem', outline:'none', boxSizing:'border-box' }}/>
                </div>
              ))}
              <div>
                <label style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.04em' }}>Threat Level *</label>
                <select value={form.threat_level} onChange={e => setForm(p => ({...p, threat_level: e.target.value}))}
                  style={{ width:'100%', padding:'8px 11px', borderRadius:'7px', border:'1.5px solid var(--border-medium)', background:'var(--bg-surface)', color:'var(--text-primary)', fontSize:'0.85rem', outline:'none' }}>
                  {['CRITICAL','HIGH','MEDIUM','LOW'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end', marginTop:'4px' }}>
                <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary"
                  style={{ background:'#dc2626', borderColor:'#dc2626' }}>
                  {saving ? 'Saving…' : '+ Add to Watchlist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default WatchlistManager
