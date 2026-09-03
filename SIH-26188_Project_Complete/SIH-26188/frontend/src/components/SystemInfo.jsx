import React from 'react'
import {
  Shield,
  FileCheck,
  Globe,
  Lock,
  Cpu,
  Layers,
  Fingerprint,
  Zap,
  Server,
  Database
} from 'lucide-react'

function SystemInfo() {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '2px' }}>
          System Architecture & Checkpoint Specifications
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Technical documentation of verification pipelines, format rules, and supported border documents.
        </p>
      </div>

      <div className="layout-2col" style={{ marginBottom: '24px' }}>
        {/* Module Architecture */}
        <div className="panel panel-interactive">
          <div className="panel-header">
            <h3 className="panel-title">
              <Cpu size={18} color="var(--navy-light)" /> Verification Pipeline Modules
            </h3>
            <span className="badge badge-green">Active Pipeline</span>
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            {[
              {
                title: 'OCR Extraction Engine',
                desc: 'Uses Tesseract and EasyOCR to read text fields, names, ID numbers, and dates from document scans.',
                tag: 'OCR Engine'
              },
              {
                title: 'Jurisdiction Rule Validator',
                desc: 'Validates official administrative district lists (e.g. Nepal 77 districts), Bhutan Dzongkhags, and format regex.',
                tag: 'Rule Engine'
              },
              {
                title: 'Tampering & Forensic Detector',
                desc: 'Calculates Error Level Analysis (ELA) compression differentials and checks image metadata consistency.',
                tag: 'Forensics'
              },
              {
                title: 'Facial Biometric Verification',
                desc: 'Extracts document portrait and executes 1:1 facial embedding distance comparison against live applicant selfies.',
                tag: 'Biometrics'
              },
              {
                title: 'Risk Scoring & Adjudication',
                desc: 'Combines validation, tampering, and biometric penalty points into a unified 0-100 score.',
                tag: 'Scoring'
              },
            ].map(m => (
              <div key={m.title} style={{
                padding: '14px 16px',
                background: '#f8fafc',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid #e2e8f0',
                transition: 'all 0.2s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>{m.title}</span>
                  <span style={{ fontSize: '0.72rem', color: '#1e40af', fontWeight: 700, background: '#eff6ff', padding: '2px 8px', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                    {m.tag}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#334155', lineHeight: 1.45 }}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Supported Document Catalog */}
        <div className="panel panel-interactive">
          <div className="panel-header">
            <h3 className="panel-title">
              <Globe size={18} color="var(--navy-light)" /> Supported Border Documents
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Corridor Standards</span>
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            {[
              {
                flag: '🇳🇵',
                name: 'Nepal Citizenship Certificate',
                rules: '77 District code checking, 10-digit number validation, Bikram Sambat date checks.',
                note: 'Detects invalid or fake district IDs (e.g. non-existent District 88) and altered issue dates.'
              },
              {
                flag: '🇧🇹',
                name: 'Bhutan Citizen Identity Card (CID)',
                rules: '11-digit national identity string, 20 Dzongkhag administrative code matching.',
                note: 'Checks digit count and valid district code prefixes.'
              },
              {
                flag: '🇮🇳',
                name: 'Indian Voter ID (EPIC)',
                rules: 'Standard 3-letter + 7-digit Electoral Photo ID format.',
                note: 'Validates character sequence and constituency code structure.'
              },
              {
                flag: '🇮🇳 / 🌍',
                name: 'Indian & Foreign Passports',
                rules: 'Passport data extraction, expiry date validation, and entry visa verification.',
                note: 'Checks validity duration and endorsement compliance.'
              },
            ].map(doc => (
              <div key={doc.name} style={{
                padding: '14px 16px',
                background: '#f8fafc',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid #e2e8f0',
                transition: 'all 0.2s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '1.25rem' }}>{doc.flag}</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>{doc.name}</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#334155', marginBottom: '4px', lineHeight: 1.4 }}>
                  <strong>Rules:</strong> {doc.rules}
                </p>
                <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  <strong>Security Note:</strong> {doc.note}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security Statement */}
      <div className="panel panel-interactive" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Lock size={16} color="#1e40af" />
          <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e40af' }}>
            Audit & Compliance Standard
          </h4>
        </div>
        <p style={{ fontSize: '0.825rem', color: '#1e3a8a', lineHeight: 1.5 }}>
          All verified documents generate a persistent record with penalty breakdowns and on-demand downloadable PDF reports for official record-keeping.
        </p>
      </div>
    </div>
  )
}

export default SystemInfo
