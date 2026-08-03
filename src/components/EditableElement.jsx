import { useRef, useState } from 'react'
import { ELEMENT_TYPES, elWidth } from '../lib/template'
import { getPath } from '../lib/resolve'
import { parentOf, sameList } from '../lib/tree'
import { draggedType } from '../lib/dnd'
import ElementView from './elements/ElementView'

function editData(data, source) {
  if (!source) return data
  const v = getPath(data, source)
  return Array.isArray(v) && v.length ? v[0] : {}
}

export default function EditableElement({
  element,
  path,
  data,
  selectedId,
  dragFrom,
  setDragFrom,
  onSelect,
  onMove,
  onRemove,
  onDuplicate,
  onAddInto,
  onMoveInto,
}) {
  const ref = useRef(null)
  const pressRef = useRef(null)
  const [zone, setZone] = useState(false)
  const def = ELEMENT_TYPES[element.type] || { label: element.type, icon: '?' }
  const p = element.props || {}
  const index = path[path.length - 1]
  const parent = parentOf(path)
  const selected = element.id === selectedId

  function handleDragStart(e) {
    if (pressRef.current && Math.hypot(e.clientX - pressRef.current.x, e.clientY - pressRef.current.y) < 5) {
      e.preventDefault()
      return
    }
    setDragFrom({ kind: 'move', path, id: element.id })
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('application/x-move', element.id)
  }

  function reorderOver(e) {
    if (!dragFrom || dragFrom.kind !== 'move') return
    if (!sameList(parentOf(dragFrom.path), parent)) return
    const rect = ref.current.getBoundingClientRect()
    const after = e.clientY > rect.top + rect.height / 2
    let target = after ? index + 1 : index
    const fromIdx = dragFrom.path[dragFrom.path.length - 1]
    if (fromIdx < target) target -= 1
    if (target !== fromIdx) {
      onMove(parent, fromIdx, target)
      setDragFrom({ kind: 'move', path: [...parent, target], id: dragFrom.id })
    }
  }

  function handleDragOver(e) {
    if (!dragFrom || dragFrom.kind !== 'move') return
    e.preventDefault()
    e.stopPropagation()
    reorderOver(e)
  }

  function handleZoneDragOver(e) {
    const type = draggedType(e)
    const canDrop = (dragFrom && dragFrom.kind === 'move') || ELEMENT_TYPES[type]
    if (!canDrop) return
    if (dragFrom && dragFrom.kind === 'move' && dragFrom.id === element.id) return
    e.preventDefault()
    e.stopPropagation()
    setZone(true)
  }

  function handleZoneDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    setZone(false)
    const type = draggedType(e)
    if (dragFrom && dragFrom.kind === 'move') {
      onMoveInto(element.id, dragFrom.id)
    } else if (ELEMENT_TYPES[type]) {
      onAddInto(element.id, type)
    }
    setDragFrom(null)
  }

  const isContainer = element.type === 'container'
  const boxStyle = isContainer
    ? {
        padding: `${p.padding ?? 12}px`,
        background: p.background || 'transparent',
        border: `${p.borderWidth || 0}px solid ${p.borderColor || '#000000'}`,
        borderRadius: `${p.radius || 0}px`,
        minHeight: `${p.minHeight || 40}px`,
        gap: `${p.gap ?? 8}px`,
      }
    : null
  const children = element.children || []

  return (
    <div
      ref={ref}
      className={`editable ${selected ? 'selected' : ''}`}
      style={{ width: elWidth(element) }}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={() => setDragFrom(null)}
      onMouseDown={(e) => {
        pressRef.current = { x: e.clientX, y: e.clientY }
        if (e.button === 0 && !e.target.closest('.node-toolbar')) {
          e.stopPropagation()
          onSelect(element.id)
        }
      }}
    >
      {isContainer ? (
        <div className="editable-box" style={boxStyle}>
          {p.source && <div className="container-source">↻ {p.source}</div>}
          {children.length === 0 ? (
            <div
              className={`container-empty ${zone ? 'container-hover' : ''}`}
              onDragOver={handleZoneDragOver}
              onDrop={handleZoneDrop}
              onDragLeave={() => setZone(false)}
            >
              {zone ? 'Déposer ici' : 'Déposez des éléments dans ce bloc'}
            </div>
          ) : (
            <>
              {children.map((child, i) => (
                <EditableElement
                  key={child.id}
                  element={child}
                  path={[...path, i]}
                  data={editData(data, p.source)}
                  selectedId={selectedId}
                  dragFrom={dragFrom}
                  setDragFrom={setDragFrom}
                  onSelect={onSelect}
                  onMove={onMove}
                  onRemove={onRemove}
                  onDuplicate={onDuplicate}
                  onAddInto={onAddInto}
                  onMoveInto={onMoveInto}
                />
              ))}
              <div
                className={`container-dropzone ${zone ? 'active' : ''}`}
                onDragOver={handleZoneDragOver}
                onDrop={handleZoneDrop}
                onDragLeave={() => setZone(false)}
              >
                {zone ? 'Déposer dans le bloc' : '＋'}
              </div>
            </>
          )}
        </div>
      ) : (
        <ElementView element={element} data={data} />
      )}
      <div className="node-toolbar">
        <span className="node-type">{def.icon} {def.label}</span>
        <button type="button" title="Monter" onClick={(e) => { e.stopPropagation(); onMove(parent, index, index - 1) }}>↑</button>
        <button type="button" title="Descendre" onClick={(e) => { e.stopPropagation(); onMove(parent, index, index + 1) }}>↓</button>
        <button type="button" title="Dupliquer" onClick={(e) => { e.stopPropagation(); onDuplicate(path) }}>⧉</button>
        <button type="button" title="Supprimer" onClick={(e) => { e.stopPropagation(); onRemove(path) }}>✕</button>
      </div>
    </div>
  )
}
