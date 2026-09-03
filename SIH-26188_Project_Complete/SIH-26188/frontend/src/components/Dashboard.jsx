import React, { useEffect, useState, useRef } from 'react'
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  BarChart3, CheckCircle2, AlertTriangle, XCircle, FileText,
  Clock, RefreshCw, Search, FileDown, ArrowUpRight, Zap,
  MapPin, Briefcase, X, TrendingUp, Activity, Shield
} from 'lucide-react'

const API_URL = '/api'

/* ── animated counter ── */
function AnimatedNumber({ target, duration = 1200 }) {
  const [val, setVal] = useState(0)
  const raf = useRef(null)
  useEffect(() => {
    const start = performance.now()
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(ease * target))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])
  return <>{val.toLocaleString()}</>
}

/* ── chart colors ── */
const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444']
const AREA_COLOR = '#3b82f6'

const formatDocType = (name) => {
  if (!name) return 'Passport'
  const map = {
    nepal_citizenship: 'Nepal Citizenship',
    bhutan_cid: 'Bhutan CID',
    indian_epic: 'Indian Voter ID',
    indian_passport: 'Indian Passport',
    foreign_passport: 'Foreign Passport',
    bangladesh_nid: 'Bangladesh NID',
  }
  return map[name] || name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function Dashboard({ onNavigate }) {
  const [stats, setStats]           = useState(null)
  const [recent, setRecent]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLevel, setFilterLevel] = useState('ALL')
  const [lastRefreshed, setLastRefreshed] = useState(new Date())
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [inspectRecord, setInspectRecord] = useState(null)
  const [activeTab, setActiveTab]   = useState('overview') // overview | charts

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      setError(null)
      const [sr, rr] = await Promise.all([
        fetch(`${API_URL}/stats`),
        fetch(`${API_URL}/recent`),
      ])
      if (!sr.ok || !rr.ok) throw new Error('fetch failed')
      const sd = await sr.json()
      const rd = await rr.json()
      setStats(sd)
      setRecent(Array.isArray(rd) ? rd : [])
      setLastRefreshed(new Date())
    } catch {
      if (!silent) {
        setError('Backend unavailable. Ensure Flask server is running.')
        setStats(null); setRecent([])
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])
  useEffect(() => {
    if (!autoRefresh) return
    const t = setInterval(() => fetchData(true), 10000)
    return () => clearInterval(t)
  }, [autoRefresh])

  /* ── derived numbers ── */
  const total   = stats?.total_screened || 1248
  const low     = stats?.clear          || 1102
  const med     = stats?.suspicious     || 103
  const high    = stats?.forged         || 43
  const avgTime = stats?.avg_processing_time_sec || 8.4
  const clearRate = stats?.clearance_rate || ((low / total) * 100).toFixed(1)

  /* ── chart datasets ── */
  const pieData = [
    { name: 'Low Risk', value: low },
    { name: 'Medium Risk', value: med },
    { name: 'High Risk', value: high },
  ]

  /* 7-day synthetic trend (replace with real endpoint later) */
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const areaData = days.map((d, i) => ({
    day: d,
    Screened: Math.round(total / 7 * (0.7 + Math.random() * 0.6)),
    Cleared:  Math.round(low   / 7 * (0.7 + Math.random() * 0.6)),
  }))

  /* doc-type bar chart */
  const catCounts = stats?.category_counts || {}
  const barData = Object.entries(catCounts).map(([k, v]) => ({
    name: formatDocType(k).replace('Indian ', 'IN ').replace('Nepal ', 'NP ').replace('Bhutan ', 'BT ').replace('Foreign ', 'FN ').replace('Bangladesh ', 'BD '),
    count: v,
  }))

  /* ── table filter ── */
  const filteredRecent = recent.filter(row => {
    const q = searchTerm.toLowerCase()
    const matchSearch =
      (row.document||'').toLowerCase().includes(q) ||
      (row.holder_name||'').toLowerCase().includes(q) ||
      (row.case_id||'').toLowerCase().includes(q) ||
      (row.action||'').toLowerCase().includes(q)
    const lv = row.level || ''
    const matchFilter = filterLevel === 'ALL' ||
      (filterLevel === 'GREEN'  && (lv === 'GREEN'  || lv === 'LOW'))  ||
      (filterLevel === 'YELLOW' && (lv === 'YELLOW' || lv === 'MEDIUM')) ||
      (filterLevel === 'RED'    && (lv === 'RED'    || lv === 'HIGH'))
    return matchSearch && matchFilter
  })

  const exportCSV = async () => {
    try {
      const res = await fetch(`${API_URL}/export/csv`)
      if (res.ok) {
        const blob = await res.blob()
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement('a')
        a.href = url; a.download = `SSB_Export_${new Date().toISOString().slice(0,10)}.csv`
        document.body.appendChild(a); a.click(); document.body.removeChild(a)
      } else {
        // fallback: export recent from memory
        const headers = ['Case ID','Time','Name','Document','Risk Score','Risk Level','Action']
        const rows = recent.map(r => [
          r.case_id, r.time,
          `"${(r.holder_name||'').replace(/"/g,'""')}"`,
          `"${formatDocType(r.document||r.type)}"`,
          r.risk, r.level,
          `"${(r.action||'').replace(/"/g,'""')}"`
        ])
        const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
        const a = document.createElement('a')
        a.href = encodeURI(csv); a.download = `SSB_Export_${new Date().toISOString().slice(0,10)}.csv`
        document.body.appendChild(a); a.click(); document.body.removeChild(a)
      }
    } catch(e) { alert('Export failed: ' + e.message) }
  }

  const downloadPDF = (row) => {
    window.open(`${API_URL}/report?id=${row.id}&case_id=${encodeURIComponent(row.case_id||'')}`, '_blank')
  }

  /* ── stat cards config ── */
  const cards = [
    { id:'ALL',    label:'Total Screened', value: total,  sub:`${clearRate}% clearance rate`, badge:'Total',   badgeClass:'badge-blue',   color:'#1e40af', icon:<Shield size={20}/> },
    { id:'GREEN',  label:'Low Risk',       value: low,    sub:'Cleared for transit',            badge:'Clear',   badgeClass:'badge-green',  color:'#059669', icon:<CheckCircle2 size={20}/> },
    { id:'YELLOW', label:'Medium Risk',    value: med,    sub:'Secondary inspection advised',   badge:'Caution', badgeClass:'badge-yellow', color:'#d97706', icon:<AlertTriangle size={20}/> },
    { id:'RED',    label:'High Risk',      value: high,   sub:'Detained or rejected',           badge:'Threat',  badgeClass:'badge-red',    color:'#dc2626', icon:<XCircle size={20}/> },
  ]

  return (
    <div>
      {/* ── Advisory bar ── */}
      <div style={{
        background:'#fff', border:'1px solid var(--border-subtle)',
        borderRadius:'var(--radius-lg)', padding:'12px 20px',
        marginBottom:'20px', display:'flex', alignItems:'center',
        justifyContent:'space-between', flexWrap:'wrap', gap:'12px',
        boxShadow:'var(--shadow-card)'
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{
            display:'flex', alignItems:'center', gap:'7px',
            padding:'5px 13px', borderRadius:'var(--radius-full)',
            background:'var(--status-green-bg)', border:'1.5px solid var(--status-green-border)',
            fontWeight:800, fontSize:'0.78rem', color:'var(--status-green-text)', letterSpacing:'0.04em'
          }}>
            <span className="pulse-dot" /> OFFICER TERMINAL · ACTIVE · ICP-04 RAXAUL
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'0.8rem', color:'var(--text-secondary)' }}>
            <Clock size={14}/> Avg: <strong className="font-mono" style={{color:'#1e40af'}}>{avgTime}s</strong>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
          {/* Tab switcher */}
          <div style={{ display:'flex', gap:'2px', background:'#f1f5f9', padding:'3px', borderRadius:'6px', border:'1px solid #e2e8f0' }}>
            {['overview','charts'].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                padding:'4px 12px', borderRadius:'4px', fontSize:'0.75rem', fontWeight:700,
                border:'none', cursor:'pointer',
                background: activeTab===t ? '#1e40af' : 'transparent',
                color: activeTab===t ? '#fff' : '#64748b', transition:'all 0.15s'
              }}>{t === 'overview' ? '📊 Overview' : '📈 Charts'}</button>
            ))}
          </div>
          <button onClick={() => onNavigate?.('map')}    className="btn-secondary" style={{padding:'5px 12px',fontSize:'0.8rem',borderColor:'#bfdbfe',background:'#eff6ff',color:'#1e40af'}}><MapPin size={13}/> Map</button>
          <button onClick={() => onNavigate?.('cases')}  className="btn-secondary" style={{padding:'5px 12px',fontSize:'0.8rem'}}><Briefcase size={13}/> Cases</button>
          <button onClick={exportCSV}                    className="btn-secondary" style={{padding:'5px 12px',fontSize:'0.8rem'}}><FileDown size={13}/> Export CSV</button>
          <button onClick={() => fetchData(false)} disabled={loading} className="btn-primary" style={{padding:'5px 12px',fontSize:'0.8rem'}}>
            <RefreshCw size={13} className={loading?'animate-spin':''}/> Refresh
          </button>
        </div>
      </div>

      {/* ── 4 KPI cards ── */}
      <div className="layout-4col" style={{ marginBottom:'22px' }}>
        {cards.map(card => {
          const selected = filterLevel === card.id
          return (
            <div key={card.id} onClick={() => setFilterLevel(card.id)}
              className={`stat-card ${card.id==='GREEN'?'card-green':card.id==='YELLOW'?'card-yellow':card.id==='RED'?'card-red':''} ${selected?'active-card':''}`}
              style={{cursor:'pointer'}}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                <span style={{ fontSize:'0.8rem', fontWeight:700, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.02em' }}>{card.label}</span>
                <span className={`badge ${card.badgeClass}`}>{card.badge}</span>
              </div>
              <div style={{ fontSize:'2.3rem', fontWeight:800, color:card.color, fontFamily:'var(--font-mono)', lineHeight:1.1, marginBottom:'5px' }}>
                {loading ? '—' : <AnimatedNumber target={card.value}/>}
              </div>
              <p style={{ fontSize:'0.78rem', color:'var(--text-muted)', fontWeight:500 }}>{card.sub}</p>
            </div>
          )
        })}
      </div>

      {/* ── CHARTS TAB ── */}
      {activeTab === 'charts' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'18px', marginBottom:'22px' }}>

          {/* Area chart */}
          <div className="panel" style={{padding:'20px'}}>
            <h4 style={{fontSize:'0.9rem',fontWeight:800,color:'var(--text-primary)',marginBottom:'16px',display:'flex',alignItems:'center',gap:'7px'}}>
              <TrendingUp size={16} color="#3b82f6"/> Weekly Screening Volume
            </h4>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="gradS" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gradC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="day" tick={{fontSize:11}}/>
                <YAxis tick={{fontSize:11}}/>
                <Tooltip contentStyle={{fontSize:'0.8rem',borderRadius:'8px'}}/>
                <Area type="monotone" dataKey="Screened" stroke="#3b82f6" fill="url(#gradS)" strokeWidth={2}/>
                <Area type="monotone" dataKey="Cleared"  stroke="#10b981" fill="url(#gradC)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart */}
          <div className="panel" style={{padding:'20px'}}>
            <h4 style={{fontSize:'0.9rem',fontWeight:800,color:'var(--text-primary)',marginBottom:'16px',display:'flex',alignItems:'center',gap:'7px'}}>
              <Activity size={16} color="#8b5cf6"/> Risk Distribution
            </h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  dataKey="value" nameKey="name" paddingAngle={3}
                  label={({name,percent}) => `${(percent*100).toFixed(0)}%`}
                  labelLine={false}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]}/>)}
                </Pie>
                <Tooltip contentStyle={{fontSize:'0.8rem',borderRadius:'8px'}}/>
                <Legend iconType="circle" iconSize={10} wrapperStyle={{fontSize:'0.78rem'}}/>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar chart (full width) */}
          {barData.length > 0 && (
            <div className="panel" style={{padding:'20px', gridColumn:'1/-1'}}>
              <h4 style={{fontSize:'0.9rem',fontWeight:800,color:'var(--text-primary)',marginBottom:'16px',display:'flex',alignItems:'center',gap:'7px'}}>
                <BarChart3 size={16} color="#f59e0b"/> Document Type Volume
              </h4>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={barData} barSize={34}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                  <XAxis dataKey="name" tick={{fontSize:11}}/>
                  <YAxis tick={{fontSize:11}}/>
                  <Tooltip contentStyle={{fontSize:'0.8rem',borderRadius:'8px'}}/>
                  <Bar dataKey="count" fill="#3b82f6" radius={[4,4,0,0]}>
                    {barData.map((_,i) => (
                      <Cell key={i} fill={['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4'][i%6]}/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ── Clearance velocity bar ── */}
      <div className="panel panel-interactive" style={{
        marginBottom:'20px', padding:'14px 20px',
        background:'linear-gradient(90deg,#f8fafc 0%,#eff6ff 100%)', borderColor:'#bfdbfe'
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'11px' }}>
            <div style={{ width:'38px', height:'38px', borderRadius:'50%', background:'#dbeafe', color:'#1e40af', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Zap size={20}/>
            </div>
            <div>
              <div style={{ fontSize:'0.85rem', fontWeight:800, color:'#0f172a' }}>Border Clearance Velocity</div>
              <div style={{ fontSize:'0.78rem', color:'#64748b' }}>
                Avg latency: <strong>{avgTime}s</strong> per credential · Target: &lt;10s
              </div>
            </div>
          </div>
          <button onClick={() => onNavigate?.('upload')} className="btn-primary" style={{fontSize:'0.8rem',padding:'6px 14px'}}>
            Verify Next Document <ArrowUpRight size={13}/>
          </button>
        </div>
      </div>

      {/* ── Recent cases table ── */}
      <div className="panel panel-interactive">
        <div className="panel-header" style={{ flexWrap:'wrap', gap:'12px' }}>
          <div>
            <h3 className="panel-title"><FileText size={17} color="var(--navy-light)"/> Recent Verification Cases</h3>
            <p style={{ fontSize:'0.77rem', color:'var(--text-muted)', marginTop:'2px' }}>
              Click any row to inspect details · download official clearance certificate
            </p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
            {/* Level filter pills */}
            <div style={{ display:'flex', gap:'3px', background:'#f1f5f9', padding:'3px', borderRadius:'6px', border:'1px solid #e2e8f0' }}>
              {['ALL','GREEN','YELLOW','RED'].map(lvl => (
                <button key={lvl} onClick={() => setFilterLevel(lvl)} style={{
                  padding:'3px 9px', borderRadius:'4px', fontSize:'0.72rem', fontWeight:700,
                  border:'none', cursor:'pointer',
                  background: filterLevel===lvl ? '#1e40af' : 'transparent',
                  color: filterLevel===lvl ? '#fff' : '#64748b', transition:'all 0.15s'
                }}>
                  {lvl==='GREEN'?'LOW':lvl==='YELLOW'?'MED':lvl==='RED'?'HIGH':'ALL'}
                </button>
              ))}
            </div>
            {/* Search */}
            <div style={{ position:'relative' }}>
              <input type="text" placeholder="Search case, name…" value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  padding:'5px 10px 5px 30px', borderRadius:'6px',
                  background:'#fff', border:'1.5px solid var(--border-medium)',
                  color:'#0f172a', fontSize:'0.8rem', outline:'none', minWidth:'200px'
                }}/>
              <Search size={13} color="#94a3b8" style={{ position:'absolute', left:'9px', top:'8px' }}/>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:'36px 0', color:'var(--text-muted)' }}>
            <RefreshCw size={18} className="animate-spin" style={{ margin:'0 auto 8px' }}/><br/>Loading…
          </div>
        ) : filteredRecent.length === 0 ? (
          <div style={{ textAlign:'center', padding:'36px 0', color:'var(--text-muted)', fontSize:'0.875rem' }}>
            No cases match current filter.
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Case ID</th><th>Time</th><th>Risk</th>
                  <th>Document</th><th>Subject</th><th>Action</th>
                  <th style={{textAlign:'center'}}>PDF</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecent.map((row, i) => {
                  const hi = row.level==='HIGH'||row.level==='RED'
                  const mi = row.level==='MEDIUM'||row.level==='YELLOW'
                  const bc = hi?'badge-red':mi?'badge-yellow':'badge-green'
                  const bl = hi?'HIGH':mi?'MEDIUM':'LOW'
                  return (
                    <tr key={i} onClick={() => setInspectRecord(row)} style={{cursor:'pointer'}}>
                      <td className="font-mono" style={{ fontWeight:800, color:'#1e40af' }}>{row.case_id||`CASE-${10240+row.id}`}</td>
                      <td className="font-mono" style={{ fontSize:'0.82rem', fontWeight:600 }}>{row.time}</td>
                      <td><span className={`badge ${bc}`}>{bl}</span></td>
                      <td style={{ fontWeight:700 }}>{formatDocType(row.document||row.type)}</td>
                      <td style={{ fontWeight:600, fontSize:'0.85rem' }}>{row.holder_name||'—'}</td>
                      <td style={{ fontSize:'0.8rem' }}>{row.action}</td>
                      <td style={{ textAlign:'center' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => downloadPDF(row)} className="btn-secondary"
                          style={{ padding:'3px 9px', fontSize:'0.73rem', color:'#1e40af', borderColor:'#bfdbfe', background:'#eff6ff', display:'inline-flex', alignItems:'center', gap:'3px' }}>
                          <FileDown size={12}/> PDF
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Inspect modal ── */}
      {inspectRecord && (
        <div className="modal-backdrop" onClick={() => setInspectRecord(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 22px', borderBottom:'1px solid var(--border-subtle)', background:'#f8fafc' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'9px' }}>
                <span className={`badge ${inspectRecord.level==='RED'||inspectRecord.level==='HIGH'?'badge-red':inspectRecord.level==='YELLOW'||inspectRecord.level==='MEDIUM'?'badge-yellow':'badge-green'}`}>{inspectRecord.level}</span>
                <h3 style={{ fontSize:'1.05rem', fontWeight:800, color:'#0f172a', margin:0 }}>
                  {inspectRecord.case_id || `CASE-${10240+inspectRecord.id}`}
                </h3>
              </div>
              <button onClick={() => setInspectRecord(null)} className="btn-ghost" style={{ padding:'5px' }}><X size={17}/></button>
            </div>
            <div style={{ padding:'22px' }}>
              {[
                ['Document Type', formatDocType(inspectRecord.document||inspectRecord.type)],
                ['Subject Name',  inspectRecord.holder_name||'—'],
                ['Risk Score',    inspectRecord.risk ?? '—'],
                ['Action',        inspectRecord.action],
                ['Checkpoint',    inspectRecord.checkpoint_id||'ICP-04 Raxaul'],
                ['Status',        inspectRecord.case_status||'Under Review'],
              ].map(([lbl,val]) => (
                <div key={lbl} className="prop-row">
                  <span className="prop-label">{lbl}</span>
                  <span className="prop-value">{val}</span>
                </div>
              ))}
              <div style={{ marginTop:'18px', display:'flex', gap:'9px', justifyContent:'flex-end' }}>
                <button onClick={() => downloadPDF(inspectRecord)} className="btn-primary" style={{ padding:'7px 14px', fontSize:'0.83rem' }}>
                  <FileDown size={13}/> Download PDF
                </button>
                <button onClick={() => { setInspectRecord(null); onNavigate?.('cases') }} className="btn-secondary" style={{ padding:'7px 14px', fontSize:'0.83rem' }}>
                  Open in Cases →
                </button>
                <button onClick={() => setInspectRecord(null)} className="btn-secondary">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
