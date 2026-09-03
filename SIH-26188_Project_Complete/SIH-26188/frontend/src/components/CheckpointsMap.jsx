import React, { useState, useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  MapPin,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Users,
  Eye,
  X,
  ExternalLink,
  ChevronRight,
  Filter,
  RefreshCw,
  Layers,
  Compass,
  Maximize2,
  Minimize2,
  Navigation,
  Globe
} from 'lucide-react'

const API_URL = '/api'

function CheckpointsMap({ onSelectCase }) {
  const [checkpoints, setCheckpoints] = useState([])
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filterBorder, setFilterBorder] = useState('ALL')
  const [mapLayer, setMapLayer] = useState('streets') // 'streets' | 'satellite'

  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef({})
  const tileLayerRef = useRef(null)

  const fetchCheckpoints = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/checkpoints`)
      if (res.ok) {
        const data = await res.json()
        const fetched = data.checkpoints || []
        setCheckpoints(fetched)
        if (fetched.length > 0 && !selectedCheckpoint) {
          setSelectedCheckpoint(fetched[0])
        }
      }
    } catch (err) {
      console.error('Failed to load checkpoints', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCheckpoints()
  }, [])

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [26.8, 85.5],
        zoom: 6.5,
        minZoom: 5,
        maxZoom: 16,
        zoomControl: false,
        attributionControl: false
      })

      // Custom Zoom Control at top right
      L.control.zoom({ position: 'topright' }).addTo(map)

      mapInstanceRef.current = map
    }

    const map = mapInstanceRef.current

    // Tile Layer setup
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current)
    }

    if (mapLayer === 'satellite') {
      tileLayerRef.current = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 18
      }).addTo(map)
    } else {
      // CartoDB Voyager: Crisp, realistic modern vector-styled tiles
      tileLayerRef.current = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map)
    }

    return () => {
      // Cleanup if unmounted
    }
  }, [mapLayer])

  // Update Markers whenever checkpoints or filter changes
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || checkpoints.length === 0) return

    // Clear existing markers
    Object.values(markersRef.current).forEach(m => map.removeLayer(m))
    markersRef.current = {}

    const filtered = checkpoints.filter(cp => {
      if (filterBorder === 'ALL') return true
      return cp.border.toLowerCase().includes(filterBorder.toLowerCase())
    })

    filtered.forEach(cp => {
      const isCritical = cp.threat_level === 'CRITICAL'
      const isElevated = cp.threat_level === 'ELEVATED'
      const color = isCritical ? '#dc2626' : isElevated ? '#d97706' : '#059669'
      const bgColor = isCritical ? '#fee2e2' : isElevated ? '#fef3c7' : '#d1fae5'

      const isSelected = selectedCheckpoint?.id === cp.id

      // Custom HTML Marker Element
      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -50%);">
            <div style="
              width: ${isSelected ? '22px' : '16px'};
              height: ${isSelected ? '22px' : '16px'};
              background: ${color};
              border: ${isSelected ? '3px solid #ffffff' : '2px solid #ffffff'};
              border-radius: 50%;
              box-shadow: 0 0 12px ${color}88, 0 3px 6px rgba(0,0,0,0.3);
              transition: all 0.2s ease;
            "></div>
            <div style="
              margin-top: 4px;
              background: #ffffff;
              color: #0f172a;
              font-family: var(--font-sans);
              font-weight: 800;
              font-size: 11px;
              padding: 2px 8px;
              border-radius: 4px;
              border: 1px solid ${isSelected ? color : '#cbd5e1'};
              box-shadow: 0 2px 8px rgba(0,0,0,0.15);
              white-space: nowrap;
              display: flex;
              align-items: center;
              gap: 4px;
            ">
              <span>${cp.name.replace('ICP ', '')}</span>
              <span style="background: ${bgColor}; color: ${color}; padding: 1px 4px; border-radius: 3px; font-size: 9px; font-weight: 800;">
                ${cp.active_cases}
              </span>
            </div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      })

      const marker = L.marker([cp.lat, cp.lng], { icon: customIcon }).addTo(map)

      marker.on('click', () => {
        setSelectedCheckpoint(cp)
        map.flyTo([cp.lat, cp.lng], 9, { duration: 0.8 })
      })

      markersRef.current[cp.id] = marker
    })
  }, [checkpoints, filterBorder, selectedCheckpoint])

  const handleSelectFromList = (cp) => {
    setSelectedCheckpoint(cp)
    const map = mapInstanceRef.current
    if (map) {
      map.flyTo([cp.lat, cp.lng], 9, { duration: 0.8 })
    }
  }

  const resetMapView = () => {
    const map = mapInstanceRef.current
    if (map) {
      map.flyTo([26.8, 85.5], 6.5, { duration: 0.8 })
    }
  }

  const filteredCheckpoints = checkpoints.filter(cp => {
    if (filterBorder === 'ALL') return true
    return cp.border.toLowerCase().includes(filterBorder.toLowerCase())
  })

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
            Integrated Border Checkposts (ICP) Geospatial Command
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Real-time interactive tactical map covering Indo-Nepal, Indo-Bhutan, and Indo-Bangladesh border corridors.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Map Layer Switcher */}
          <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0' }}>
            <button
              onClick={() => setMapLayer('streets')}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '0.72rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: mapLayer === 'streets' ? '#1e40af' : 'transparent',
                color: mapLayer === 'streets' ? '#ffffff' : '#64748b',
                transition: 'all 0.15s ease'
              }}
            >
              🗺️ Cartographic
            </button>
            <button
              onClick={() => setMapLayer('satellite')}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '0.72rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: mapLayer === 'satellite' ? '#1e40af' : 'transparent',
                color: mapLayer === 'satellite' ? '#ffffff' : '#64748b',
                transition: 'all 0.15s ease'
              }}
            >
              🛰️ Satellite
            </button>
          </div>

          {/* Border Filter */}
          <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0' }}>
            {['ALL', 'Nepal', 'Bhutan', 'Bangladesh'].map(b => (
              <button
                key={b}
                onClick={() => setFilterBorder(b)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background: filterBorder === b ? '#1e40af' : 'transparent',
                  color: filterBorder === b ? '#ffffff' : '#64748b',
                  transition: 'all 0.15s ease'
                }}
              >
                {b === 'ALL' ? 'All Corridors' : `Indo-${b}`}
              </button>
            ))}
          </div>

          <button
            onClick={resetMapView}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            title="Reset to Regional Overview"
          >
            <Compass size={14} /> Center Map
          </button>

          <button
            onClick={fetchCheckpoints}
            disabled={loading}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Sync
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Real Leaflet Map + Checkpoint Detail Card */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(340px, 1.55fr) minmax(280px, 1fr)',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Left Column: Leaflet Map Canvas */}
        <div className="panel panel-interactive" style={{ padding: '0', position: 'relative', overflow: 'hidden', height: '540px' }}>
          <div
            ref={mapContainerRef}
            style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-lg)' }}
          />

          {/* Map Overlay Badge */}
          <div style={{
            position: 'absolute',
            bottom: '14px',
            left: '14px',
            zIndex: 1000,
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(8px)',
            color: '#ffffff',
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.75rem',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="pulse-dot" />
              <span><strong>8 ICP Posts Online</strong></span>
            </div>
            <div style={{ height: '12px', width: '1px', background: 'rgba(255,255,255,0.2)' }} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <span style={{ color: '#6ee7b7' }}>● Standard</span>
              <span style={{ color: '#fde047' }}>● Elevated</span>
              <span style={{ color: '#fca5a5' }}>● Critical</span>
            </div>
          </div>
        </div>

        {/* Right Column: Checkpoint Commander Detail Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {selectedCheckpoint ? (
            <div className="panel panel-interactive" style={{ borderColor: '#bfdbfe', background: '#ffffff', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`badge ${selectedCheckpoint.threat_level === 'CRITICAL' ? 'badge-red' : selectedCheckpoint.threat_level === 'ELEVATED' ? 'badge-yellow' : 'badge-green'}`}>
                    {selectedCheckpoint.threat_level} THREAT
                  </span>
                  <span className="font-mono" style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e40af' }}>
                    [{selectedCheckpoint.id}]
                  </span>
                </div>
                <span className="badge badge-blue">
                  {selectedCheckpoint.status}
                </span>
              </div>

              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                {selectedCheckpoint.name}
              </h3>
              <p style={{ fontSize: '0.825rem', color: '#64748b', marginBottom: '14px' }}>
                Corridor: <strong>{selectedCheckpoint.border}</strong> &bull; State: <strong>{selectedCheckpoint.state}</strong>
              </p>

              {selectedCheckpoint.description && (
                <p style={{ fontSize: '0.8rem', color: '#334155', lineHeight: 1.45, background: '#f8fafc', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
                  {selectedCheckpoint.description}
                </p>
              )}

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                    {selectedCheckpoint.active_cases}
                  </div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase' }}>
                    Active Cases
                  </div>
                </div>

                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                    {selectedCheckpoint.today_screened}
                  </div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Today's Screenings
                  </div>
                </div>
              </div>

              <div className="prop-row">
                <span className="prop-label">COMMANDING OFFICER</span>
                <span className="prop-value" style={{ fontSize: '0.825rem' }}>{selectedCheckpoint.commander}</span>
              </div>
              <div className="prop-row">
                <span className="prop-label">COORDINATES</span>
                <span className="prop-value font-mono" style={{ fontSize: '0.78rem' }}>{selectedCheckpoint.lat}° N, {selectedCheckpoint.lng}° E</span>
              </div>
              <div className="prop-row">
                <span className="prop-label">CHECKPOINT CODE</span>
                <span className="prop-value font-mono" style={{ color: '#1e40af' }}>{selectedCheckpoint.code}</span>
              </div>

              {/* Action Buttons */}
              <div style={{ marginTop: '18px', display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => onSelectCase && onSelectCase(selectedCheckpoint.name)}
                  className="btn-primary"
                  style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}
                >
                  <Eye size={15} /> Inspect Active Cases for {selectedCheckpoint.code}
                </button>
              </div>
            </div>
          ) : (
            <div className="panel" style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
              <MapPin size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              Select a checkpoint pin from the map to inspect live operational data.
            </div>
          )}

          {/* Quick Checkpoint List */}
          <div className="panel panel-interactive" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '0.825rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', marginBottom: '10px' }}>
              Monitored Border Checkposts ({filteredCheckpoints.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
              {filteredCheckpoints.map(cp => (
                <div
                  key={cp.id}
                  onClick={() => handleSelectFromList(cp)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: selectedCheckpoint?.id === cp.id ? '#eff6ff' : '#f8fafc',
                    border: `1px solid ${selectedCheckpoint?.id === cp.id ? '#93c5fd' : '#e2e8f0'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#0f172a' }}>{cp.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{cp.border} &bull; {cp.state}</div>
                  </div>
                  <span className={`badge ${cp.threat_level === 'CRITICAL' ? 'badge-red' : cp.threat_level === 'ELEVATED' ? 'badge-yellow' : 'badge-green'}`} style={{ padding: '2px 6px', fontSize: '0.7rem' }}>
                    {cp.active_cases} Cases
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckpointsMap
