import React, { useState } from 'react'
import {
  Users,
  Shield,
  AlertTriangle,
  FileText,
  CheckCircle2,
  ExternalLink,
  Layers,
  ArrowRight,
  Info,
  Sparkles,
  Search,
  UserX
} from 'lucide-react'

function IdentityGraphView() {
  const [selectedNode, setSelectedNode] = useState('PERSON_X')
  const [activeScenario, setActiveScenario] = useState('ANURAG_GAMPA')

  const scenarioData = {
    'ANURAG_GAMPA': {
      subject: 'Person X (Biometric Cluster #829)',
      confidence: '98.6% Facial Embedding Match',
      flag: 'CRITICAL: Multiple Identity & Name Swapping Detected',
      summary: 'Same biometric face identity detected across 2 distinct passports with mismatched full names and identical date of birth (12/05/2007).',
      nodes: [
        {
          id: 'PERSON_X',
          label: 'Biometric Face Cluster #829',
          sub: 'Live Applicant Portrait',
          type: 'PERSON',
          status: 'ALERT',
          color: '#dc2626',
          x: 280,
          y: 80,
          details: {
            embedding_model: 'DeepFace Facenet512',
            face_quality: '96.2% High Resolution',
            cross_checkpoint_hits: 2
          }
        },
        {
          id: 'PASSPORT_A',
          label: 'Passport A (Current Intake)',
          sub: 'Name: ANURAG GAMPA',
          type: 'DOCUMENT',
          doc_num: 'P9824102',
          dob: '12/05/2007',
          issue_date: '10/01/2022',
          nationality: 'IND',
          status: 'FLAGGED',
          color: '#1e40af',
          x: 120,
          y: 260
        },
        {
          id: 'PASSPORT_B',
          label: 'Passport B (Historical Crossings)',
          sub: 'Name: ANURAG KUMAR',
          type: 'LINKED_DOCUMENT',
          doc_num: 'K8492019',
          dob: '12/05/2007',
          issue_date: '15/04/2021',
          nationality: 'IND',
          status: 'PREVIOUS_ALIAS',
          color: '#d97706',
          x: 440,
          y: 260
        },
        {
          id: 'VISA_C',
          label: 'Entry Visa Endorsement #V8291',
          sub: 'Issued to: ANURAG KUMAR',
          type: 'VISA',
          doc_num: 'V8291039',
          dob: '12/05/2007',
          status: 'ASSOCIATED',
          color: '#059669',
          x: 440,
          y: 400
        }
      ]
    }
  }

  const currentScenario = scenarioData[activeScenario]
  const currentNodeInfo = currentScenario.nodes.find(n => n.id === selectedNode) || currentScenario.nodes[0]

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            ⭐ Identity Graph & Multi-Identity Detection Engine
          </h2>
          <span className="badge badge-yellow">Biometric Entity Resolution</span>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Discovers fraudulent aliases and document swapping by linking facial biometric embeddings and document metadata across checkpoint logs.
        </p>
      </div>

      {/* Threat Alert Banner */}
      <div style={{
        background: '#fff1f2',
        border: '2px solid #f43f5e',
        borderRadius: 'var(--radius-lg)',
        padding: '18px 24px',
        marginBottom: '22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        boxShadow: 'var(--shadow-raised)',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: '#ffe4e6',
            border: '1.5px solid #fecdd3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#e11d48',
            flexShrink: 0
          }}>
            <UserX size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span className="badge badge-red" style={{ fontSize: '0.78rem' }}>
                ⚠️ MULTIPLE IDENTITY DETECTED
              </span>
              <span style={{ fontSize: '0.78rem', color: '#9f1239', fontWeight: 700 }}>
                High Confidence Match (98.6%)
              </span>
            </div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#881337', margin: 0 }}>
              {currentScenario.flag}
            </h4>
            <p style={{ fontSize: '0.825rem', color: '#9f1239', margin: '2px 0 0 0', fontWeight: 500 }}>
              {currentScenario.summary}
            </p>
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          padding: '10px 18px',
          borderRadius: 'var(--radius-md)',
          border: '1.5px solid #fecdd3',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#e11d48', fontFamily: 'var(--font-mono)' }}>
            2 Aliases
          </div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Linked Identity
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive SVG Graph + Entity Inspector */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(340px, 1.4fr) minmax(280px, 1fr)',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Left: SVG Graph Visualization */}
        <div className="panel panel-interactive" style={{ padding: '20px' }}>
          <div className="panel-header" style={{ marginBottom: '12px' }}>
            <h3 className="panel-title">
              <Layers size={18} color="var(--navy-light)" /> Entity Relationship Diagram
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Interactive Node Canvas
            </span>
          </div>

          <div style={{
            background: '#f8fafc',
            border: '1.5px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            position: 'relative'
          }}>
            <svg
              viewBox="0 0 580 470"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            >
              {/* Connecting Lines */}
              {/* Person X to Passport A */}
              <path
                d="M 280,120 L 170,230"
                stroke="#2563eb"
                strokeWidth="2.5"
                strokeDasharray="4 2"
              />
              <rect x="180" y="165" width="105" height="18" rx="4" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1" />
              <text x="186" y="178" fill="#1e40af" fontSize="9.5" fontWeight="700">
                Face Match 98.6%
              </text>

              {/* Person X to Passport B */}
              <path
                d="M 310,120 L 420,230"
                stroke="#d97706"
                strokeWidth="2.5"
                strokeDasharray="4 2"
              />
              <rect x="335" y="165" width="105" height="18" rx="4" fill="#fffbeb" stroke="#fde68a" strokeWidth="1" />
              <text x="341" y="178" fill="#92400e" fontSize="9.5" fontWeight="700">
                Face Match 97.8%
              </text>

              {/* Passport A to Passport B Cross-link */}
              <path
                d="M 230,270 L 370,270"
                stroke="#dc2626"
                strokeWidth="2.5"
              />
              <rect x="255" y="260" width="90" height="20" rx="4" fill="#fef2f2" stroke="#fca5a5" strokeWidth="1.5" />
              <text x="261" y="274" fill="#991b1b" fontSize="9.5" fontWeight="800">
                ⚠️ Shared DOB
              </text>

              {/* Passport B to Visa C */}
              <path
                d="M 440,310 L 440,370"
                stroke="#059669"
                strokeWidth="2"
              />
              <text x="448" y="345" fill="#065f46" fontSize="9" fontWeight="700">
                Visa Linked
              </text>

              {/* Node 1: Person X (Center Top) */}
              <g
                onClick={() => setSelectedNode('PERSON_X')}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx="290"
                  cy="90"
                  r="42"
                  fill="#ffffff"
                  stroke={selectedNode === 'PERSON_X' ? '#dc2626' : '#94a3b8'}
                  strokeWidth={selectedNode === 'PERSON_X' ? '3.5' : '2'}
                  filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))"
                />
                <circle cx="290" cy="90" r="34" fill="#fee2e2" />
                <text x="290" y="85" textAnchor="middle" fill="#991b1b" fontSize="11" fontWeight="800">
                  PERSON X
                </text>
                <text x="290" y="98" textAnchor="middle" fill="#7f1d1d" fontSize="8" fontWeight="600">
                  Biometric Root
                </text>
              </g>

              {/* Node 2: Passport A (Left) */}
              <g
                onClick={() => setSelectedNode('PASSPORT_A')}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x="70"
                  y="230"
                  width="150"
                  height="70"
                  rx="10"
                  fill="#ffffff"
                  stroke={selectedNode === 'PASSPORT_A' ? '#2563eb' : '#cbd5e1'}
                  strokeWidth={selectedNode === 'PASSPORT_A' ? '3' : '1.5'}
                  filter="drop-shadow(0 4px 6px rgba(0,0,0,0.08))"
                />
                <text x="82" y="252" fill="#1e40af" fontSize="11" fontWeight="800">
                  PASSPORT A
                </text>
                <text x="82" y="268" fill="#0f172a" fontSize="10" fontWeight="700">
                  ANURAG GAMPA
                </text>
                <text x="82" y="284" fill="#64748b" fontSize="8.5" fontFamily="monospace">
                  DOB: 12/05/2007 (IND)
                </text>
              </g>

              {/* Node 3: Passport B (Right) */}
              <g
                onClick={() => setSelectedNode('PASSPORT_B')}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x="370"
                  y="230"
                  width="150"
                  height="70"
                  rx="10"
                  fill="#ffffff"
                  stroke={selectedNode === 'PASSPORT_B' ? '#d97706' : '#cbd5e1'}
                  strokeWidth={selectedNode === 'PASSPORT_B' ? '3' : '1.5'}
                  filter="drop-shadow(0 4px 6px rgba(0,0,0,0.08))"
                />
                <text x="382" y="252" fill="#d97706" fontSize="11" fontWeight="800">
                  PASSPORT B (ALIAS)
                </text>
                <text x="382" y="268" fill="#0f172a" fontSize="10" fontWeight="700">
                  ANURAG KUMAR
                </text>
                <text x="382" y="284" fill="#64748b" fontSize="8.5" fontFamily="monospace">
                  DOB: 12/05/2007 (IND)
                </text>
              </g>

              {/* Node 4: Visa C (Bottom Right) */}
              <g
                onClick={() => setSelectedNode('VISA_C')}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x="370"
                  y="380"
                  width="150"
                  height="55"
                  rx="8"
                  fill="#ffffff"
                  stroke={selectedNode === 'VISA_C' ? '#059669' : '#cbd5e1'}
                  strokeWidth={selectedNode === 'VISA_C' ? '3' : '1.5'}
                  filter="drop-shadow(0 2px 4px rgba(0,0,0,0.06))"
                />
                <text x="382" y="402" fill="#059669" fontSize="10.5" fontWeight="800">
                  INDIAN VISA #V8291
                </text>
                <text x="382" y="420" fill="#334155" fontSize="9" fontWeight="600">
                  Endorsed for ANURAG KUMAR
                </text>
              </g>
            </svg>
          </div>

          <div style={{ marginTop: '12px', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
            <span>💡 Click any node on the graph to inspect detailed forensic telemetry and cross-link records.</span>
          </div>
        </div>

        {/* Right: Selected Node Details & Forensic Evidence */}
        <div className="panel panel-interactive" style={{ padding: '22px' }}>
          <div className="panel-header" style={{ marginBottom: '14px' }}>
            <h3 className="panel-title">
              <Shield size={18} color="var(--navy-light)" /> Node Metadata Inspector
            </h3>
            <span className="badge badge-blue">
              {currentNodeInfo.type}
            </span>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
              {currentNodeInfo.label}
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              {currentNodeInfo.sub}
            </p>
          </div>

          {currentNodeInfo.type === 'PERSON' ? (
            <div>
              <div className="prop-row">
                <span className="prop-label">EMBEDDING MODEL</span>
                <span className="prop-value font-mono">Facenet512 (512-dim)</span>
              </div>
              <div className="prop-row">
                <span className="prop-label">MATCH CONFIDENCE</span>
                <span className="prop-value font-mono" style={{ color: '#059669' }}>98.6% Cross-Match</span>
              </div>
              <div className="prop-row">
                <span className="prop-label">DETECTED ALIASES</span>
                <span className="prop-value" style={{ color: '#dc2626' }}>2 Distinct Names</span>
              </div>
              <div className="prop-row">
                <span className="prop-label">HISTORICAL CHECKPOINTS</span>
                <span className="prop-value">ICP Raxaul, ICP Jogbani</span>
              </div>
            </div>
          ) : (
            <div>
              <div className="prop-row">
                <span className="prop-label">DOCUMENT NUMBER</span>
                <span className="prop-value font-mono">{currentNodeInfo.doc_num || 'P9824102'}</span>
              </div>
              <div className="prop-row">
                <span className="prop-label">NAME ON RECORD</span>
                <span className="prop-value">{currentNodeInfo.sub.replace('Name: ', '')}</span>
              </div>
              <div className="prop-row">
                <span className="prop-label">DATE OF BIRTH</span>
                <span className="prop-value font-mono">{currentNodeInfo.dob || '12/05/2007'}</span>
              </div>
              <div className="prop-row">
                <span className="prop-label">NATIONALITY</span>
                <span className="prop-value">IND (India)</span>
              </div>
            </div>
          )}

          {/* Action Callout */}
          <div style={{
            marginTop: '18px',
            padding: '14px',
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: 'var(--radius-md)'
          }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#991b1b', marginBottom: '4px' }}>
              RECOMMENDED OFFICER PROTOCOL
            </div>
            <p style={{ fontSize: '0.78rem', color: '#7f1d1d', lineHeight: 1.45, margin: 0 }}>
              Initiate Section 14 Immigration fraud interrogation. Flag both document series across all SSB Checkpoint terminals nationwide.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IdentityGraphView
