import React, { useEffect, useRef, useState } from 'react'
import { Network, RefreshCw, ZoomIn, ZoomOut, Maximize2, Info } from 'lucide-react'

const API_URL = '/api'

/* ── colour helpers ── */
const NODE_COLORS = {
  person:    { fill: '#dbeafe', stroke: '#3b82f6', text: '#1e40af' },
  document:  { fill: '#fef3c7', stroke: '#f59e0b', text: '#92400e' },
  flag:      { fill: '#fee2e2', stroke: '#ef4444', text: '#991b1b' },
  checkpoint:{ fill: '#d1fae5', stroke: '#10b981', text: '#065f46' },
}

function buildGraphFromScreenings(screenings) {
  const nodes = []
  const edges = []
  const seen  = new Set()

  const addNode = (id, label, type, sub = '') => {
    if (seen.has(id)) return
    seen.add(id)
    nodes.push({ id, label, type, sub })
  }

  screenings.forEach(s => {
    const personId = `P_${s.holder_name || s.case_id}`
    const docId    = `D_${s.case_id}`
    const cpId     = `CP_${s.checkpoint_id || 'ICP-04'}`

    addNode(personId, s.holder_name || 'Unknown', 'person', s.document_type)
    addNode(docId, s.case_id, 'document', s.risk_level)
    addNode(cpId, (s.checkpoint_id || 'ICP-04').replace('ICP-', 'ICP '), 'checkpoint', '')

    edges.push({ from: personId, to: docId, label: 'presented' })
    edges.push({ from: docId, to: cpId, label: 'screened at' })

    if (s.risk_level === 'RED' || s.risk_level === 'HIGH') {
      const flagId = `F_${s.case_id}`
      addNode(flagId, '⚠ HIGH RISK', 'flag', s.risk_action)
      edges.push({ from: docId, to: flagId, label: 'flagged' })
    }
  })

  return { nodes, edges }
}

function drawGraph(canvas, graph, transform) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const { width, height } = canvas
  ctx.clearRect(0, 0, width, height)

  // Grid background
  ctx.save()
  ctx.strokeStyle = '#f1f5f9'
  ctx.lineWidth = 1
  const step = 40
  for (let x = 0; x < width; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke() }
  for (let y = 0; y < height; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke() }
  ctx.restore()

  if (!graph || graph.nodes.length === 0) {
    ctx.fillStyle = '#94a3b8'
    ctx.font = '14px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText('No screening data available. Run a verification to see the graph.', width / 2, height / 2)
    return
  }

  // Assign positions in a force-like circular layout
  const positions = {}
  const cx = width / 2, cy = height / 2
  const layers = { checkpoint: 0, person: 1, document: 2, flag: 3 }
  const byType = {}
  graph.nodes.forEach(n => { const t = n.type; (byType[t] = byType[t] || []).push(n) })

  const radii = [0, 110, 210, 290]
  Object.entries(byType).forEach(([type, nodes]) => {
    const r = radii[layers[type]] || 160
    nodes.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2
      positions[n.id] = {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
      }
    })
  })

  ctx.save()
  ctx.translate(transform.x, transform.y)
  ctx.scale(transform.scale, transform.scale)

  // Draw edges
  graph.edges.forEach(e => {
    const from = positions[e.from], to = positions[e.to]
    if (!from || !to) return
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.strokeStyle = '#cbd5e1'
    ctx.lineWidth = 1.5
    ctx.setLineDash([4, 3])
    ctx.stroke()
    ctx.setLineDash([])

    // edge label
    const mx = (from.x + to.x) / 2, my = (from.y + to.y) / 2
    ctx.fillStyle = '#64748b'
    ctx.font = '9px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText(e.label, mx, my - 4)
  })

  // Draw nodes
  graph.nodes.forEach(n => {
    const pos = positions[n.id]
    if (!pos) return
    const col = NODE_COLORS[n.type] || NODE_COLORS.document
    const rx = 44, ry = 22

    ctx.beginPath()
    ctx.ellipse(pos.x, pos.y, rx, ry, 0, 0, 2 * Math.PI)
    ctx.fillStyle   = col.fill
    ctx.strokeStyle = col.stroke
    ctx.lineWidth   = 2
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = col.text
    ctx.font = `bold 9px system-ui`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    // truncate label
    const lbl = n.label.length > 14 ? n.label.slice(0, 13) + '…' : n.label
    ctx.fillText(lbl, pos.x, pos.y - 4)

    ctx.font = '8px system-ui'
    ctx.fillStyle = '#64748b'
    const sub = (n.sub || '').length > 16 ? (n.sub || '').slice(0, 15) + '…' : (n.sub || '')
    ctx.fillText(sub, pos.x, pos.y + 8)
  })

  ctx.restore()
}

export default function IdentityGraph() {
  const canvasRef = useRef(null)
  const [graph, setGraph]       = useState({ nodes: [], edges: [] })
  const [loading, setLoading]   = useState(true)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [info, setInfo]         = useState(null)
  const dragRef = useRef(null)

  const fetchAndBuild = async () => {
    setLoading(true)
    try {
      const r = await fetch(`${API_URL}/history?limit=40`)
      if (r.ok) {
        const d = await r.json()
        setGraph(buildGraphFromScreenings(d.data || []))
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchAndBuild() }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width  = canvas.offsetWidth  || 700
    canvas.height = canvas.offsetHeight || 420
    drawGraph(canvas, graph, transform)
  }, [graph, transform])

  const zoom = (delta) => setTransform(t => ({ ...t, scale: Math.min(3, Math.max(0.3, t.scale + delta)) }))
  const reset = () => setTransform({ x: 0, y: 0, scale: 1 })

  const onMouseDown = (e) => { dragRef.current = { startX: e.clientX - transform.x, startY: e.clientY - transform.y } }
  const onMouseMove = (e) => {
    if (!dragRef.current) return
    setTransform(t => ({ ...t, x: e.clientX - dragRef.current.startX, y: e.clientY - dragRef.current.startY }))
  }
  const onMouseUp = () => { dragRef.current = null }

  return (
    <div>
      <div style={{ marginBottom: '18px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <Network size={22} color="#3b82f6"/> Identity Relationship Graph
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Visual map of travellers, documents, checkpoints and risk flags from recent screenings.
        </p>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {Object.entries(NODE_COLORS).map(([type, col]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, textTransform: 'capitalize', color: col.text }}>
            <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: col.fill, border: `2px solid ${col.stroke}` }}/>
            {type}
          </div>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))', gap: '10px', marginBottom: '16px' }}>
        {[
          { label: 'Nodes', val: graph.nodes.length, color: '#3b82f6' },
          { label: 'Edges', val: graph.edges.length, color: '#8b5cf6' },
          { label: 'Persons', val: graph.nodes.filter(n => n.type === 'person').length, color: '#0ea5e9' },
          { label: 'Risk Flags', val: graph.nodes.filter(n => n.type === 'flag').length, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="panel" style={{ padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.val}</div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Canvas */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 className="panel-title"><Network size={15}/> Live Graph View</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => zoom(0.15)} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }}><ZoomIn size={13}/></button>
            <button onClick={() => zoom(-0.15)} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }}><ZoomOut size={13}/></button>
            <button onClick={reset} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }}><Maximize2 size={13}/></button>
            <button onClick={fetchAndBuild} className="btn-primary" style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
              <RefreshCw size={13}/> Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ height: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexDirection: 'column', gap: '12px' }}>
            <RefreshCw size={22} style={{ animation: 'spin 1s linear infinite' }}/>
            Building identity graph…
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '420px', display: 'block', cursor: 'grab', background: '#fafbfc' }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onWheel={e => { e.preventDefault(); zoom(e.deltaY < 0 ? 0.1 : -0.1) }}
          />
        )}
      </div>

      <p style={{ marginTop: '10px', fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        <Info size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }}/>
        Drag to pan · Scroll to zoom · Refresh to reload from latest screenings
      </p>
    </div>
  )
}
