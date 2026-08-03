import { useMemo, useRef } from 'react'
import { ELEMENT_TYPES } from '../lib/template'
import { snap, round1 } from '../lib/layout'
import ElementView from './elements/ElementView'

function layoutOf(el) {
  return el.layout || { x: 0, y: 0, w: 100, h: 20 }
}

export default function FreeEditable({
  element,
  index,
  data,
  selectedId,
  elements,
  contentW,
  contentH,
  onSelect,
  onLayout,
  onGuides,
  onMove,
  onRemove,
  onDuplicate,
  onGestureStart,
  onGestureEnd,
}) {
  const boxRef = useRef(null)
  const dragRef = useRef(null)
  const def = ELEMENT_TYPES[element.type] || { label: element.type, icon: '?' }
  const layout = layoutOf(element)
  const selected = element.id === selectedId

  const targets = useMemo(() => {
    const v = [0, contentW / 2, contentW]
    const h = [0, contentH / 2, contentH]
    for (const el of elements) {
      if (el.id === element.id) continue
      const L = layoutOf(el)
      v.push(L.x, L.x + L.w / 2, L.x + L.w)
      h.push(L.y, L.y + L.h / 2, L.y + L.h)
    }
    return { v, h }
  }, [elements, element.id, contentW, contentH])

  function mmPerPx() {
    const canvas = boxRef.current?.closest('.editable-canvas')
    if (!canvas) return 25.4 / 96
    const rect = canvas.getBoundingClientRect()
    if (!rect.width || !contentW) return 25.4 / 96
    return contentW / rect.width
  }

  function applyGuides(x, y, w, h, moving) {
    const g = { v: [], h: [] }
    if (moving) {
      const vx = snap(x, targets.v)
      const vy = snap(y, targets.h)
      if (vx !== null) g.v.push(vx)
      if (vy !== null) g.h.push(vy)
    } else {
      const left = snap(x, targets.v)
      const right = snap(x + w, targets.v)
      const top = snap(y, targets.h)
      const bottom = snap(y + h, targets.h)
      if (left !== null) g.v.push(left)
      if (right !== null) g.v.push(right)
      if (top !== null) g.h.push(top)
      if (bottom !== null) g.h.push(bottom)
    }
    onGuides(g)
    return g
  }

  function handlePointerMove(e) {
    const d = dragRef.current
    if (!d) return
    const dx = (e.clientX - d.startX) * d.mpp
    const dy = (e.clientY - d.startY) * d.mpp
    if (d.mode === 'move') {
      const x = snap(d.orig.x + dx, targets.v) ?? d.orig.x + dx
      const y = snap(d.orig.y + dy, targets.h) ?? d.orig.y + dy
      onLayout(element.id, { x: round1(x), y: round1(y) })
      applyGuides(x, y, d.orig.w, d.orig.h, true)
    } else {
      let { x, y, w, h } = d.orig
      const dir = d.dir
      if (dir.includes('e')) w = Math.max(5, d.orig.w + dx)
      if (dir.includes('w')) { const nw = Math.max(5, d.orig.w - dx); x = d.orig.x + (d.orig.w - nw); w = nw }
      if (dir.includes('s')) h = Math.max(5, d.orig.h + dy)
      if (dir.includes('n')) { const nh = Math.max(5, d.orig.h - dy); y = d.orig.y + (d.orig.h - nh); h = nh }
      onLayout(element.id, { x: round1(x), y: round1(y), w: round1(w), h: round1(h) })
      applyGuides(x, y, w, h, false)
    }
  }

  function endDrag() {
    dragRef.current = null
    onGuides({ v: [], h: [] })
    onGestureEnd?.()
  }

  function startMove(e) {
    if (e.button !== 0) return
    if (e.target.closest('.node-toolbar') || e.target.closest('.resize-handle')) return
    e.preventDefault()
    onGestureStart?.()
    onSelect(element.id)
    e.currentTarget.setPointerCapture?.(e.pointerId)
    dragRef.current = {
      mode: 'move',
      startX: e.clientX,
      startY: e.clientY,
      orig: { ...layout },
      mpp: mmPerPx(),
    }
  }

  function startResize(e, dir) {
    if (e.button !== 0) return
    e.stopPropagation()
    e.preventDefault()
    onGestureStart?.()
    onSelect(element.id)
    boxRef.current?.setPointerCapture?.(e.pointerId)
    dragRef.current = {
      mode: 'resize',
      dir,
      startX: e.clientX,
      startY: e.clientY,
      orig: { ...layout },
      mpp: mmPerPx(),
    }
  }

  return (
    <div
      ref={boxRef}
      className={`free-el ${selected ? 'selected' : ''}`}
      style={{ left: `${layout.x}mm`, top: `${layout.y}mm`, width: `${layout.w}mm`, height: `${layout.h}mm` }}
      onPointerDown={startMove}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={() => { if (!dragRef.current) onGuides({ v: [], h: [] }) }}
    >
      <div className="free-el-body">
        <ElementView element={element} data={data} free />
      </div>
      {selected && (
        <>
          <div className="resize-handle nw" onPointerDown={(e) => startResize(e, 'nw')} />
          <div className="resize-handle n" onPointerDown={(e) => startResize(e, 'n')} />
          <div className="resize-handle ne" onPointerDown={(e) => startResize(e, 'ne')} />
          <div className="resize-handle e" onPointerDown={(e) => startResize(e, 'e')} />
          <div className="resize-handle se" onPointerDown={(e) => startResize(e, 'se')} />
          <div className="resize-handle s" onPointerDown={(e) => startResize(e, 's')} />
          <div className="resize-handle sw" onPointerDown={(e) => startResize(e, 'sw')} />
          <div className="resize-handle w" onPointerDown={(e) => startResize(e, 'w')} />
        </>
      )}
      <div className="node-toolbar">
        <span className="node-type">{def.icon} {def.label}</span>
        <button type="button" title="Avancer (vers l'arrière)" onClick={(e) => { e.stopPropagation(); onMove([], index, index - 1) }}>↑</button>
        <button type="button" title="Reculer (vers l'avant)" onClick={(e) => { e.stopPropagation(); onMove([], index, index + 1) }}>↓</button>
        <button type="button" title="Dupliquer" onClick={(e) => { e.stopPropagation(); onDuplicate([index]) }}>⧉</button>
        <button type="button" title="Supprimer" onClick={(e) => { e.stopPropagation(); onRemove([index]) }}>✕</button>
      </div>
    </div>
  )
}
