import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { createBlankTemplate, createElement, ELEMENT_TYPES, pageSizeMm, uid, migrateTemplate } from '../lib/template'
import { autoLayout, contentBox, defaultHeight, round1 } from '../lib/layout'
import {
  updateTree,
  updateLayout,
  insertInto,
  insertAfter,
  removeAtPath,
  moveAtPath,
  duplicateAtPath,
  elementAtPath,
  findById,
  findPath,
  extractElement,
  containsElement,
  deepCopy,
  flatten,
} from '../lib/tree'
import useHistory from '../hooks/useHistory'
import { getTemplate, saveTemplate, exportTemplateFile, parseImportedTemplate, saveToServer } from '../lib/storage'
import { downloadTemplateGuide } from '../lib/guide'
import { draggedType } from '../lib/dnd'
import Toolbar from '../components/Toolbar'
import Palette from '../components/Palette'
import PropertiesPanel from '../components/PropertiesPanel'
import DataPanel from '../components/DataPanel'
import PagePanel from '../components/PagePanel'
import FondPanel from '../components/FondPanel'
import PageStrip from '../components/PageStrip'
import PreviewModal from '../components/PreviewModal'
import ShareModal from '../components/ShareModal'
import ZoomableSheet from '../components/ZoomableSheet'
import EditableElement from '../components/EditableElement'
import FreeEditable from '../components/FreeEditable'
import Document from '../components/Document'
import PageBackdrop from '../components/PageBackdrop'
import usePrintPageStyle from '../hooks/usePrintPageStyle'

function movePages(arr, from, to) {
  const a = [...arr]
  const [item] = a.splice(from, 1)
  a.splice(to, 0, item)
  return a
}

export default function Editor() {
  const { id } = useParams()
  const initial = () => {
    const t = getTemplate(id)
    return t ? migrateTemplate(t) : null
  }
  const { state: template, set: setTemplate, beginGesture, endGesture, undo, redo, replace } = useHistory(initial())
  const [activePage, setActivePage] = useState(0)
  const [selectedId, setSelectedId] = useState(null)
  const [dragFrom, setDragFrom] = useState(null)
  const [over, setOver] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [rightTab, setRightTab] = useState('props')
  const [zoom, setZoom] = useState('fit')
  const [freeGuides, setFreeGuides] = useState({ v: [], h: [] })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const canvasRef = useRef(null)
  const toastTimer = useRef(null)
  const clipboardRef = useRef(null)
  const keyHandlerRef = useRef(null)

  useEffect(() => {
    function onKeyDown(e) {
      keyHandlerRef.current?.(e)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    const t = getTemplate(id) ? migrateTemplate(getTemplate(id)) : null
    replace(t)
    setActivePage(0)
    setSelectedId(null)
  }, [id, replace])

  useEffect(() => {
    if (!template) return
    saveTemplate(template)
  }, [template])

  usePrintPageStyle(template)

  if (!template) {
    return (
      <div className="not-found">
        <h2>Gabarit introuvable</h2>
        <p>Ce gabarit n'existe pas ou a été supprimé.</p>
        <Link className="btn" to="/">Retour à l'accueil</Link>
      </div>
    )
  }

  const activeElements = template.pages[activePage]?.elements || []
  const free = template.pages[activePage]?.layout === 'free'
  const selected = flatten(activeElements).find((el) => el.id === selectedId) || null
  const { w, h } = pageSizeMm(template.page)
  const margin = template.page.margin ?? 25
  const contentW = contentBox(template.page).width
  const contentH = contentBox(template.page).height

  function notify(message) {
    setToast(message)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }

  function handleCopy() {
    if (!selected) return
    clipboardRef.current = deepCopy(selected)
    notify('Élément copié')
  }

  function handleCut() {
    if (!selected) return
    clipboardRef.current = deepCopy(selected)
    const path = findPath(activeElements, selected.id)
    if (path) removeElementAt(path)
    setSelectedId(null)
    notify('Élément coupé')
  }

  function handlePaste() {
    const src = clipboardRef.current
    if (!src) return
    const el = deepCopy(src)
    if (free) {
      const base = el.layout || { x: 0, y: 0, w: 100, h: 20 }
      el.layout = {
        ...base,
        x: round1(Math.max(0, Math.min(contentW - base.w, base.x + 8))),
        y: round1(Math.max(0, Math.min(contentH - base.h, base.y + 8))),
      }
      setTemplate((prev) => ({
        ...prev,
        pages: prev.pages.map((pg, i) =>
          i === activePage ? { ...pg, elements: [...pg.elements, el] } : pg
        ),
      }))
    } else {
      const path = selectedId ? findPath(activeElements, selectedId) : null
      setTemplate((prev) => ({
        ...prev,
        pages: prev.pages.map((pg, i) =>
          i === activePage ? { ...pg, elements: path ? insertAfter(pg.elements, path, el) : [...pg.elements, el] } : pg
        ),
      }))
    }
    setSelectedId(el.id)
    notify('Élément collé')
  }

  function handleDeleteShortcut() {
    if (!selected) return
    const path = findPath(activeElements, selected.id)
    if (path) removeElementAt(path)
    setSelectedId(null)
  }

  function handleDuplicateShortcut() {
    if (!selected) return
    const path = findPath(activeElements, selected.id)
    if (path) duplicateElementAt(path)
  }

  keyHandlerRef.current = (e) => {
    const mod = e.ctrlKey || e.metaKey
    const target = e.target
    if (target instanceof Element && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
      return
    }
    const key = e.key.toLowerCase()
    if (mod && key === 'z') {
      e.preventDefault()
      if (e.shiftKey) redo()
      else undo()
      return
    }
    if (mod && key === 'y') {
      e.preventDefault()
      redo()
      return
    }
    if (mod && key === 'c') {
      e.preventDefault()
      handleCopy()
      return
    }
    if (mod && key === 'x') {
      e.preventDefault()
      handleCut()
      return
    }
    if (mod && key === 'v') {
      e.preventDefault()
      handlePaste()
      return
    }
    if (mod && key === 'd') {
      e.preventDefault()
      handleDuplicateShortcut()
      return
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      handleDeleteShortcut()
    }
  }

  function updateElement(elementId, patch) {
    setTemplate((prev) => ({
      ...prev,
      pages: prev.pages.map((pg, i) =>
        i === activePage ? { ...pg, elements: updateTree(pg.elements, elementId, patch) } : pg
      ),
    }))
  }

  function addElement(type, containerId = null, pos = null) {
    const el = createElement(type)
    if (free && !containerId) {
      const widthPct = Math.max(5, Math.min(100, Number(el.props?.width) || 100))
      el.layout = {
        x: pos ? Math.round(pos.x * 10) / 10 : 0,
        y: pos ? Math.round(pos.y * 10) / 10 : 0,
        w: Math.round(((contentW || 190) * widthPct) / 100 * 10) / 10,
        h: defaultHeight(el),
      }
    }
    setTemplate((prev) => ({
      ...prev,
      pages: prev.pages.map((pg, i) =>
        i === activePage
          ? { ...pg, elements: containerId ? insertInto(pg.elements, containerId, el) : [...pg.elements, el] }
          : pg
      ),
    }))
    setSelectedId(el.id)
  }

  function updateElementLayout(elementId, patch) {
    setTemplate((prev) => ({
      ...prev,
      pages: prev.pages.map((pg, i) =>
        i === activePage ? { ...pg, elements: updateLayout(pg.elements, elementId, patch) } : pg
      ),
    }))
  }

  function setPageLayout(mode) {
    setTemplate((prev) => {
      const pg = prev.pages[activePage]
      if (!pg) return prev
      let elements = pg.elements
      if (mode === 'free') {
        const box = contentBox(prev.page)
        const computed = autoLayout(pg.elements, box.width)
        const layoutMap = new Map(computed.map((e) => [e.id, e.layout]))
        elements = pg.elements.map((el) => (el.layout ? el : { ...el, layout: layoutMap.get(el.id) }))
      }
      return {
        ...prev,
        pages: prev.pages.map((p, i) => (i === activePage ? { ...p, layout: mode, elements } : p)),
      }
    })
  }

  function moveInList(parentPath, from, to) {
    setTemplate((prev) => ({
      ...prev,
      pages: prev.pages.map((pg, i) =>
        i === activePage ? { ...pg, elements: moveAtPath(pg.elements, [...parentPath, from], to) } : pg
      ),
    }))
  }

  function removeElementAt(path) {
    const target = elementAtPath(activeElements, path)
    setTemplate((prev) => ({
      ...prev,
      pages: prev.pages.map((pg, i) =>
        i === activePage ? { ...pg, elements: removeAtPath(pg.elements, path) } : pg
      ),
    }))
    if (target && containsElement(target, selectedId)) setSelectedId(null)
  }

  function duplicateElementAt(path) {
    const newId = uid()
    setTemplate((prev) => ({
      ...prev,
      pages: prev.pages.map((pg, i) =>
        i === activePage ? { ...pg, elements: duplicateAtPath(pg.elements, path, newId, free ? { x: 8, y: 8 } : null) } : pg
      ),
    }))
    setSelectedId(newId)
  }

  function moveIntoContainer(containerId, elementId) {
    setTemplate((prev) => {
      const pg = prev.pages[activePage]
      if (!pg) return prev
      const found = extractElement(pg.elements, elementId)
      if (!found) return prev
      const container = findById(found.elements, containerId)
      if (!container || container.type !== 'container') return prev
      if (containsElement(found.element, containerId)) return prev
      return {
        ...prev,
        pages: prev.pages.map((p, i) =>
          i === activePage ? { ...p, elements: insertInto(found.elements, containerId, found.element) } : p
        ),
      }
    })
  }

  function moveToPageEnd(path) {
    setTemplate((prev) => {
      const pg = prev.pages[activePage]
      if (!pg) return prev
      const found = elementAtPath(pg.elements, path)
      if (!found) return prev
      const remaining = removeAtPath(pg.elements, path)
      return {
        ...prev,
        pages: prev.pages.map((p, i) =>
          i === activePage ? { ...p, elements: [...remaining, found] } : p
        ),
      }
    })
  }

  function addPage() {
    setTemplate((prev) => ({ ...prev, pages: [...prev.pages, { id: uid(), layout: 'flow', elements: [] }] }))
    setActivePage(template.pages.length)
  }

  function removePage(index) {
    if (template.pages.length <= 1) return
    setTemplate((prev) => ({ ...prev, pages: prev.pages.filter((_, i) => i !== index) }))
    setActivePage((cur) => (cur >= index ? Math.max(0, cur - 1) : cur))
  }

  function movePage(from, to) {
    if (to < 0 || to >= template.pages.length) return
    setTemplate((prev) => ({ ...prev, pages: movePages(prev.pages, from, to) }))
    setActivePage(to)
  }

  function handleSelectPage(i) {
    setActivePage(i)
    setSelectedId(null)
  }

  function updateData(data) {
    setTemplate((prev) => ({ ...prev, data }))
  }

  function updatePage(patch) {
    setTemplate((prev) => ({ ...prev, page: { ...prev.page, ...patch } }))
  }

  function updateActivePage(patch) {
    setTemplate((prev) => ({
      ...prev,
      pages: prev.pages.map((pg, i) => (i === activePage ? { ...pg, ...patch } : pg)),
    }))
  }

  function rename(name) {
    setTemplate((prev) => ({ ...prev, meta: { ...prev.meta, name } }))
  }

  function handleExport() {
    exportTemplateFile(template)
    notify('Gabarit exporté')
  }

  function handleGuide() {
    downloadTemplateGuide(template)
    notify('Guide téléchargé')
  }

  function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const imported = parseImportedTemplate(String(reader.result))
        setTemplate(imported)
        setSelectedId(null)
        setActivePage(0)
        notify('Gabarit importé')
      } catch {
        notify('Fichier invalide')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleReset() {
    if (!window.confirm('Réinitialiser ce gabarit ? Les modifications seront perdues.')) return
    const blank = createBlankTemplate(template.meta.name)
    blank.meta.id = template.meta.id
    setTemplate(blank)
    setSelectedId(null)
    setActivePage(0)
    notify('Gabarit réinitialisé')
  }

  function handleSaveServer() {
    setSaving(true)
    saveToServer(template)
      .then(() => notify('Enregistré sur le serveur'))
      .catch(() => notify('Erreur : serveur indisponible (lancer « npm run dev »)'))
      .finally(() => setSaving(false))
  }

  function handleCanvasDrop(e) {
    e.preventDefault()
    setOver(false)
    const type = draggedType(e)
    if (dragFrom && dragFrom.kind === 'move') {
      const isCanvasArea =
        e.target === e.currentTarget ||
        (e.target instanceof Element && (e.target.classList?.contains('canvas-empty') || e.target.closest('.canvas-empty') || e.target.classList?.contains('drop-line')))
      if (isCanvasArea) moveToPageEnd(dragFrom.path)
    } else if (ELEMENT_TYPES[type]) {
      let pos = null
      if (free && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        if (rect.width && rect.height) {
          pos = {
            x: ((e.clientX - rect.left) / rect.width) * contentW,
            y: ((e.clientY - rect.top) / rect.height) * contentH,
          }
        }
      }
      addElement(type, null, pos)
    }
    setDragFrom(null)
  }

  function handleCanvasDragOver(e) {
    const type = draggedType(e)
    if (dragFrom || ELEMENT_TYPES[type]) {
      e.preventDefault()
      setOver(true)
    }
  }

  return (
    <div className="editor">
      <Toolbar
        name={template.meta?.name || ''}
        onRename={rename}
        onPreview={() => setPreviewOpen(true)}
        onShare={() => setShareOpen(true)}
        onExport={handleExport}
        onImport={handleImport}
        onReset={handleReset}
        onSaveServer={handleSaveServer}
        onGuide={handleGuide}
        saving={saving}
      />
      <div className="workspace">
        <Palette onAdd={addElement} />
        <main className="canvas-area">
          <PageStrip
            pages={template.pages}
            activeIndex={activePage}
            onSelect={handleSelectPage}
            onAdd={addPage}
            onRemove={removePage}
            onMove={movePage}
          />
          <div className="canvas-toolbar">
            <span className="canvas-info">
              {template.pages.length} page(s) · {Math.round(w)}×{Math.round(h)} mm
            </span>
            <div className="zoom-controls">
              <button type="button" className={`btn small ${zoom === 'fit' ? 'active' : ''}`} onClick={() => setZoom('fit')}>Ajuster</button>
              <button type="button" className={`btn small ${zoom === 50 ? 'active' : ''}`} onClick={() => setZoom(50)}>50%</button>
              <button type="button" className={`btn small ${zoom === 75 ? 'active' : ''}`} onClick={() => setZoom(75)}>75%</button>
              <button type="button" className={`btn small ${zoom === 100 ? 'active' : ''}`} onClick={() => setZoom(100)}>100%</button>
            </div>
          </div>
          <ZoomableSheet zoom={zoom}>
            <div
              className="sheet"
              style={{ width: `${w}mm`, minHeight: `${h}mm`, padding: `${margin}mm` }}
            >
              <PageBackdrop page={template.pages[activePage]} />
              <div
                ref={canvasRef}
                className={`pdf-content editable-canvas ${over ? 'dragging' : ''} ${free ? 'free-mode' : ''}`}
                onDragOver={handleCanvasDragOver}
                onDragLeave={() => setOver(false)}
                onDrop={handleCanvasDrop}
                onClick={(e) => {
                  if (e.target === e.currentTarget) setSelectedId(null)
                }}
              >
                {free ? (
                  <>
                    {activeElements.length === 0 ? (
                      <div className="canvas-empty">Glissez des éléments ici pour composer cette page</div>
                    ) : (
                      activeElements.map((el, index) => (
                        <FreeEditable
                          key={el.id}
                          element={el}
                          index={index}
                          data={template.data}
                          selectedId={selectedId}
                          elements={activeElements}
                          contentW={contentW}
                          contentH={contentH}
                          onSelect={setSelectedId}
                          onLayout={updateElementLayout}
                          onGuides={setFreeGuides}
                          onMove={moveInList}
                          onRemove={removeElementAt}
                          onDuplicate={duplicateElementAt}
                          onGestureStart={beginGesture}
                          onGestureEnd={endGesture}
                        />
                      ))
                    )}
                    {freeGuides.v.map((g, i) => (
                      <div key={`gv${i}`} className="guide-line-v" style={{ left: `${g}mm` }} />
                    ))}
                    {freeGuides.h.map((g, i) => (
                      <div key={`gh${i}`} className="guide-line-h" style={{ top: `${g}mm` }} />
                    ))}
                  </>
                ) : (
                  <>
                    {activeElements.length === 0 ? (
                      <div className="canvas-empty">Glissez des éléments ici pour composer cette page</div>
                    ) : (
                      activeElements.map((el, index) => (
                        <EditableElement
                          key={el.id}
                          element={el}
                          path={[index]}
                          data={template.data}
                          selectedId={selectedId}
                          dragFrom={dragFrom}
                          setDragFrom={setDragFrom}
                          onSelect={setSelectedId}
                          onMove={moveInList}
                          onRemove={removeElementAt}
                          onDuplicate={duplicateElementAt}
                          onAddInto={addElement}
                          onMoveInto={moveIntoContainer}
                        />
                      ))
                    )}
                    {dragFrom && <div className="drop-line" />}
                  </>
                )}
              </div>
            </div>
          </ZoomableSheet>
        </main>
        <aside className="right-panel">
          <div className="tabs">
            <button type="button" className={rightTab === 'props' ? 'active' : ''} onClick={() => setRightTab('props')}>Propriétés</button>
            <button type="button" className={rightTab === 'data' ? 'active' : ''} onClick={() => setRightTab('data')}>Données</button>
            <button type="button" className={rightTab === 'page' ? 'active' : ''} onClick={() => setRightTab('page')}>Page</button>
            <button type="button" className={rightTab === 'fond' ? 'active' : ''} onClick={() => setRightTab('fond')}>Fond</button>
          </div>
          <div className="tab-content">
            {rightTab === 'props' && (
              <PropertiesPanel
                element={selected}
                onChange={updateElement}
                free={free}
                contentW={contentW}
                onLayoutChange={updateElementLayout}
              />
            )}
            {rightTab === 'data' && <DataPanel data={template.data} onApply={updateData} />}
            {rightTab === 'page' && <PagePanel page={template.page} onChange={updatePage} layout={template.pages[activePage]?.layout} onLayoutModeChange={setPageLayout} />}
            {rightTab === 'fond' && <FondPanel page={template.pages[activePage]} onChange={updateActivePage} />}
          </div>
        </aside>
      </div>
      <div id="print-root" aria-hidden="true">
        <Document template={template} />
      </div>
      {previewOpen && <PreviewModal template={template} onClose={() => setPreviewOpen(false)} />}
      {shareOpen && <ShareModal template={template} onClose={() => setShareOpen(false)} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
