import React, { useState, useEffect, useRef } from 'react'
import {
  Shield, FileCheck, BarChart3, History, Info, Menu, X,
  MapPin, Briefcase, Layers, Moon, Sun, Bell, BellOff, Network, LogOut, UserCheck
} from 'lucide-react'
import UploadScreen     from './components/Upload'
import ResultsScreen    from './components/Results'
import Dashboard        from './components/Dashboard'
import CheckpointsMap   from './components/CheckpointsMap'
import CaseManagement   from './components/CaseManagement'
import HistoryScreen    from './components/History'
import SystemInfo       from './components/SystemInfo'
import WatchlistManager from './components/WatchlistManager'
import IdentityGraph    from './components/IdentityGraph'
import AlertsPanel      from './components/AlertsPanel'
import LoginScreen      from './components/LoginScreen'

const API_URL = '/api'

/* ── live clock ── */
function LiveClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  const hh = String(now.getHours()).padStart(2,'0')
  const mm = String(now.getMinutes()).padStart(2,'0')
  const ss = String(now.getSeconds()).padStart(2,'0')
  return <span className="font-mono" style={{letterSpacing:'0.06em'}}>{hh}:{mm}:{ss} IST</span>
}

/* ── shift helper ── */
function currentShift() {
  const h = new Date().getHours()
  if (h >= 6  && h < 14) return 'Alpha  (06:00–14:00 IST)'
  if (h >= 14 && h < 22) return 'Bravo  (14:00–22:00 IST)'
  return 'Charlie (22:00–06:00 IST)'
}

/* ── RED alert sound ── */
function playAlert() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'square'; osc.frequency.value = 880
    gain.gain.setValueAtTime(0.4, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    osc.start(); osc.stop(ctx.currentTime + 0.6)
  } catch {}
}

/* ── green flash ── */
function GreenFlash({ show }) {
  if (!show) return null
  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(16,185,129,0.18)',
      zIndex:9999, pointerEvents:'none',
      animation:'flashGreen 0.8s ease-out forwards'
    }}/>
  )
}

function App() {
  const [screen, setScreen]             = useState('dashboard')
  const [result, setResult]             = useState(null)
  const [backendOnline, setBackendOnline] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [darkMode, setDarkMode]         = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [pendingCases, setPendingCases] = useState(0)
  const [greenFlash, setGreenFlash]     = useState(false)
  const [toast, setToast]               = useState(null)
  const toastTimer = useRef(null)

  // ── Auth state ──
  const [officer, setOfficer] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ssb_officer')) } catch { return null }
  })
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('ssb_token') || null)

  const handleLogin = (officerData, token) => {
    setOfficer(officerData)
    setAuthToken(token)
  }

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
    } catch {}
    localStorage.removeItem('ssb_token')
    localStorage.removeItem('ssb_officer')
    setOfficer(null)
    setAuthToken(null)
    setScreen('dashboard')
  }

  // Show login if not authenticated
  if (!officer || !authToken) {
    return <LoginScreen onLogin={handleLogin}/>
  }

  /* ── dark mode ── */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  /* ── backend health ── */
  useEffect(() => {
    const check = async () => {
      try { const r = await fetch(`${API_URL}/health`); setBackendOnline(r.ok) }
      catch { setBackendOnline(false) }
    }
    check()
    const t = setInterval(check, 30000)
    return () => clearInterval(t)
  }, [])

  /* ── pending cases badge ── */
  useEffect(() => {
    const fetchPending = async () => {
      try {
        const r = await fetch(`${API_URL}/cases?status=Under+Review`)
        if (r.ok) { const d = await r.json(); setPendingCases(d.total||0) }
      } catch {}
    }
    fetchPending()
    const t = setInterval(fetchPending, 15000)
    return () => clearInterval(t)
  }, [])

  /* ── show toast ── */
  const showToast = (msg, type='info') => {
    setToast({ msg, type })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 4500)
  }

  /* ── handle screening result ── */
  const handleResult = (data) => {
    setResult(data)
    setScreen('results')
    window.scrollTo({ top:0, behavior:'smooth' })

    const level = data?.risk_level || data?.level || ''
    if (level === 'RED' || level === 'HIGH') {
      if (soundEnabled) playAlert()
      showToast(`🚨 HIGH RISK — ${data.case_id} flagged! Immediate action required.`, 'danger')
    } else if (level === 'GREEN' || level === 'LOW') {
      setGreenFlash(true)
      setTimeout(() => setGreenFlash(false), 900)
      showToast(`✅ CLEARED — ${data.case_id} granted transit.`, 'success')
    } else {
      showToast(`⚠️ MEDIUM RISK — ${data.case_id} requires secondary inspection.`, 'warning')
    }
  }

  const handleNavClick = (s) => { setScreen(s); setMobileMenuOpen(false); window.scrollTo({ top:0, behavior:'smooth' }) }

  const navItems = [
    { key:'dashboard', label:'Dashboard',      icon:<BarChart3 size={15}/> },
    { key:'upload',    label:'Verify Doc',     icon:<FileCheck size={15}/> },
    ...(result ? [{ key:'results', label:'Results & XAI', icon:<Shield size={15}/> }] : []),
    { key:'map',       label:'Checkpoints',   icon:<MapPin size={15}/> },
    { key:'cases',     label:'Cases',         icon:<Briefcase size={15}/>, badge: pendingCases > 0 ? pendingCases : null },
    { key:'watchlist', label:'Watchlist',     icon:<Layers size={15}/> },
    { key:'alerts',    label:'Alerts',        icon:<Bell size={15}/> },
    { key:'graph',     label:'ID Graph',      icon:<Network size={15}/> },
    { key:'history',   label:'Audit Log',     icon:<History size={15}/> },
    { key:'system',    label:'Diagnostics',   icon:<Info size={15}/> },
  ]

  return (
    <div className="app-container">
      <GreenFlash show={greenFlash}/>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position:'fixed', bottom:'24px', right:'24px', zIndex:10000,
          padding:'12px 20px', borderRadius:'10px', maxWidth:'380px',
          background: toast.type==='danger' ? '#fef2f2' : toast.type==='success' ? '#f0fdf4' : '#fffbeb',
          border: `1.5px solid ${toast.type==='danger'?'#fca5a5':toast.type==='success'?'#86efac':'#fcd34d'}`,
          color: toast.type==='danger' ? '#991b1b' : toast.type==='success' ? '#14532d' : '#92400e',
          fontWeight:700, fontSize:'0.85rem', boxShadow:'0 8px 32px rgba(0,0,0,0.12)',
          animation:'slideInRight 0.3s ease'
        }}>
          {toast.msg}
          <button onClick={() => setToast(null)} style={{ marginLeft:'12px', background:'none', border:'none', cursor:'pointer', opacity:0.6, fontSize:'1rem' }}>×</button>
        </div>
      )}

      {/* ── Header ── */}
      <header className="portal-header">
        <div className="portal-header-top">
          <div><span>Ministry of Home Affairs &bull; Government of India &bull; Sashastra Seema Bal (SSB)</span></div>
          <div style={{ display:'flex', gap:'14px', alignItems:'center' }}>
            <span>Duty Officer: <strong>{officer.name} ({officer.unit})</strong></span>
            <span>Terminal: <strong>{officer.checkpoint}</strong></span>
            <span>Shift: <strong>{currentShift()}</strong></span>
            <span><LiveClock/></span>
          </div>
        </div>

        <div className="portal-header-main">
          <div className="portal-brand" onClick={() => handleNavClick('dashboard')} style={{cursor:'pointer'}}>
            <div className="portal-emblem"><Shield size={24}/></div>
            <div className="portal-brand-text">
              <h1>SSB Document Verifier</h1>
              <p>National Automated Cross-Border Document Authentication Portal</p>
            </div>
          </div>

          <nav className="portal-nav">
            {navItems.map(item => (
              <button key={item.key} onClick={() => handleNavClick(item.key)}
                className={`portal-nav-btn ${screen===item.key?'active':''}`}
                style={{ position:'relative' }}>
                {item.icon} {item.label}
                {item.badge && (
                  <span style={{
                    position:'absolute', top:'-5px', right:'-5px',
                    background:'#ef4444', color:'#fff', borderRadius:'50%',
                    width:'17px', height:'17px', fontSize:'0.65rem', fontWeight:800,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    lineHeight:1
                  }}>{item.badge > 99 ? '99+' : item.badge}</span>
                )}
              </button>
            ))}
          </nav>

          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            {/* Officer badge */}
            <div style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'0.73rem', fontWeight:700, color:'var(--text-secondary)', padding:'4px 8px', borderRadius:'6px', background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.15)' }}>
              <UserCheck size={13} color="#3b82f6"/>
              {officer.rank} {officer.badge_number}
            </div>
            {/* Sound toggle */}
            <button onClick={() => setSoundEnabled(s => !s)} className="btn-ghost" title={soundEnabled?'Mute alerts':'Enable alerts'} style={{padding:'6px'}}>
              {soundEnabled ? <Bell size={16}/> : <BellOff size={16}/>}
            </button>
            {/* Dark mode toggle */}
            <button onClick={() => setDarkMode(d => !d)} className="btn-ghost" title="Toggle dark mode" style={{padding:'6px'}}>
              {darkMode ? <Sun size={16}/> : <Moon size={16}/>}
            </button>
            {/* Engine status */}
            <div style={{
              display:'flex', alignItems:'center', gap:'6px',
              padding:'4px 11px', borderRadius:'var(--radius-full)',
              background: backendOnline ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
              border:`1px solid ${backendOnline?'var(--status-green-border)':'var(--status-red-border)'}`,
              fontSize:'0.73rem', fontWeight:700,
              color: backendOnline ? 'var(--status-green-text)' : 'var(--status-red-text)'
            }}>
              <span style={{ width:'7px', height:'7px', borderRadius:'50%', background: backendOnline?'#10b981':'#ef4444' }}/>
              {backendOnline ? 'Engine Online' : 'Engine Offline'}
            </div>
            {/* Logout */}
            <button onClick={handleLogout} className="btn-ghost" title="Logout" style={{padding:'6px', color:'#dc2626'}}>
              <LogOut size={16}/>
            </button>
            {/* Mobile toggle */}
            <button onClick={() => setMobileMenuOpen(m => !m)} className="btn-ghost" style={{ display:'none' }} id="mobile-nav-toggle">
              {mobileMenuOpen ? <X size={20}/> : <Menu size={20}/>}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div style={{ padding:'10px 14px', background:'var(--bg-surface-raised)', borderTop:'1px solid var(--border-subtle)', display:'flex', flexDirection:'column', gap:'5px' }}>
            {navItems.map(item => (
              <button key={item.key} onClick={() => handleNavClick(item.key)} className={`portal-nav-btn ${screen===item.key?'active':''}`}>{item.label}</button>
            ))}
          </div>
        )}
      </header>

      {/* ── Main ── */}
      <main className="portal-main">
        {screen==='dashboard' && <Dashboard onNavigate={handleNavClick}/>}
        {screen==='upload'    && <UploadScreen onResult={handleResult}/>}
        {screen==='results'   && <ResultsScreen result={result} onBack={() => setScreen('upload')} onNavigate={handleNavClick}/>}
        {screen==='map'       && <CheckpointsMap onSelectCase={() => handleNavClick('cases')}/>}
        {screen==='cases'     && <CaseManagement/>}
        {screen==='watchlist' && <WatchlistManager/>}
        {screen==='alerts'    && <AlertsPanel/>}
        {screen==='graph'     && <IdentityGraph/>}
        {screen==='history'   && <HistoryScreen/>}
        {screen==='system'    && <SystemInfo/>}
      </main>

      {/* ── Footer ── */}
      <footer className="portal-footer">
        <div><strong>Sashastra Seema Bal (SSB)</strong> &bull; Ministry of Home Affairs &bull; Government of India &bull; SIH-26188</div>
        <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>
          Operational Border Checkpoint Suite &bull; Optical Security &amp; Biometric Clearance Engine
        </div>
      </footer>

      <style>{`
        @keyframes flashGreen { 0%{opacity:1} 100%{opacity:0} }
        @keyframes slideInRight { from{transform:translateX(100px);opacity:0} to{transform:translateX(0);opacity:1} }
        [data-theme='dark'] { --bg-base:#0f172a; --bg-surface:#1e293b; --bg-surface-raised:#1e293b; --text-primary:#f1f5f9; --text-secondary:#94a3b8; --text-muted:#64748b; --border-subtle:#334155; --border-medium:#475569; }
        [data-theme='dark'] .portal-header { background:#1e293b!important; border-color:#334155!important; }
        [data-theme='dark'] .panel { background:#1e293b!important; border-color:#334155!important; }
        [data-theme='dark'] .stat-card { background:#1e293b!important; border-color:#334155!important; }
        [data-theme='dark'] .data-table th { background:#0f172a!important; color:#94a3b8!important; }
        [data-theme='dark'] .data-table td { border-color:#334155!important; color:#e2e8f0!important; }
        [data-theme='dark'] .data-table tr:hover { background:#334155!important; }
      `}</style>
    </div>
  )
}

export default App
