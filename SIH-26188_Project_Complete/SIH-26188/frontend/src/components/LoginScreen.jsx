import React, { useState } from 'react'
import { Shield, Eye, EyeOff, LogIn, Lock, User, AlertCircle } from 'lucide-react'

const API_URL = '/api'

export default function LoginScreen({ onLogin }) {
  const [badge, setBadge]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!badge.trim() || !password) { setError('Badge number and password are required.'); return }
    setLoading(true)
    try {
      const r = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badge_number: badge.trim(), password })
      })
      const d = await r.json()
      if (r.ok && d.success) {
        localStorage.setItem('ssb_token', d.token)
        localStorage.setItem('ssb_officer', JSON.stringify(d.officer))
        onLogin(d.officer, d.token)
      } else {
        setError(d.error || 'Invalid credentials. Please try again.')
      }
    } catch {
      setError('Unable to connect to authentication server. Check backend is running.')
    }
    setLoading(false)
  }

  // Demo quick-fill
  const demoFill = () => { setBadge('SSB-47001'); setPassword('admin123') }

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Background pattern */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 40px,rgba(255,255,255,1) 40px,rgba(255,255,255,1) 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(255,255,255,1) 40px,rgba(255,255,255,1) 41px)'
      }}/>

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        {/* Emblem */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #1d4ed8, #1e40af)',
            border: '3px solid rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', boxShadow: '0 8px 32px rgba(29,78,216,0.5)'
          }}>
            <Shield size={34} color="#fff"/>
          </div>
          <h1 style={{ color: '#f1f5f9', fontSize: '1.35rem', fontWeight: 900, marginBottom: '4px', letterSpacing: '-0.02em' }}>
            SSB Document Verifier
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.82rem', fontWeight: 600 }}>
            Sashastra Seema Bal · Ministry of Home Affairs · SIH-26188
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px',
          padding: '32px', boxShadow: '0 24px 48px rgba(0,0,0,0.4)'
        }}>
          <h2 style={{ color: '#f1f5f9', fontSize: '1.1rem', fontWeight: 800, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={16} color="#60a5fa"/> Officer Authentication
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '24px' }}>
            Restricted access — authorised SSB personnel only
          </p>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px', padding: '10px 14px', marginBottom: '18px',
              display: 'flex', alignItems: 'center', gap: '8px',
              color: '#fca5a5', fontSize: '0.82rem', fontWeight: 600
            }}>
              <AlertCircle size={14}/> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                Badge / Employee Number
              </label>
              <div style={{ position: 'relative' }}>
                <User size={14} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}/>
                <input
                  type="text" value={badge} onChange={e => setBadge(e.target.value)}
                  placeholder="e.g. SSB-47001"
                  style={{
                    width: '100%', padding: '10px 12px 10px 36px', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '8px', color: '#f1f5f9', fontSize: '0.88rem', outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}/>
                <input
                  type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%', padding: '10px 38px 10px 36px', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '8px', color: '#f1f5f9', fontSize: '0.88rem', outline: 'none'
                  }}
                />
                <button type="button" onClick={() => setShowPw(p => !p)} style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '2px'
                }}>
                  {showPw ? <EyeOff size={14}/> : <Eye size={14}/>}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '12px', borderRadius: '8px', border: 'none', cursor: loading ? 'wait' : 'pointer',
              background: loading ? '#1e40af99' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: '#fff', fontWeight: 800, fontSize: '0.92rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: '0 4px 16px rgba(29,78,216,0.4)', marginTop: '4px',
              transition: 'opacity 0.2s'
            }}>
              <LogIn size={16}/> {loading ? 'Authenticating…' : 'Access Portal'}
            </button>
          </form>

          {/* Demo mode */}
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button onClick={demoFill} style={{
              background: 'none', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: '6px',
              color: '#64748b', fontSize: '0.75rem', cursor: 'pointer', padding: '6px 14px',
              fontWeight: 600, transition: 'color 0.2s'
            }}>
              🔧 Use Demo Credentials (SIH Evaluation)
            </button>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: '#374151', fontSize: '0.72rem', marginTop: '20px' }}>
          Ministry of Home Affairs · Government of India · Classified System
        </p>
      </div>
    </div>
  )
}
