import React, { useState, useEffect } from 'react'
import {
  FileText,
  Search,
  Filter,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Edit3,
  Save,
  FileDown,
  X,
  RefreshCw,
  Tag,
  Check,
  AlertCircle,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  Layers,
  ArrowUpRight,
  Calendar,
  Briefcase
} from 'lucide-react'

const API_URL = '/api'

function CaseManagement({ initialFilter = 'ALL' }) {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState(initialFilter)
  const [selectedCase, setSelectedCase] = useState(null)
  const [editingRemarks, setEditingRemarks] = useState('')
  const [savingRemarks, setSavingRemarks] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const fetchCases = async () => {
    try {
      setLoading(true)
      setError(null)

      const url = statusFilter === 'ALL' 
        ? `${API_URL}/cases?search=${encodeURIComponent(searchTerm)}`
        : `${API_URL}/cases?status=${encodeURIComponent(statusFilter)}&search=${encodeURIComponent(searchTerm)}`

      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to load case management records')

      const data = await res.json()
      const fetchedCases = data.cases || []
      setCases(fetchedCases)

      if (fetchedCases.length > 0 && !selectedCase) {
        setSelectedCase(fetchedCases[0])
        setEditingRemarks(fetchedCases[0].officer_remarks || '')
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to case management database')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCases()
  }, [statusFilter])

  const handleSelectCase = (c) => {
    setSelectedCase(c)
    setEditingRemarks(c.officer_remarks || '')
    setSaveSuccess(false)
  }

  const handleSaveRemarksAndStatus = async (newStatus = null) => {
    if (!selectedCase) return
    try {
      setSavingRemarks(true)
      setSaveSuccess(false)

      const targetStatus = newStatus || selectedCase.case_status || 'Under Review'

      const res = await fetch(`${API_URL}/cases/${selectedCase.case_id || selectedCase.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_status: targetStatus,
          officer_remarks: editingRemarks
        })
      })

      if (!res.ok) throw new Error('Failed to save officer remarks')

      setSelectedCase(prev => ({
        ...prev,
        case_status: targetStatus,
        officer_remarks: editingRemarks
      }))

      setCases(prev => prev.map(c => {
        if (c.id === selectedCase.id || c.case_id === selectedCase.case_id) {
          return {
            ...c,
            case_status: targetStatus,
            officer_remarks: editingRemarks
          }
        }
        return c
      }))

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      alert(`Error updating case: ${err.message}`)
    } finally {
      setSavingRemarks(false)
    }
  }

  const downloadReport = (caseItem) => {
    if (!caseItem) return
    const id = caseItem.id || ''
    const caseId = caseItem.case_id || ''
    const filename = caseItem.report_filename || ''
    window.open(`${API_URL}/report?id=${id}&case_id=${encodeURIComponent(caseId)}&path=${encodeURIComponent(filename)}`, '_blank', 'noopener,noreferrer')
  }

  const formatDocType = (name) => {
    if (!name) return 'Unknown'
    const map = {
      'nepal_citizenship': 'Nepal Citizenship',
      'bhutan_cid': 'Bhutan CID Card',
      'indian_epic': 'Indian Voter ID (EPIC)',
      'indian_passport': 'Indian Passport',
      'foreign_passport': 'Foreign Passport + Visa'
    }
    return map[name] || name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '2px' }}>
            Suspicious Document Case Desk & Adjudication
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Investigate suspicious documents, record examining officer remarks, update disposition statuses, and review forensic evidence.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={fetchCases}
            disabled={loading}
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Reload Cases
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '12px 18px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Status Filter:</span>
          {['ALL', 'Under Review', 'Flagged', 'Cleared', 'Escalated'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: statusFilter === st ? '#1e40af' : '#f1f5f9',
                color: statusFilter === st ? '#ffffff' : '#64748b',
                transition: 'all 0.15s ease'
              }}
            >
              {st}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search Case ID, name, doc type..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchCases()}
            style={{
              padding: '6px 12px 6px 32px',
              borderRadius: 'var(--radius-sm)',
              background: '#ffffff',
              border: '1.5px solid var(--border-medium)',
              color: '#0f172a',
              fontSize: '0.825rem',
              outline: 'none',
              minWidth: '240px'
            }}
          />
          <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '9px' }} />
        </div>
      </div>

      {/* Main Grid: Cases List + Case Adjudication Workspace */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 1.1fr) minmax(360px, 1.5fr)',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Left Column: Case Cards List */}
        <div className="panel panel-interactive" style={{ padding: '18px' }}>
          <div className="panel-header" style={{ marginBottom: '14px' }}>
            <h3 className="panel-title">
              <FileText size={18} color="var(--navy-light)" /> Active Case Ledger ({cases.length})
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Latest Active First</span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
              <RefreshCw size={18} className="animate-spin" style={{ margin: '0 auto 8px' }} />
              Loading cases...
            </div>
          ) : cases.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No cases matching filter criteria.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '560px', overflowY: 'auto' }}>
              {cases.map((c) => {
                const isSelected = selectedCase?.id === c.id || selectedCase?.case_id === c.case_id
                const isRed = c.risk_level === 'RED'
                const isYellow = c.risk_level === 'YELLOW'

                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCase(c)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? '#eff6ff' : '#ffffff',
                      border: `1.5px solid ${isSelected ? '#3b82f6' : 'var(--border-subtle)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? 'var(--shadow-active)' : 'var(--shadow-sm)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e40af' }}>
                          {c.case_id || `CASE-${10240 + c.id}`}
                        </span>
                        <span className={`badge ${c.case_status === 'Cleared' ? 'badge-green' : c.case_status === 'Flagged' ? 'badge-red' : 'badge-yellow'}`} style={{ padding: '1px 6px', fontSize: '0.68rem' }}>
                          {c.case_status || 'Under Review'}
                        </span>
                      </div>
                      <span className="font-mono" style={{ fontSize: '0.8rem', fontWeight: 800, color: isRed ? '#dc2626' : isYellow ? '#d97706' : '#059669' }}>
                        {c.risk_score}/100
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '2px' }}>
                      {c.holder_name}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                      <span>{formatDocType(c.document_type)}</span>
                      <span>{c.timestamp ? c.timestamp.substring(11, 16) : ''} &bull; {c.checkpoint_id}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Column: Case Investigation & Adjudication Workspace */}
        {selectedCase ? (
          <div className="panel panel-interactive" style={{ padding: '24px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '14px',
              marginBottom: '16px',
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    {selectedCase.case_id || `CASE-${10240 + selectedCase.id}`}
                  </h3>
                  <span className={`badge ${selectedCase.risk_level === 'GREEN' ? 'badge-green' : selectedCase.risk_level === 'YELLOW' ? 'badge-yellow' : 'badge-red'}`}>
                    Risk: {selectedCase.risk_level} ({selectedCase.risk_score}/100)
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Screened at {selectedCase.checkpoint_id} &bull; {selectedCase.timestamp ? selectedCase.timestamp.replace('T', ' ').substring(0, 19) : ''}
                </p>
              </div>

              <button
                onClick={() => downloadReport(selectedCase)}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.78rem', borderColor: '#bfdbfe', background: '#eff6ff', color: '#1e40af' }}
              >
                <FileDown size={14} /> Download Certificate
              </button>
            </div>

            {/* Subject Info Summary */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              marginBottom: '18px'
            }}>
              <div>
                <span className="prop-label">SUBJECT FULL NAME</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                  {selectedCase.holder_name}
                </div>
              </div>
              <div>
                <span className="prop-label">DOCUMENT CLASSIFICATION</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e40af', marginTop: '2px' }}>
                  {formatDocType(selectedCase.document_type)}
                </div>
              </div>
            </div>

            {/* Explainable AI Findings Box */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--navy-primary)', textTransform: 'uppercase' }}>
                  Explainable AI Forensic Rationale
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Automated Diagnostic Report</span>
              </div>

              {selectedCase.explainable_ai?.items && selectedCase.explainable_ai.items.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedCase.explainable_ai.items.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        background: item.severity === 'CRITICAL' ? '#fef2f2' : item.severity === 'WARNING' ? '#fffbeb' : '#f0fdf4',
                        border: `1px solid ${item.severity === 'CRITICAL' ? '#fecaca' : item.severity === 'WARNING' ? '#fde68a' : '#bbf7d0'}`
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span style={{ fontSize: '0.825rem', fontWeight: 800, color: item.severity === 'CRITICAL' ? '#991b1b' : item.severity === 'WARNING' ? '#92400e' : '#065f46' }}>
                          {item.title}
                        </span>
                        <span className={`badge ${item.severity === 'CRITICAL' ? 'badge-red' : item.severity === 'WARNING' ? 'badge-yellow' : 'badge-green'}`} style={{ padding: '1px 5px', fontSize: '0.65rem' }}>
                          {item.severity}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: '#334155', lineHeight: 1.4, margin: '2px 0' }}>
                        {item.summary}
                      </p>
                      {item.forensic_evidence && (
                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                          Evidence: {item.forensic_evidence}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: selectedCase.risk_level === 'RED' ? '#fef2f2' : '#f8fafc',
                  border: `1px solid ${selectedCase.risk_level === 'RED' ? '#fecaca' : '#e2e8f0'}`,
                  fontSize: '0.8rem',
                  color: '#334155'
                }}>
                  <strong>Recommended Action:</strong> {selectedCase.risk_action}
                </div>
              )}
            </div>

            {/* Officer Remarks & Adjudication Editor */}
            <div style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Examining Officer Notes & Adjudication Remarks</span>
                {saveSuccess && (
                  <span style={{ color: '#059669', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={13} /> Notes Recorded in Official Register
                  </span>
                )}
              </label>
              <textarea
                rows={3}
                value={editingRemarks}
                onChange={e => setEditingRemarks(e.target.value)}
                placeholder="Enter physical examination observations, secondary interrogation outcomes, UV stamp inspection notes..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--border-medium)',
                  fontSize: '0.85rem',
                  color: '#0f172a',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Status Disposition Actions */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Set Official Case Disposition Status:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleSaveRemarksAndStatus('Under Review')}
                  disabled={savingRemarks}
                  className="btn-secondary"
                  style={{
                    padding: '8px 10px',
                    fontSize: '0.78rem',
                    background: selectedCase.case_status === 'Under Review' ? '#fffbeb' : '#ffffff',
                    borderColor: selectedCase.case_status === 'Under Review' ? '#d97706' : 'var(--border-medium)',
                    color: selectedCase.case_status === 'Under Review' ? '#92400e' : 'var(--text-primary)'
                  }}
                >
                  Under Review
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveRemarksAndStatus('Cleared')}
                  disabled={savingRemarks}
                  className="btn-secondary"
                  style={{
                    padding: '8px 10px',
                    fontSize: '0.78rem',
                    background: selectedCase.case_status === 'Cleared' ? '#ecfdf5' : '#ffffff',
                    borderColor: selectedCase.case_status === 'Cleared' ? '#059669' : 'var(--border-medium)',
                    color: selectedCase.case_status === 'Cleared' ? '#065f46' : 'var(--text-primary)'
                  }}
                >
                  ✓ Cleared
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveRemarksAndStatus('Flagged')}
                  disabled={savingRemarks}
                  className="btn-secondary"
                  style={{
                    padding: '8px 10px',
                    fontSize: '0.78rem',
                    background: selectedCase.case_status === 'Flagged' ? '#fef2f2' : '#ffffff',
                    borderColor: selectedCase.case_status === 'Flagged' ? '#dc2626' : 'var(--border-medium)',
                    color: selectedCase.case_status === 'Flagged' ? '#991b1b' : 'var(--text-primary)'
                  }}
                >
                  ⚠️ Flagged
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveRemarksAndStatus('Escalated')}
                  disabled={savingRemarks}
                  className="btn-secondary"
                  style={{
                    padding: '8px 10px',
                    fontSize: '0.78rem',
                    background: selectedCase.case_status === 'Escalated' ? '#eff6ff' : '#ffffff',
                    borderColor: selectedCase.case_status === 'Escalated' ? '#2563eb' : 'var(--border-medium)',
                    color: selectedCase.case_status === 'Escalated' ? '#1e40af' : 'var(--text-primary)'
                  }}
                >
                  Escalate
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="panel" style={{ textAlign: 'center', padding: '48px 16px', color: '#64748b' }}>
            <FileText size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
            Select a case from the ledger on the left to review forensic analysis and record official remarks.
          </div>
        )}
      </div>
    </div>
  )
}

export default CaseManagement
