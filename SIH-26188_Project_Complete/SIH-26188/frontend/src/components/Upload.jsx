import React, { useState, useEffect, useRef } from 'react'
import {
  Upload,
  Camera,
  FileText,
  Shield,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  RotateCcw,
  User,
  ArrowRight,
  ArrowLeft,
  HelpCircle,
  Zap,
  Sparkles,
  FileCheck,
  Check
} from 'lucide-react'

const API_URL = '/api'

const DOC_TYPES = [
  {
    value: 'nepal_citizenship',
    label: 'Nepalese Citizenship Certificate',
    country: 'Nepal (🇳🇵)',
    desc: 'Validates 77 official districts, 10-digit format & Bikram Sambat date rules.'
  },
  {
    value: 'bhutan_cid',
    label: 'Bhutanese Citizen Identity Card (CID)',
    country: 'Bhutan (🇧🇹)',
    desc: 'Validates 11-digit national CID format & 20 Dzongkhags.'
  },
  {
    value: 'indian_epic',
    label: 'Indian Voter ID Card (EPIC)',
    country: 'India (🇮🇳)',
    desc: 'Validates standard 3-letter + 7-digit Electoral Photo ID format.'
  },
  {
    value: 'indian_passport',
    label: 'Indian Passport',
    country: 'India (🇮🇳)',
    desc: 'Validates 8-character alphanumeric format & expiry validity.'
  },
  {
    value: 'foreign_passport',
    label: 'Foreign Passport + Indian Visa',
    country: 'International (🌍)',
    desc: 'Validates passport data and Indian entry visa endorsement.'
  },
  {
    value: 'bangladesh_nid',
    label: 'Bangladesh National Identity Card (NID)',
    country: 'Bangladesh (🇧🇩)',
    desc: 'Validates Smart NID (10-digit) or Legacy NID (13/17-digit) with DOB cross-check.'
  },
]


const QUICK_PRESETS = [
  {
    title: 'Clean Nepal Citizenship',
    folder: 'nepal',
    file: 'nepal_citizenship_clean_1.png',
    docType: 'nepal_citizenship',
    flag: '🇳🇵',
    isTampered: false
  },
  {
    title: 'Tampered Nepal (Dist. 88)',
    folder: 'nepal',
    file: 'nepal_citizenship_tampered_3.png',
    docType: 'nepal_citizenship',
    flag: '🇳🇵',
    isTampered: true
  },
  {
    title: 'Clean Bhutan CID',
    folder: 'bhutan',
    file: 'bhutan_cid_clean_1.png',
    docType: 'bhutan_cid',
    flag: '🇧🇹',
    isTampered: false
  },
  {
    title: 'Clean Indian Voter ID',
    folder: 'india_epic',
    file: 'india_epic_clean_1.png',
    docType: 'indian_epic',
    flag: '🇮🇳',
    isTampered: false
  },
  {
    title: 'Clean Indian Passport',
    folder: 'india_passport',
    file: 'india_passport_clean_1.png',
    docType: 'indian_passport',
    flag: '🇮🇳',
    isTampered: false
  },
  {
    title: 'Clean Foreign Passport',
    folder: 'foreign',
    file: 'foreign_passport_visa_clean_1.png',
    docType: 'foreign_passport',
    flag: '🌍',
    isTampered: false
  },
]

function UploadScreen({ onResult }) {
  // Step State: 1 = Document Intake, 2 = Bio Verification, 3 = Review & Submit
  const [currentStep, setCurrentStep] = useState(1)

  // Step 1: Document State
  const [docType, setDocType] = useState('nepal_citizenship')
  const [docFile, setDocFile] = useState(null)
  const [docPreviewUrl, setDocPreviewUrl] = useState(null)
  const [isDraggingDoc, setIsDraggingDoc] = useState(false)
  const [loadingPreset, setLoadingPreset] = useState(false)
  const [loadedPresetName, setLoadedPresetName] = useState(null)

  // Step 2: Biometric Face State
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const [faceFile, setFaceFile] = useState(null)
  const [facePreviewUrl, setFacePreviewUrl] = useState(null)

  // General State
  const [loading, setLoading] = useState(false)
  const [globalError, setGlobalError] = useState(null)

  // Refs
  const docInputRef  = useRef(null)
  const faceInputRef = useRef(null)
  const videoRef     = useRef(null)
  const streamRef    = useRef(null)
  // doc-scan webcam
  const docVideoRef  = useRef(null)
  const docStreamRef = useRef(null)
  const [docCamActive, setDocCamActive]   = useState(false)
  const [docCamError,  setDocCamError]    = useState(null)

  // Effect to attach camera stream whenever cameraActive changes or video element mounts
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(e => {
        console.warn('Video play error:', e)
      })
    }
  }, [cameraActive])

  // Cleanup media streams and object URLs on unmount
  useEffect(() => {
    return () => {
      stopCameraStream()
      // stop doc cam
      if (docStreamRef.current) {
        docStreamRef.current.getTracks().forEach(t => { try { t.stop() } catch {} })
        docStreamRef.current = null
      }
      if (docPreviewUrl) URL.revokeObjectURL(docPreviewUrl)
      if (facePreviewUrl) URL.revokeObjectURL(facePreviewUrl)
    }
  }, [])

  // ================= LOAD SAMPLE PRESET DOCUMENT =================
  const loadPresetDocument = async (preset) => {
    try {
      setLoadingPreset(true)
      setGlobalError(null)

      const url = `${API_URL}/samples/file?folder=${preset.folder}&file=${preset.file}`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to load sample document image from server')
      }

      const blob = await response.blob()
      const file = new File([blob], preset.file, { type: blob.type || 'image/png' })

      if (docPreviewUrl) URL.revokeObjectURL(docPreviewUrl)
      setDocFile(file)
      setDocType(preset.docType)
      setDocPreviewUrl(URL.createObjectURL(file))
      setLoadedPresetName(preset.title)
    } catch (err) {
      setGlobalError(`Failed to load preset: ${err.message}`)
    } finally {
      setLoadingPreset(false)
    }
  }

  // Load sample selfie for biometric testing
  const loadSampleSelfie = async (faceIndex = 1) => {
    try {
      setGlobalError(null)
      const filename = faceIndex === 1 ? 'face1.jpg' : 'face2.jpg'
      const url = `${API_URL}/samples/file?file=${filename}`
      const response = await fetch(url)
      if (!response.ok) throw new Error('Sample selfie not found')

      const blob = await response.blob()
      const file = new File([blob], filename, { type: 'image/jpeg' })

      if (facePreviewUrl) URL.revokeObjectURL(facePreviewUrl)
      setFaceFile(file)
      setFacePreviewUrl(URL.createObjectURL(file))
      stopCameraStream()
      setCurrentStep(3)
    } catch (err) {
      setCameraError('Unable to load sample portrait file.')
    }
  }

  // ================= CAMERA STREAM MANAGEMENT =================
  const startCamera = async () => {
    setCameraError(null)
    setGlobalError(null)
    stopCameraStream()

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser or requires a secure context (http://localhost:3000 or HTTPS).')
      }

      let stream = null
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        })
      } catch (specErr) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        })
      }

      streamRef.current = stream
      setCameraActive(true)
    } catch (err) {
      stopCameraStream()
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera access was blocked by browser permissions. Please click the lock/camera icon in your URL address bar to allow camera access, or use "Upload Photo".')
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No webcam or camera device was found on this system. Please use "Upload Photo".')
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError('Camera is already in use by another application. Please close other camera apps.')
      } else {
        setCameraError(err.message || 'Could not initialize camera. Please select "Upload Photo" instead.')
      }
    }
  }

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop()
        } catch (e) {
          // ignore
        }
      })
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current) return
    const video = videoRef.current

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(blob => {
      if (blob) {
        const file = new File([blob], `applicant_face_capture_${Date.now()}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now()
        })

        if (facePreviewUrl) URL.revokeObjectURL(facePreviewUrl)
        setFaceFile(file)
        setFacePreviewUrl(URL.createObjectURL(file))
        stopCameraStream()
        setCurrentStep(3)
      }
    }, 'image/jpeg', 0.95)
  }

  // ================= DOC-SCAN WEBCAM =================
  const startDocCamera = async () => {
    setDocCamError(null)
    if (docStreamRef.current) {
      docStreamRef.current.getTracks().forEach(t => { try { t.stop() } catch {} })
      docStreamRef.current = null
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
      docStreamRef.current = stream
      setDocCamActive(true)
      setTimeout(() => {
        if (docVideoRef.current) { docVideoRef.current.srcObject = stream; docVideoRef.current.play().catch(() => {}) }
      }, 100)
    } catch (err) {
      setDocCamError(err.message || 'Camera unavailable')
    }
  }

  const stopDocCamera = () => {
    if (docStreamRef.current) { docStreamRef.current.getTracks().forEach(t => { try { t.stop() } catch {} }); docStreamRef.current = null }
    if (docVideoRef.current) docVideoRef.current.srcObject = null
    setDocCamActive(false)
  }

  const captureDocPhoto = () => {
    if (!docVideoRef.current) return
    const v = docVideoRef.current
    const c = document.createElement('canvas')
    c.width = v.videoWidth || 1280; c.height = v.videoHeight || 720
    c.getContext('2d').drawImage(v, 0, 0, c.width, c.height)
    c.toBlob(blob => {
      if (blob) {
        const f = new File([blob], `doc_scan_${Date.now()}.jpg`, { type: 'image/jpeg' })
        if (docPreviewUrl) URL.revokeObjectURL(docPreviewUrl)
        setDocFile(f); setDocPreviewUrl(URL.createObjectURL(f)); setLoadedPresetName('Webcam Capture')
        stopDocCamera()
      }
    }, 'image/jpeg', 0.96)
  }

  // ================= FILE HANDLERS =================
  const handleDocFileSelect = (file) => {
    if (!file) return
    if (!/\.(png|jpg|jpeg|webp|bmp|tiff)$/i.test(file.name)) {
      setGlobalError('Please select a valid image file (PNG, JPG, JPEG, WEBP).')
      return
    }

    if (docPreviewUrl) URL.revokeObjectURL(docPreviewUrl)
    setDocFile(file)
    setDocPreviewUrl(URL.createObjectURL(file))
    setLoadedPresetName(null)
    setGlobalError(null)
  }

  const handleFaceFileSelect = (file) => {
    if (!file) return
    if (!/\.(png|jpg|jpeg|webp|bmp)$/i.test(file.name)) {
      setCameraError('Please select a valid photo file (PNG, JPG, JPEG).')
      return
    }

    if (facePreviewUrl) URL.revokeObjectURL(facePreviewUrl)
    setFaceFile(file)
    setFacePreviewUrl(URL.createObjectURL(file))
    setCameraError(null)
    stopCameraStream()
    setCurrentStep(3)
  }

  const handleRetakeFace = () => {
    if (facePreviewUrl) URL.revokeObjectURL(facePreviewUrl)
    setFaceFile(null)
    setFacePreviewUrl(null)
    stopCameraStream()
    setCurrentStep(2)
  }

  const handleSkipFace = () => {
    if (facePreviewUrl) URL.revokeObjectURL(facePreviewUrl)
    setFaceFile(null)
    setFacePreviewUrl(null)
    stopCameraStream()
    setCurrentStep(3)
  }

  // ================= SUBMIT TO VERIFICATION API =================
  const handleExecuteVerification = async () => {
    if (!docFile) {
      setGlobalError('Document file is missing. Please return to Step 1 and provide a document scan.')
      setCurrentStep(1)
      return
    }

    setLoading(true)
    setGlobalError(null)

    try {
      const formData = new FormData()
      formData.append('document', docFile)
      formData.append('document_type', docType)
      if (faceFile) {
        formData.append('selfie', faceFile)
      }

      const response = await fetch(`${API_URL}/screen`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (!data.success) {
        setGlobalError(data.error || 'Document verification analysis failed.')
      } else {
        onResult(data)
      }
    } catch (err) {
      setGlobalError('Network Error: Unable to connect to the backend verification server at http://localhost:5000.')
    } finally {
      setLoading(false)
    }
  }

  const selectedDoc = DOC_TYPES.find(d => d.value === docType)

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '2px' }}>
          Document Intake & Biometric Authentication
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Official border checkpoint intake terminal. Submit identity documents and applicant portrait for forensic cross-matching.
        </p>
      </div>

      {/* 4-Step Progress Indicator (Clickable to Navigate Completed Steps) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#ffffff',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '12px 24px',
        marginBottom: '22px',
        boxShadow: 'var(--shadow-card)'
      }}>
        {[
          { num: 1, label: 'Document Intake' },
          { num: 2, label: 'Bio Verification' },
          { num: 3, label: 'Review & Confirm' },
          { num: 4, label: 'Analysis & Report' }
        ].map((step, idx) => {
          const isActive = currentStep === step.num
          const isCompleted = currentStep > step.num
          const isClickable = isCompleted || (step.num === 1) || (step.num === 2 && docFile)
          return (
            <div
              key={step.num}
              onClick={() => {
                if (isClickable) {
                  stopCameraStream()
                  setCurrentStep(step.num)
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: isClickable ? 'pointer' : 'default',
                opacity: !isClickable && !isActive ? 0.6 : 1,
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: isCompleted ? '#059669' : isActive ? '#1e40af' : '#f1f5f9',
                color: isCompleted || isActive ? '#ffffff' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
                fontWeight: 700,
                border: isActive ? '2px solid #93c5fd' : '1px solid #e2e8f0',
                boxShadow: isActive ? '0 0 0 3px rgba(37, 99, 235, 0.2)' : 'none',
                transition: 'all 0.2s ease'
              }}>
                {isCompleted ? <CheckCircle2 size={18} /> : step.num}
              </div>
              <div>
                <div style={{
                  fontSize: '0.8125rem',
                  fontWeight: isActive ? 700 : 600,
                  color: isActive ? '#0f172a' : isCompleted ? '#059669' : '#64748b'
                }}>
                  {step.label}
                </div>
              </div>
              {idx < 3 && (
                <div style={{
                  width: '40px',
                  height: '2px',
                  background: isCompleted ? '#059669' : '#e2e8f0',
                  margin: '0 8px'
                }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Global Error Callout */}
      {globalError && (
        <div style={{
          background: 'var(--status-red-bg)',
          border: '1.5px solid var(--status-red-border)',
          color: 'var(--status-red-text)',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          fontSize: '0.85rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertCircle size={18} flexShrink={0} />
          <div>{globalError}</div>
        </div>
      )}

      {/* STEP 1: DOCUMENT INTAKE */}
      {currentStep === 1 && (
        <div>
          {/* Quick Demo Test Presets Toolbar */}
          <div className="panel panel-interactive" style={{ marginBottom: '20px', padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--navy-primary)' }}>
                <Sparkles size={16} color="var(--navy-light)" /> 1-Click Demo Document Presets
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Select any test case to instantly load sample file & rules
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {QUICK_PRESETS.map((preset) => {
                const isSelected = loadedPresetName === preset.title
                return (
                  <button
                    key={preset.title}
                    type="button"
                    onClick={() => loadPresetDocument(preset)}
                    disabled={loadingPreset}
                    className={`preset-chip ${preset.isTampered ? 'tampered' : ''}`}
                    style={{
                      background: isSelected ? (preset.isTampered ? '#fee2e2' : '#eff6ff') : '#ffffff',
                      borderColor: isSelected ? (preset.isTampered ? '#dc2626' : '#2563eb') : 'var(--border-medium)',
                      color: isSelected ? (preset.isTampered ? '#991b1b' : '#1e40af') : 'var(--text-secondary)'
                    }}
                  >
                    <span>{preset.flag}</span>
                    <span>{preset.title}</span>
                    {preset.isTampered && (
                      <span className="badge badge-red" style={{ padding: '1px 5px', fontSize: '0.65rem' }}>Tampered</span>
                    )}
                    {isSelected && <Check size={14} color={preset.isTampered ? '#dc2626' : '#2563eb'} />}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="layout-2col">
            {/* Document Upload Form */}
            <div className="panel panel-interactive">
              <div className="panel-header">
                <h3 className="panel-title">
                  <FileText size={18} color="var(--navy-light)" /> Step 1 — Document Intake
                </h3>
                <span className="badge badge-green">Required</span>
              </div>

              {/* Document Type Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">
                  Identity Document Category <span style={{ color: 'var(--rose-accent)' }}>*</span>
                </label>
                <select
                  value={docType}
                  onChange={(e) => {
                    setDocType(e.target.value)
                    setLoadedPresetName(null)
                  }}
                  className="form-select"
                >
                  {DOC_TYPES.map(t => (
                    <option key={t.value} value={t.value}>
                      {t.country} — {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Document Dropzone & Preview */}
              <div style={{ marginBottom: '24px' }}>
                <label className="form-label">
                  Document Scan / Clear Photograph <span style={{ color: 'var(--rose-accent)' }}>*</span>
                </label>

                {docPreviewUrl ? (
                  <div style={{
                    background: '#f8fafc',
                    border: '1.5px solid #059669',
                    borderRadius: 'var(--radius-md)',
                    padding: '18px',
                    textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.08)'
                  }}>
                    <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
                      <img
                        src={docPreviewUrl}
                        alt="Selected document"
                        style={{
                          maxHeight: '220px',
                          maxWidth: '100%',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid #cbd5e1',
                          display: 'block',
                          margin: '0 auto',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (docPreviewUrl) URL.revokeObjectURL(docPreviewUrl)
                          setDocFile(null)
                          setDocPreviewUrl(null)
                          setLoadedPresetName(null)
                        }}
                        title="Remove document"
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          background: 'var(--rose-accent)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <p style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--status-green-text)', fontWeight: 700 }}>
                      ✓ Document Loaded: {docFile?.name} ({(docFile?.size / 1024).toFixed(0)} KB)
                    </p>
                  </div>
                ) : docCamActive ? (
                  <div style={{ border: '2px solid #3b82f6', borderRadius: '10px', overflow: 'hidden', background: '#000', position: 'relative' }}>
                    <video ref={docVideoRef} autoPlay playsInline muted style={{ width: '100%', maxHeight: '280px', display: 'block', objectFit: 'cover' }}/>
                    <div style={{ display: 'flex', gap: '10px', padding: '10px', background: 'rgba(0,0,0,0.7)', position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                      <button type="button" onClick={captureDocPhoto} className="btn-primary" style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }}>
                        📸 Capture Document
                      </button>
                      <button type="button" onClick={stopDocCamera} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem', color: '#fff', borderColor: '#fff', background: 'transparent' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div
                      onClick={() => docInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingDoc(true) }}
                      onDragLeave={(e) => { e.preventDefault(); setIsDraggingDoc(false) }}
                      onDrop={(e) => {
                        e.preventDefault()
                        setIsDraggingDoc(false)
                        handleDocFileSelect(e.dataTransfer.files?.[0])
                      }}
                      className={`upload-box ${isDraggingDoc ? 'dragging' : ''}`}
                    >
                      <Upload size={38} color="#64748b" style={{ margin: '0 auto 10px' }} />
                      <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        Click to select document image or drag &amp; drop file
                      </p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Supports PNG, JPG, JPEG, WEBP up to 16 MB
                      </p>
                      <input
                        ref={docInputRef}
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp,.bmp,.tiff"
                        onChange={(e) => handleDocFileSelect(e.target.files?.[0])}
                        style={{ display: 'none' }}
                      />
                    </div>
                    <button type="button" onClick={startDocCamera}
                      style={{ marginTop: '10px', width: '100%', padding: '9px', borderRadius: '8px', border: '1.5px dashed #3b82f6', background: '#eff6ff', color: '#1d4ed8', fontWeight: 700, fontSize: '0.83rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <Camera size={15}/> Scan Document via Webcam
                    </button>
                    {docCamError && <p style={{ marginTop: '6px', fontSize: '0.78rem', color: '#dc2626', fontWeight: 600 }}>⚠ {docCamError}</p>}
                  </div>
                )}
              </div>

              {/* Advance Button */}
              <button
                onClick={() => {
                  if (!docFile) {
                    setGlobalError('Please select or upload a document before proceeding.')
                    return
                  }
                  setGlobalError(null)
                  setCurrentStep(2)
                }}
                disabled={!docFile}
                className="btn-primary"
                style={{ width: '100%', padding: '13px', fontSize: '0.95rem' }}
              >
                Continue to Bio Verification <ArrowRight size={16} />
              </button>
            </div>

            {/* Right Column: Specification Guide */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="panel panel-interactive">
                <div className="panel-header">
                  <h3 className="panel-title">
                    <HelpCircle size={18} color="var(--navy-light)" /> Validation Standard
                  </h3>
                  <span className="badge badge-green">Active Rules</span>
                </div>
                <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                    {selectedDoc?.label}
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: '#334155', lineHeight: 1.45 }}>
                    {selectedDoc?.desc}
                  </p>
                </div>

                <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.5 }}>
                  <strong>Intake Guidelines:</strong>
                  <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
                    <li>Ensure the entire document border is visible with no clipping.</li>
                    <li>Text and photo regions must be sharp and free of surface reflection.</li>
                    <li>MRZ lines (for passports) must be completely unobstructed.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: BIO VERIFICATION (USE CAMERA OR UPLOAD PHOTO) */}
      {currentStep === 2 && (
        <div className="panel panel-interactive" style={{ maxWidth: '820px', margin: '0 auto' }}>
          <div className="panel-header">
            <h3 className="panel-title">
              <User size={18} color="var(--navy-light)" /> Step 2 — Biometric Identity Verification
            </h3>
            <span className="badge badge-yellow">Biometric Match</span>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
              Capture Applicant Face for 1:1 Identity Cross-Matching
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Choose your preferred method to provide the live portrait photo for DeepFace verification against the document photo.
            </p>
          </div>

          {/* Camera Error Message */}
          {cameraError && (
            <div style={{
              background: '#fef2f2',
              border: '1.5px solid #fca5a5',
              color: '#991b1b',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <AlertCircle size={18} flexShrink={0} />
              <div>{cameraError}</div>
            </div>
          )}

          {/* Live Camera View */}
          {cameraActive ? (
            <div style={{
              background: '#0f172a',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              textAlign: 'center',
              border: '2px solid #2563eb',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              marginBottom: '20px'
            }}>
              <div style={{ position: 'relative', display: 'inline-block', width: '100%', maxWidth: '540px', overflow: 'hidden', borderRadius: 'var(--radius-md)' }}>
                <video
                  ref={(el) => {
                    videoRef.current = el
                    if (el && streamRef.current && el.srcObject !== streamRef.current) {
                      el.srcObject = streamRef.current
                      el.play().catch(e => console.warn('Play error:', e))
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    maxHeight: '340px',
                    background: '#000000',
                    transform: 'scaleX(-1)',
                    objectFit: 'contain'
                  }}
                />

                {/* Face Positioning Oval Guide with Scanline Laser Effect */}
                <div style={{
                  position: 'absolute',
                  top: '10%',
                  left: '26%',
                  right: '26%',
                  bottom: '10%',
                  border: '2.5px dashed #3b82f6',
                  borderRadius: '50%',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textShadow: '0 1px 4px rgba(0,0,0,0.9)',
                  background: 'rgba(59, 130, 246, 0.08)',
                  overflow: 'hidden'
                }}>
                  <div className="scan-laser" />
                  Align Face Inside Oval
                </div>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="btn-primary"
                  style={{ padding: '10px 24px', fontSize: '0.95rem', background: '#059669' }}
                >
                  <Camera size={18} /> Capture Photo
                </button>
                <button
                  type="button"
                  onClick={stopCameraStream}
                  className="btn-secondary"
                  style={{ padding: '10px 18px', fontSize: '0.9rem' }}
                >
                  Cancel Camera
                </button>
              </div>
            </div>
          ) : (
            /* Choice Cards: USE CAMERA vs UPLOAD PHOTO vs DEMO SAMPLE */
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '18px',
              marginBottom: '24px'
            }}>
              {/* Option 1: Use Camera Card */}
              <div
                onClick={startCamera}
                className="stat-card"
                style={{ textAlign: 'center', padding: '28px 18px' }}
              >
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: '#dbeafe',
                  color: '#1e40af',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px'
                }}>
                  <Camera size={26} />
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                  USE CAMERA
                </h4>
                <p style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4, marginBottom: '14px' }}>
                  Open webcam directly to take a live selfie with positioning guide.
                </p>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: '100%', padding: '9px', fontSize: '0.85rem' }}
                >
                  Open Camera
                </button>
              </div>

              {/* Option 2: Upload Photo Card */}
              <div
                onClick={() => faceInputRef.current?.click()}
                className="stat-card"
                style={{ textAlign: 'center', padding: '28px 18px' }}
              >
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: '#f1f5f9',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px'
                }}>
                  <Upload size={26} />
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                  UPLOAD PHOTO
                </h4>
                <p style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4, marginBottom: '14px' }}>
                  Select an existing portrait image file from your device (JPG, PNG).
                </p>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ width: '100%', padding: '9px', fontSize: '0.85rem' }}
                >
                  Browse Photo
                </button>
                <input
                  ref={faceInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,.bmp"
                  onChange={(e) => handleFaceFileSelect(e.target.files?.[0])}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Option 3: Quick Demo Face Preset */}
              <div
                onClick={() => loadSampleSelfie(1)}
                className="stat-card"
                style={{ textAlign: 'center', padding: '28px 18px', background: '#f8faff' }}
              >
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: '#e0e7ff',
                  color: '#4338ca',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px'
                }}>
                  <Sparkles size={26} />
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                  DEMO PORTRAIT
                </h4>
                <p style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4, marginBottom: '14px' }}>
                  Load 1-click test selfie for quick biometric matching evaluation.
                </p>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ width: '100%', padding: '9px', fontSize: '0.85rem', borderColor: '#c7d2fe' }}
                >
                  Load Demo Face
                </button>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <button
              type="button"
              onClick={() => {
                stopCameraStream()
                setCurrentStep(1)
              }}
              className="btn-secondary"
            >
              <ArrowLeft size={16} /> Back to Document Intake
            </button>

            <button
              type="button"
              onClick={handleSkipFace}
              className="btn-ghost"
              style={{ fontSize: '0.85rem' }}
            >
              Skip Face Verification & Continue &rarr;
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: IMAGE REVIEW & CONFIRMATION */}
      {currentStep === 3 && (
        <div className="panel panel-interactive" style={{ maxWidth: '860px', margin: '0 auto' }}>
          <div className="panel-header">
            <h3 className="panel-title">
              <Shield size={18} color="var(--navy-light)" /> Step 3 — Review & Execute Verification
            </h3>
            <span className="badge badge-green">Ready to Screen</span>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
              Confirm Intake Assets
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Review the selected identity document and applicant portrait before triggering the AI forensic engine.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            marginBottom: '24px'
          }}>
            {/* Document Review Card */}
            <div style={{
              background: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: 'var(--radius-lg)',
              padding: '18px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-card)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase' }}>
                  1. Document Asset
                </span>
                <span className="badge badge-green">Loaded</span>
              </div>
              <img
                src={docPreviewUrl}
                alt="Document preview"
                style={{
                  maxHeight: '170px',
                  maxWidth: '100%',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid #cbd5e1',
                  display: 'block',
                  margin: '0 auto 10px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                }}
              />
              <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#0f172a' }}>
                {selectedDoc?.label}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '10px' }}>
                {docFile?.name} ({(docFile?.size / 1024).toFixed(0)} KB)
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="btn-secondary"
                style={{ padding: '5px 14px', fontSize: '0.78rem' }}
              >
                <RotateCcw size={13} /> Change Document
              </button>
            </div>

            {/* Face Portrait Review Card */}
            <div style={{
              background: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: 'var(--radius-lg)',
              padding: '18px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-card)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase' }}>
                  2. Biometric Portrait
                </span>
                <span className={`badge ${faceFile ? 'badge-green' : 'badge-yellow'}`}>
                  {faceFile ? 'Attached' : 'Skipped'}
                </span>
              </div>

              {facePreviewUrl ? (
                <>
                  <img
                    src={facePreviewUrl}
                    alt="Applicant portrait"
                    style={{
                      maxHeight: '170px',
                      maxWidth: '100%',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid #cbd5e1',
                      display: 'block',
                      margin: '0 auto 10px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                    }}
                  />
                  <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#059669' }}>
                    ✓ 1:1 Facial Cross-Matching Enabled
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '10px' }}>
                    {faceFile?.name} ({(faceFile?.size / 1024).toFixed(0)} KB)
                  </div>
                  <button
                    type="button"
                    onClick={handleRetakeFace}
                    className="btn-secondary"
                    style={{ padding: '5px 14px', fontSize: '0.78rem' }}
                  >
                    <RotateCcw size={13} /> Retake / Change Face Photo
                  </button>
                </>
              ) : (
                <div style={{ padding: '32px 10px' }}>
                  <User size={38} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    No Face Photo Attached
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '14px' }}>
                    Face verification will be bypassed.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="btn-secondary"
                    style={{ padding: '7px 16px', fontSize: '0.825rem' }}
                  >
                    Add Live Face Photo
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Trigger Button */}
          <button
            onClick={handleExecuteVerification}
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: 700 }}
          >
            {loading ? (
              <>
                <RefreshCw size={18} className="animate-spin" /> Running Forensic OCR, ELA Tampering & Facial Match...
              </>
            ) : (
              <>
                <Shield size={18} /> Execute Forensic Screening & Validation
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

export default UploadScreen
