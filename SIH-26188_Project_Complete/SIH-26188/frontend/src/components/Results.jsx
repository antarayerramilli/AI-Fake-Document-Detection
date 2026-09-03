import React, { useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  FileDown,
  User,
  Copy,
  Check,
  Printer,
  FileText,
  AlertCircle,
  Layers,
  Sparkles,
  Search,
  ExternalLink,
  Calendar,
  Clock,
  HelpCircle,
  Camera,
  FileCode,
  Hash,
  MapPin,
  ShieldAlert,
  Briefcase
} from 'lucide-react'

const API_URL = '/api'

function ResultsScreen({ result, onBack, onNavigate }) {
  if (!result) return null

  const [copiedKey, setCopiedKey] = useState(null)
  const [copyAllSuccess, setCopyAllSuccess] = useState(false)

  const level = result.risk_level || 'YELLOW'
  const isGreen = level === 'GREEN' || level === 'LOW'
  const isYellow = level === 'YELLOW' || level === 'MEDIUM'
  const isRed = level === 'RED' || level === 'HIGH'

  const copyValue = (val, key) => {
    navigator.clipboard.writeText(val)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const copyAllFields = () => {
    if (!result.extracted_data) return
    const text = Object.entries(result.extracted_data)
      .map(([k, v]) => `${k.toUpperCase()}: ${v}`)
      .join('\n')
    navigator.clipboard.writeText(text)
    setCopyAllSuccess(true)
    setTimeout(() => setCopyAllSuccess(false), 2500)
  }

  const downloadReport = () => {
    const caseId = result.case_id || 'CASE-10241'
    window.open(`${API_URL}/report?case_id=${encodeURIComponent(caseId)}`, '_blank', 'noopener,noreferrer')
  }

  const expiry = result.expiry_details || {}
  const xai = result.explainable_ai || {}

  return (
    <div>
      {/* Top Action Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <button
          onClick={onBack}
          className="btn-secondary"
        >
          <ArrowLeft size={16} /> Back to Document Intake
        </button>

        <div style={{ display: 'flex', gap: '10px' }}>
          {onNavigate && (
            <button
              onClick={() => onNavigate('cases')}
              className="btn-secondary"
            >
              <Briefcase size={15} /> Case Desk ({result.case_id || 'CASE-10241'})
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="btn-secondary"
          >
            <Printer size={15} /> Print Summary
          </button>

          <button
            onClick={downloadReport}
            className="btn-primary"
          >
            <FileDown size={16} /> Download Official PDF Certificate
          </button>
        </div>
      </div>

      {/* Document Type Mismatch Alert Card */}
      {result.type_mismatch && !result.type_mismatch.is_type_match && (
        <div style={{
          background: '#fff1f2',
          border: '2px solid #f43f5e',
          borderRadius: 'var(--radius-lg)',
          padding: '22px 26px',
          marginBottom: '24px',
          boxShadow: '0 8px 20px -4px rgba(244, 63, 94, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{
              background: '#ffe4e6',
              border: '1.5px solid #fecdd3',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#e11d48',
              flexShrink: 0
            }}>
              <XCircle size={30} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span className="badge badge-red" style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
                  INCORRECT DOCUMENT UPLOADED
                </span>
                <span style={{ fontSize: '0.8rem', color: '#9f1239', fontWeight: 700 }}>
                  TYPE MISMATCH DETECTED
                </span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#881337', margin: '4px 0 8px 0' }}>
                {result.type_mismatch.error_message || `Incorrect document uploaded. You selected ${result.type_mismatch.selected_label}, but the uploaded document appears to be a ${result.type_mismatch.detected_label}.`}
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '12px',
                background: '#ffffff',
                border: '1.5px solid #fecdd3',
                borderRadius: 'var(--radius-md)',
                padding: '14px 18px',
                margin: '14px 0'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                    Selected Document Category
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    {result.type_mismatch.selected_label || result.document_type}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#e11d48', textTransform: 'uppercase', fontWeight: 700 }}>
                    Detected Document Category
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#e11d48', marginTop: '2px' }}>
                    {result.type_mismatch.detected_label || 'Other / Invalid Document'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginTop: '10px' }}>
                <p style={{ fontSize: '0.9rem', color: '#9f1239', fontWeight: 600, margin: 0 }}>
                  👉 <strong>{result.type_mismatch.guidance_message || `Please upload the correct document (${result.type_mismatch.selected_label}).`}</strong>
                </p>
                <button
                  onClick={onBack}
                  className="btn-primary"
                  style={{ background: '#e11d48', borderColor: '#be123c', padding: '9px 18px', fontSize: '0.85rem' }}
                >
                  <ArrowLeft size={15} /> Re-Upload Correct Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Risk Banner */}
      <div style={{
        borderRadius: 'var(--radius-lg)',
        padding: '24px 28px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        background: isGreen ? '#ecfdf5' : isYellow ? '#fffbeb' : '#fef2f2',
        border: `1.5px solid ${isGreen ? '#6ee7b7' : isYellow ? '#fde68a' : '#fca5a5'}`,
        boxShadow: 'var(--shadow-raised)',
        flexWrap: 'wrap',
        transition: 'all 0.25s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: isGreen ? '#d1fae5' : isYellow ? '#fef3c7' : '#fee2e2',
            border: `1.5px solid ${isGreen ? '#a7f3d0' : isYellow ? '#fde047' : '#fecaca'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isGreen ? '#059669' : isYellow ? '#d97706' : '#dc2626',
            flexShrink: 0,
            boxShadow: '0 4px 10px rgba(0,0,0,0.06)'
          }}>
            {isGreen && <CheckCircle2 size={32} />}
            {isYellow && <AlertTriangle size={32} />}
            {isRed && <XCircle size={32} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span className={`badge ${isGreen ? 'badge-green' : isYellow ? 'badge-yellow' : 'badge-red'}`}>
                Risk Level: {level}
              </span>
              <span className="font-mono" style={{ fontSize: '0.78rem', color: '#1e40af', fontWeight: 800 }}>
                {result.case_id || 'CASE-10241'}
              </span>
              <span style={{ fontSize: '0.78rem', color: isGreen ? '#065f46' : isYellow ? '#854d0e' : '#991b1b', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                {result.timestamp ? result.timestamp.replace('T', ' ').substring(0, 19) : ''}
              </span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: isGreen ? '#065f46' : isYellow ? '#854d0e' : '#991b1b', marginBottom: '2px' }}>
              {isGreen && 'Document Clearance: PASS (Standard Transit Authorized)'}
              {isYellow && 'Attention Required: Secondary Inspection Advised'}
              {isRed && 'Security Alert: Credential Flagged / Invalid Record'}
            </h2>
            <p style={{ fontSize: '0.875rem', color: isGreen ? '#047857' : isYellow ? '#b45309' : '#b91c1c', fontWeight: 600 }}>
              Action Guidance: <strong style={{ textDecoration: 'underline' }}>{result.risk_action || 'Follow standard checkpoint protocol'}</strong>
            </p>
          </div>
        </div>

        <div style={{
          textAlign: 'center',
          background: '#ffffff',
          padding: '16px 30px',
          borderRadius: 'var(--radius-lg)',
          border: `1.5px solid ${isGreen ? '#a7f3d0' : isYellow ? '#fde047' : '#fecaca'}`,
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{
            fontSize: '2.2rem',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            lineHeight: 1,
            color: isGreen ? '#059669' : isYellow ? '#d97706' : '#dc2626'
          }}>
            {result.risk_score}/100
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginTop: '4px' }}>
            Risk Index
          </div>
        </div>
      </div>

      {/* WATCHLIST HIT BANNER */}
      {result.watchlist_hit && result.watchlist_hit.hit && (
        <div style={{
          margin: '0 0 24px',
          padding: '16px 20px',
          borderRadius: '10px',
          background: '#fef2f2',
          border: '2px solid #dc2626',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '14px',
          boxShadow: '0 0 0 4px rgba(220,38,38,0.08)'
        }}>
          <div style={{ fontSize: '1.8rem', flexShrink: 0 }}>🚨</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, fontSize: '1rem', color: '#991b1b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              WATCHLIST MATCH DETECTED
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#7f1d1d', marginBottom: '6px' }}>
              {result.watchlist_hit.name} — Threat Level:&nbsp;
              <span style={{ background: '#dc2626', color: '#fff', borderRadius: '4px', padding: '1px 8px', fontSize: '0.78rem' }}>
                {result.watchlist_hit.threat_level}
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: '#991b1b', fontWeight: 600 }}>
              Reason: {result.watchlist_hit.reason || 'Flagged in national security database'}
            </div>
            <div style={{ marginTop: '8px', fontSize: '0.78rem', color: '#7f1d1d', fontWeight: 700 }}>
              ⚠ IMMEDIATE ACTION: Detain traveller and notify supervising officer. Do NOT allow transit.
            </div>
          </div>
        </div>
      )}

      {/* EXPLAINABLE AI (XAI) */}
      <div className="panel panel-interactive" style={{ marginBottom: '24px', border: '1.5px solid #bfdbfe' }}>
        <div className="panel-header">
          <div>
            <h3 className="panel-title" style={{ color: '#1e40af' }}>
              <Sparkles size={18} color="#2563eb" /> Explainable AI Rationale &mdash; Why was this document flagged?
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
              Structured forensic breakdown synthesized across optical security features, tamper analysis, and biometric tests.
            </p>
          </div>
          <span className="badge badge-blue">
            {xai.total_explanations || 3} Diagnostic Insights
          </span>
        </div>

        <div style={{ display: 'grid', gap: '12px' }}>
          {xai.items && xai.items.length > 0 ? (
            xai.items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  background: item.severity === 'CRITICAL' ? '#fef2f2' : item.severity === 'WARNING' ? '#fffbeb' : '#f0fdf4',
                  border: `1.5px solid ${item.severity === 'CRITICAL' ? '#fecaca' : item.severity === 'WARNING' ? '#fde68a' : '#bbf7d0'}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: item.severity === 'CRITICAL' ? '#991b1b' : item.severity === 'WARNING' ? '#92400e' : '#065f46' }}>
                    {item.title}
                  </span>
                  <span className={`badge ${item.severity === 'CRITICAL' ? 'badge-red' : item.severity === 'WARNING' ? 'badge-yellow' : 'badge-green'}`}>
                    {item.severity}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 600, margin: '4px 0' }}>
                  {item.summary}
                </p>
                {item.forensic_evidence && (
                  <div style={{ fontSize: '0.78rem', color: '#475569', fontFamily: 'var(--font-mono)', background: 'rgba(255,255,255,0.7)', padding: '4px 8px', borderRadius: '4px', marginTop: '4px' }}>
                    Forensic Metric: {item.forensic_evidence}
                  </div>
                )}
                {item.officer_action && (
                  <div style={{ fontSize: '0.78rem', color: '#1e40af', fontWeight: 700, marginTop: '6px' }}>
                    👉 Action Protocol: {item.officer_action}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div style={{ padding: '14px', background: '#f8fafc', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
              <strong>Summary Observations:</strong> {result.risk_reasons?.join(' • ') || 'All verification parameters within standard operational thresholds.'}
            </div>
          )}
        </div>
      </div>

      {/* DOCUMENT EXPIRY & VALIDITY CHECKS */}
      <div className="panel panel-interactive" style={{ marginBottom: '24px' }}>
        <div className="panel-header">
          <h3 className="panel-title">
            <Calendar size={18} color="var(--navy-light)" /> Document Expiry & Validity Inspection (Checkpoint Date: 01/09/2026)
          </h3>
          <span className={`badge ${expiry.is_expired ? 'badge-red' : 'badge-green'}`}>
            {expiry.status_badge || (expiry.is_expired ? 'EXPIRED' : 'VALID')}
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '14px'
        }}>
          <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
            <span className="prop-label">EVALUATION DATE</span>
            <div className="font-mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
              {expiry.evaluation_date || '01/09/2026'}
            </div>
          </div>

          <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
            <span className="prop-label">DOCUMENT EXPIRY DATE</span>
            <div className="font-mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: expiry.is_expired ? '#dc2626' : '#059669', marginTop: '2px' }}>
              {expiry.expiry_date || result.extracted_data?.expiry || '15/08/2026'}
            </div>
          </div>

          <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
            <span className="prop-label">VALIDITY STATUS</span>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: expiry.is_expired ? '#dc2626' : '#059669', marginTop: '2px' }}>
              {expiry.is_expired ? `EXPIRED (${Math.abs(expiry.days_remaining || 17)} days ago)` : 'CURRENT / VALID'}
            </div>
          </div>
        </div>

        {expiry.errors && expiry.errors.length > 0 && (
          <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', color: '#991b1b', fontSize: '0.8rem', fontWeight: 600 }}>
            {expiry.errors.map((e, idx) => (
              <div key={idx}>⚠️ {e}</div>
            ))}
          </div>
        )}
      </div>

      {/* Grid: Extracted Data & Validation Matrix */}
      <div className="layout-2col" style={{ marginBottom: '24px' }}>
        {/* Left: OCR Extracted Fields */}
        <div className="panel panel-interactive">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">
                <FileText size={18} color="var(--navy-light)" /> Extracted Document Fields
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Category: {result.document_type || 'Unknown'}
              </span>
            </div>
            <button
              onClick={copyAllFields}
              className="btn-secondary"
              style={{ padding: '5px 12px', fontSize: '0.75rem' }}
            >
              {copyAllSuccess ? <Check size={13} color="#059669" /> : <Copy size={13} />}
              {copyAllSuccess ? 'Copied All!' : 'Copy All'}
            </button>
          </div>

          <div>
            {result.extracted_data && Object.keys(result.extracted_data).length > 0 ? (
              Object.entries(result.extracted_data).map(([k, v]) => {
                if (!v || k === 'document_type') return null
                const str = String(v)
                const isCopied = copiedKey === k

                return (
                  <div key={k} className="prop-row">
                    <span className="prop-label">{k.replace(/_/g, ' ').toUpperCase()}</span>
                    <div className="prop-value">
                      <span className="font-mono">{str}</span>
                      <button
                        type="button"
                        onClick={() => copyValue(str, k)}
                        title="Copy field value"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: isCopied ? '#059669' : '#64748b',
                          cursor: 'pointer',
                          padding: '2px 4px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        {isCopied ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                )
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No OCR text extracted from this document image.
              </div>
            )}
          </div>
        </div>

        {/* Right: Facial Biometric Verification */}
        <div className="panel panel-interactive">
          <div className="panel-header">
            <h3 className="panel-title">
              <User size={18} color="var(--navy-light)" /> 1:1 Facial Biometric Verification
            </h3>
          </div>

          {result.face_verification ? (
            <div>
              <div style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: result.face_verification.match ? '#ecfdf5' : '#fef2f2',
                border: `1.5px solid ${result.face_verification.match ? '#6ee7b7' : '#fca5a5'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: result.face_verification.match ? '#065f46' : '#991b1b' }}>
                    {result.face_verification.match ? 'Biometric Face Match Confirmed' : 'Biometric Mismatch Detected'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Algorithm: {result.face_verification.model || 'Facenet512'}
                  </div>
                </div>
                <span className={`badge ${result.face_verification.match ? 'badge-green' : 'badge-red'}`}>
                  {result.face_verification.match ? 'MATCH' : 'MISMATCH'}
                </span>
              </div>

              <div className="prop-row">
                <span className="prop-label">Embedding Distance</span>
                <span className="prop-value font-mono">
                  {result.face_verification.distance !== undefined ? result.face_verification.distance : '0.24'}
                </span>
              </div>
              <div className="prop-row">
                <span className="prop-label">Decision Threshold</span>
                <span className="prop-value font-mono">0.40</span>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
              <User size={38} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155', marginBottom: '2px' }}>
                No Live Portrait Submitted
              </p>
              <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Face matching was bypassed because no applicant live selfie was provided during screening.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResultsScreen
