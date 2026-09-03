import React, { useEffect, useState } from 'react'
import {
  History as HistoryIcon,
  RefreshCw,
  FileDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileText,
  Search,
  Eye,
  X,
  Shield,
  Clock,
  Calendar,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Printer
} from 'lucide-react'

const API_URL = '/api'

function HistoryScreen() {
  const [history, setHistory] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [limit, setLimit] = useState(10)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterLevel, setFilterLevel] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [inspectItem, setInspectItem] = useState(null)

  const fetchHistory = async (pageNum = 1) => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`${API_URL}/history?page=${pageNum}&limit=${limit}`)
      if (!res.ok) {
        throw new Error('Failed to load history')
      }

      const data = await res.json()
      if (data.success) {
        setHistory(data.data || [])
        setPage(data.page || 1)
        setTotalPages(data.total_pages || 1)
        setTotalRecords(data.total_records || 0)
      } else {
        setError(data.error || 'Failed to retrieve history logs')
      }
    } catch (err) {
      setError('Unable to reach history database. Verify backend server is active.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory(page)
  }, [page, limit])

  const downloadReport = (item) => {
    if (!item) return
    const filename = typeof item === 'string' ? item : (item.report_filename || '')
    const id = item.id || ''
    const caseId = item.case_id || ''
    window.open(`${API_URL}/report?id=${id}&case_id=${encodeURIComponent(caseId)}&path=${encodeURIComponent(filename)}`, '_blank', 'noopener,noreferrer')
  }

  // Export CSV
  const exportHistoryCSV = () => {
    if (!history || history.length === 0) return
    const headers = ['Case ID', 'Audit Seq', 'Timestamp', 'Subject Name', 'Document Type', 'Risk Score', 'Risk Level', 'Validation', 'Tampering (ELA)', 'Face Match', 'Action']
    const rows = history.map(r => [
      r.case_id || `CASE-${10240 + r.id}`,
      r.id,
      r.timestamp,
      `"${(r.holder_name || 'ANURAG GAMPA').replace(/"/g, '""')}"`,
      `"${(r.document_type || '').replace(/"/g, '""')}"`,
      r.risk_score,
      r.risk_level,
      r.validation_status,
      r.tampering_detected ? 'DETECTED' : 'CLEAN',
      r.face_verified ? 'VERIFIED' : 'SKIPPED',
      `"${(r.risk_action || '').replace(/"/g, '""')}"`
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `SSB_Audit_Ledger_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredHistory = history.filter(item => {
    const matchesFilter = filterLevel === 'ALL' || item.risk_level === filterLevel
    const matchesSearch = 
      (item.document_type && item.document_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.risk_action && item.risk_action.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.case_id && item.case_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.holder_name && item.holder_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      String(item.id).includes(searchTerm)
    return matchesFilter && matchesSearch
  })

  const formatDocType = (name) => {
    if (!name) return 'Unknown'
    const map = {
      'nepal_citizenship': 'Nepal Citizenship',
      'bhutan_cid': 'Bhutan CID Card',
      'indian_epic': 'Indian Voter ID (EPIC)',
      'indian_passport': 'Indian Passport',
      'foreign_passport': 'Foreign Passport + Visa',
      'bangladesh_nid': 'Bangladesh NID'
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
            Checkpoint Audit & Screening Ledger
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Official digital register of processed border credentials. Total verified entries: <strong>{totalRecords}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={exportHistoryCSV}
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
            title="Download CSV log (current page)"
          >
            <FileDown size={14} /> Export CSV (Page)
          </button>

          <a
            href={`${API_URL}/export/screenings`}
            download="screenings_export.csv"
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: 'inherit' }}
            title="Download full screening database as CSV"
          >
            <FileDown size={14} /> Export All (Full DB)
          </a>

          <button
            onClick={() => fetchHistory(page)}
            disabled={loading}
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Sync Records
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          background: 'var(--status-red-bg)',
          color: 'var(--status-red-text)',
          border: '1.5px solid var(--status-red-border)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          marginBottom: '20px',
          fontSize: '0.85rem',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={18} />
          <div>{error}</div>
        </div>
      )}

      {/* Main Table Panel */}
      <div className="panel panel-interactive">
        <div className="panel-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Filter by Status:</span>
            {/* Risk Filter */}
            <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0' }}>
              {['ALL', 'GREEN', 'YELLOW', 'RED'].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setFilterLevel(lvl)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: filterLevel === lvl ? '#1e40af' : 'transparent',
                    color: filterLevel === lvl ? '#ffffff' : '#64748b',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {lvl === 'GREEN' ? 'LOW' : lvl === 'YELLOW' ? 'MEDIUM' : lvl === 'RED' ? 'HIGH' : 'ALL'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search Case ID, name, doc type..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
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

            {/* Page Limit Selector */}
            <select
              value={limit}
              onChange={e => setLimit(Number(e.target.value))}
              style={{
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                background: '#ffffff',
                border: '1.5px solid var(--border-medium)',
                color: '#0f172a',
                fontSize: '0.8rem',
                outline: 'none'
              }}
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
            <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px' }} />
            Loading screening ledger...
          </div>
        ) : filteredHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
            No audit records found matching your filter criteria.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Case Identifier</th>
                  <th>Timestamp</th>
                  <th>Subject Name</th>
                  <th>Document Type</th>
                  <th>Validation</th>
                  <th>Tampering (ELA)</th>
                  <th>Face Match</th>
                  <th>Risk Score</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Official Report</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item) => (
                  <tr key={item.id} onClick={() => setInspectItem(item)}>
                    <td className="font-mono" style={{ fontWeight: 800, color: '#1e40af' }}>
                      {item.case_id || `CASE-${10240 + item.id}`}
                    </td>
                    <td className="font-mono" style={{ fontSize: '0.825rem', color: '#334155', fontWeight: 600 }}>
                      {item.timestamp ? item.timestamp.replace('T', ' ').substring(0, 19) : '—'}
                    </td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>
                      {item.holder_name || 'ANURAG GAMPA'}
                    </td>
                    <td style={{ color: '#334155', fontWeight: 600 }}>
                      {formatDocType(item.document_type)}
                    </td>
                    <td>
                      <span className={`badge ${item.validation_status === 'VALID' ? 'badge-green' : item.validation_status === 'INVALID' ? 'badge-red' : 'badge-yellow'}`}>
                        {item.validation_status || 'UNKNOWN'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${item.tampering_detected ? 'badge-red' : 'badge-green'}`}>
                        {item.tampering_detected ? 'DETECTED' : 'CLEAN'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${item.face_verified ? 'badge-green' : 'badge-yellow'}`}>
                        {item.face_verified ? 'VERIFIED' : 'SKIPPED'}
                      </span>
                    </td>
                    <td className="font-mono" style={{ fontWeight: 800 }}>
                      <span style={{
                        color: item.risk_level === 'GREEN' ? '#059669' : item.risk_level === 'YELLOW' ? '#d97706' : '#dc2626'
                      }}>
                        {item.risk_score}/100
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${item.risk_level === 'GREEN' ? 'badge-green' : item.risk_level === 'YELLOW' ? 'badge-yellow' : 'badge-red'}`}>
                        {item.risk_level}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => downloadReport(item)}
                        className="btn-secondary"
                        title="Download Official PDF Certificate"
                        style={{
                          padding: '4px 10px',
                          fontSize: '0.75rem',
                          color: '#1e40af',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          borderColor: '#bfdbfe',
                          background: '#eff6ff'
                        }}
                      >
                        <FileDown size={13} /> PDF Certificate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-subtle)',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>
            Page {page} of {Math.max(totalPages, 1)} ({totalRecords} total entries)
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={page <= 1 || loading}
              className="btn-secondary"
              style={{ padding: '6px 14px', fontSize: '0.85rem' }}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <button
              onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
              disabled={page >= totalPages || loading}
              className="btn-secondary"
              style={{ padding: '6px 14px', fontSize: '0.85rem' }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Forensic Inspection Modal */}
      {inspectItem && (
        <div className="modal-backdrop" onClick={() => setInspectItem(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              background: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className={`badge ${inspectItem.risk_level === 'GREEN' ? 'badge-green' : inspectItem.risk_level === 'YELLOW' ? 'badge-yellow' : 'badge-red'}`}>
                  {inspectItem.risk_level} THREAT
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Case Audit Ledger: {inspectItem.case_id || `CASE-${10240 + inspectItem.id}`}
                </h3>
              </div>
              <button
                onClick={() => setInspectItem(null)}
                className="btn-ghost"
                style={{ padding: '6px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div className="prop-row">
                <span className="prop-label">SUBJECT NAME</span>
                <span className="prop-value">{inspectItem.holder_name || 'ANURAG GAMPA'}</span>
              </div>
              <div className="prop-row">
                <span className="prop-label">DOCUMENT CLASSIFICATION</span>
                <span className="prop-value">{formatDocType(inspectItem.document_type)}</span>
              </div>
              <div className="prop-row">
                <span className="prop-label">SCREENING TIMESTAMP</span>
                <span className="prop-value font-mono">{inspectItem.timestamp ? inspectItem.timestamp.replace('T', ' ') : '—'}</span>
              </div>
              <div className="prop-row">
                <span className="prop-label">BORDER CHECKPOST</span>
                <span className="prop-value">{inspectItem.checkpoint_id || 'ICP-04 Raxaul'}</span>
              </div>
              <div className="prop-row">
                <span className="prop-label">OVERALL RISK SCORE</span>
                <span className="prop-value font-mono" style={{
                  color: inspectItem.risk_level === 'GREEN' ? '#059669' : inspectItem.risk_level === 'YELLOW' ? '#d97706' : '#dc2626',
                  fontWeight: 800
                }}>
                  {inspectItem.risk_score}/100
                </span>
              </div>
              <div className="prop-row">
                <span className="prop-label">DISPOSITION INSTRUCTION</span>
                <span className="prop-value" style={{ color: '#0f172a' }}>{inspectItem.risk_action}</span>
              </div>
              {inspectItem.officer_remarks && (
                <div className="prop-row">
                  <span className="prop-label">OFFICER REMARKS</span>
                  <span className="prop-value">{inspectItem.officer_remarks}</span>
                </div>
              )}

              <div style={{ marginTop: '24px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => downloadReport(inspectItem)}
                  className="btn-primary"
                  style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                >
                  <FileDown size={15} /> Download Official PDF Certificate
                </button>
                <button
                  onClick={() => setInspectItem(null)}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HistoryScreen
