import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { createBlankTemplate, defaultInvoiceTemplate, pageSizeMm } from '../lib/template'
import { loadAll, saveTemplate, deleteTemplate, exportTemplateFile, parseImportedTemplate, createId } from '../lib/storage'
import { downloadTemplateGuide } from '../lib/guide'
import ShareModal from '../components/ShareModal'

export default function Home() {
  const [templates, setTemplates] = useState(() => Object.values(loadAll()))
  const [toast, setToast] = useState(null)
  const [shareTpl, setShareTpl] = useState(null)
  const fileRef = useRef(null)
  const navigate = useNavigate()
  const toastTimer = useRef(null)

  function notify(message) {
    setToast(message)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }

  function refresh() {
    setTemplates(Object.values(loadAll()))
  }

  function createFrom(factory) {
    const t = factory()
    saveTemplate(t)
    navigate(`/edit/${t.meta.id}`)
  }

  function duplicate(t) {
    const copy = {
      ...t,
      meta: { ...t.meta, id: createId(), name: `${t.meta.name} (copie)` },
      pages: t.pages.map((p) => ({ ...p, elements: p.elements.map((el) => ({ ...el, props: { ...el.props } })) })),
    }
    saveTemplate(copy)
    refresh()
    notify('Gabarit dupliqué')
  }

  function remove(t) {
    if (!window.confirm(`Supprimer « ${t.meta.name} » ?`)) return
    deleteTemplate(t.meta.id)
    refresh()
  }

  function exportOne(t) {
    exportTemplateFile(t)
  }

  function guideOne(t) {
    downloadTemplateGuide(t)
    notify('Guide téléchargé')
  }

  function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const t = parseImportedTemplate(String(reader.result))
        saveTemplate(t)
        refresh()
        notify('Gabarit importé')
      } catch {
        notify('Fichier invalide')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="home">
      <header className="toolbar">
        <div className="brand">
          <span className="logo">▣</span>
          <span className="brand-name">Générateur de PDF</span>
        </div>
        <div className="toolbar-actions">
          <button type="button" className="btn" onClick={() => createFrom(defaultInvoiceTemplate)}>Facture</button>
          <button type="button" className="btn" onClick={() => createFrom(createBlankTemplate)}>Nouveau document</button>
          <button type="button" className="btn" onClick={() => fileRef.current.click()}>Importer un gabarit</button>
          <Link className="btn" to="/aide">Aide</Link>
          <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={handleImport} />
        </div>
      </header>
      <main className="home-main">
        <h1>Vos gabarits</h1>
        {templates.length === 0 ? (
          <div className="home-empty">
            <p>Aucun gabarit pour le moment. Créez-en un pour commencer.</p>
            <button type="button" className="btn primary" onClick={() => createFrom(createBlankTemplate)}>Créer un document</button>
          </div>
        ) : (
          <div className="tpl-grid">
            {templates.map((t) => {
              const { w, h } = pageSizeMm(t.page)
              return (
                <div className="tpl-card" key={t.meta.id}>
                  <div className="tpl-info">
                    <h3>{t.meta.name}</h3>
                    <p>{t.pages.length} page(s) · {Math.round(w)}×{Math.round(h)} mm</p>
                  </div>
                  <div className="tpl-actions">
                    <Link className="btn primary" to={`/edit/${t.meta.id}`}>Modifier</Link>
                    <Link className="btn" to={`/print?template=${t.meta.id}`}>Imprimer</Link>
                    <button type="button" className="btn" onClick={() => setShareTpl(t)}>Partager</button>
                    <button type="button" className="btn" onClick={() => exportOne(t)}>Exporter</button>
                    <button type="button" className="btn" onClick={() => guideOne(t)} title="Télécharger le guide d'utilisation du gabarit">Guide</button>
                    <button type="button" className="btn" onClick={() => duplicate(t)}>Dupliquer</button>
                    <button type="button" className="btn danger" onClick={() => remove(t)}>Supprimer</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
      {shareTpl && <ShareModal template={shareTpl} onClose={() => setShareTpl(null)} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
