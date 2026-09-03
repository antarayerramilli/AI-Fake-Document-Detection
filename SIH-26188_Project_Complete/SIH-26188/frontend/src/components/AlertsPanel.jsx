import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, BellOff, AlertTriangle, CheckCircle2, Info, RefreshCw, X, Zap, Clock } from 'lucide-react'

const API_URL = '/api'
const POLL_MS = 8000

function timeAgo(ts) {
  if (!ts) return '—'
  const diff = (Date.now() - new Date(ts).getTime()) / 1000
  if (diff < 60)  return `${Math.floor(diff)}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

function alertStyle(level) {
  if (level === 'RED' || level === 'HIGH' || level === 'CRITICAL') return { bg: '#fef2f2', border: '#fca5a5', icon: <AlertTriangle size={15} color="#dc2626"/>, badge: '#dc2626', text: '#991b1b' }
  if (level === 'YELLOW' || level === 'MEDIUM') return { bg: '#fffbeb', border: '#fcd34d', icon: <AlertTriangle size={15} color="#d97706"/>, badge: '#d97706', text: '#92400e' }
  return { bg: '#f0fdf4', border: '#86efac', icon: <CheckCircle2 size={15} color="#16a34a"/>, badge: '#16a34a', text: '#14532d' }
}

export default function AlertsPanel() {
  const [alerts, setAlerts]       = useState([])
  const [muted, setMuted]         = useState(false)
  const [loading, setLoading]     = useState(true)
  const [lastFetch, setLastFetch] = useState(null)
  const [dismissed, setDismissed] = useState(new Set())
  const prevIdsRef = useRef(new Set())
  const audioCtxRef = useRef(null)

  const playBeep = useCallback((level) => {
    if (muted) return
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      const ctx  = audioCtxRef.current
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      const isHigh = level === 'RED' || level === 'HIGH' || level === 'CRITICAL'
      osc.type = isHigh ? 'square' : 'sine'
      osc.frequency.value = isHigh ? 880 : 440
      gain.gain.setValueAtTime(isHigh ? 0.35 : 0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (isHigh ? 0.7 : 0.4))
      osc.start(); osc.stop(ctx.currentTime + (isHigh ? 0.7 : 0.4))
    } catch {}
  }, [muted])

  const fetchAlerts = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/history?limit=20`)
      if (!r.ok) return
      const d = await r.json()
      const rows = (d.data || []).map(s => ({
        id:         s.id,
        case_id:    s.case_id,
        name:       s.holder_name || 'Unknown',
        level:      s.risk_level  || 'LOW',
        action:     s.risk_action || '—',
        doc_type:   s.document_type,
        checkpoint: s.checkpoint_id || 'ICP-04',
        timestamp:  s.timestamp,
        status:     s.case_status,
        tamper:     s.tampering_detected,
      }))

      // play sound for new high-risk
      rows.forEach(a => {
        if (!prevIdsRef.current.has(a.id) && (a.level === 'RED' || a.level === 'HIGH')) {
          playBeep(a.level)
        }
      })
      prevIdsRef.current = new Set(rows.map(r => r.id))
      setAlerts(rows)
      setLastFetch(new Date())
    } catch {}
    finally { setLoading(false) }
  }, [playBeep])

  useEffect(() => {
    fetchAlerts()
    const t = setInterval(fetchAlerts, POLL_MS)
    return () => clearInterval(t)
  }, [fetchAlerts])

  const visible = alerts.filter(a => !dismissed.has(a.id))
  const highRisk = visible.filter(a => a.level === 'RED' || a.level === 'HIGH' || a.level === 'CRITICAL')

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <Bell size={22} color="#dc2626"/>
            Real-time Alert Feed
            {highRisk.length > 0 && (
              <span style={{ background: '#dc2626', color: '#fff', borderRadius: '20px', padding: '1px 9px', fontSize: '0.75rem', fontWeight: 800, animation: 'pulse 1.5s infinite' }}>
                {highRisk.length} ACTIVE
              </span>
            )}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Live feed from all checkpoints · auto-refreshes every {POLL_MS / 1000}s
            {lastFetch && <span style={{ marginLeft: '8px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>· Last: {lastFetch.toLocaleTimeString('en-IN')}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setMuted(m => !m)} className={muted ? 'btn-secondary' : 'btn-primary'}
            style={{ padding: '7px 13px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {muted ? <BellOff size={14}/> : <Bell size={14}/>} {muted ? 'Unmute' : 'Mute'}
          </button>
          <button onClick={fetchAlerts} className="btn-secondary" style={{ padding: '7px 13px', fontSize: '0.82rem' }}>
            <RefreshCw size={14}/> Refresh
          </button>
          {dismissed.size > 0 && (
            <button onClick={() => setDismissed(new Set())} className="btn-secondary" style={{ padding: '7px 13px', fontSize: '0.82rem', color: '#dc2626' }}>
              Reset ({dismissed.size})
            </button>
          )}
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: '12px', marginBottom: '18px' }}>
        {[
          { label: 'Total',    val: visible.length,                                                color: '#1e40af' },
          { label: 'High Risk', val: highRisk.length,                                              color: '#dc2626' },
          { label: 'Medium',   val: visible.filter(a => a.level === 'YELLOW' || a.level === 'MEDIUM').length, color: '#d97706' },
          { label: 'Cleared',  val: visible.filter(a => a.level === 'GREEN'  || a.level === 'LOW').length,    color: '#16a34a' },
        ].map(s => (
          <div key={s.label} className="panel" style={{ padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.val}</div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Alert list */}
      {loading ? (
        <div className="panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={20} style={{ margin: '0 auto 10px', animation: 'spin 1s linear infinite' }}/><br/>Loading alerts…
        </div>
      ) : visible.length === 0 ? (
        <div className="panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          <Bell size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }}/><br/>
          No alerts. Run document screenings to see live results here.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {visible.map(a => {
            const st = alertStyle(a.level)
            return (
              <div key={a.id} style={{
                background: st.bg, border: `1.5px solid ${st.border}`, borderRadius: '10px',
                padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: '12px',
                boxShadow: (a.level === 'RED' || a.level === 'HIGH') ? `0 0 0 2px ${st.border}40` : 'none',
                animation: (a.level === 'RED' || a.level === 'HIGH') ? 'none' : 'none',
                position: 'relative'
              }}>
                <div style={{ marginTop: '2px', flexShrink: 0 }}>{st.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.88rem', color: st.text }}>{a.case_id}</span>
                    <span style={{ background: st.badge, color: '#fff', borderRadius: '20px', padding: '1px 8px', fontSize: '0.7rem', fontWeight: 800 }}>{a.level}</span>
                    {a.tamper && <span style={{ background: '#7c3aed', color: '#fff', borderRadius: '20px', padding: '1px 8px', fontSize: '0.7rem', fontWeight: 800 }}>TAMPERED</span>}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Clock size={10}/> {timeAgo(a.timestamp)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.83rem', color: st.text, fontWeight: 700, marginBottom: '2px' }}>{a.name} · {a.doc_type?.replace(/_/g, ' ')}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <Zap size={10} style={{ verticalAlign: 'middle', marginRight: '3px' }}/>{a.action} · {a.checkpoint} · {a.status}
                  </div>
                </div>
                <button onClick={() => setDismissed(d => new Set([...d, a.id]))}
                  style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px', borderRadius: '4px' }}>
                  <X size={14}/>
                </button>
              </div>
            )
          })}
        </div>
      )}

      <p style={{ marginTop: '14px', fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
        <Info size={11}/>
        Sound alerts play automatically for HIGH/CRITICAL risk screenings. Click × to dismiss individual alerts.
      </p>
    </div>
  )
}
