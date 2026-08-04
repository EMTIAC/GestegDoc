import { useRef, useState, useCallback, useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import { createBlankTemplate, defaultInvoiceTemplate, pageSizeMm } from '../lib/template'
import { loadAll, saveTemplate, deleteTemplate, exportTemplateFile, parseImportedTemplate, createId, saveToServer, fetchServerTemplates, deleteOnServer } from '../lib/storage'
import { downloadTemplateGuide } from '../lib/guide'
import ShareModal from '../components/ShareModal'
import { useAuth } from '../hooks/useAuth'

export default function Home() {
  const { user, logout } = useAuth()
  const [templates, setTemplates] = useState(() => Object.values(loadAll()))
  const [toast, setToast] = useState(null)
  const [shareTpl, setShareTpl] = useState(null)
  const [serverError, setServerError] = useState(null)
  const fileRef = useRef(null)
  const navigate = useNavigate()
  const toastTimer = useRef(null)

  function notify(message) {
    setToast(message)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }

  const refresh = useCallback(() => {
    const local = loadAll()
    if (!user) {
      setTemplates(Object.values(local))
      setServerError(null)
      return
    }
    setServerError(null)
    fetchServerTemplates()
      .then((remote) => {
        const map = { ...local }
        for (const t of remote) map[t.meta.id] = t
        setTemplates(Object.values(map))
      })
      .catch(() => {
        setServerError('Serveur injoignable — gabarits affichés depuis ce navigateur uniquement.')
        setTemplates(Object.values(local))
      })
  }, [user])

  // Charge les gabarits du serveur au montage et au changement de connexion.
  useEffect(() => {
    refresh()
  }, [refresh])

  function syncToServer(t) {
    if (!user) return Promise.resolve()
    return saveToServer(t).catch(() => notify('Sauvegarde en ligne impossible — gardé localement'))
  }

  function createFrom(factory) {
    const t = factory()
    saveTemplate(t)
    syncToServer(t)
    navigate(`/edit/${t.meta.id}`)
  }

  function duplicate(t) {
    const copy = {
      ...t,
      meta: { ...t.meta, id: createId(), name: `${t.meta.name} (copie)` },
      pages: t.pages.map((p) => ({ ...p, elements: p.elements.map((el) => ({ ...el, props: { ...el.props } })) })),
    }
    saveTemplate(copy)
    syncToServer(copy)
    refresh()
    notify('Gabarit dupliqué')
  }

  function remove(t) {
    if (!window.confirm(`Supprimer « ${t.meta.name} » ?`)) return
    deleteTemplate(t.meta.id)
    if (user) deleteOnServer(t.meta.id).catch(() => notify('Suppression en ligne impossible'))
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
        syncToServer(t)
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
          {user ? (
            <span className="user-chip" title={user.email}>
              {user.name}
              <button type="button" className="btn" onClick={() => logout()}>Déconnexion</button>
            </span>
          ) : (
            <Link className="btn" to="/login">Se connecter</Link>
          )}
          <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={handleImport} />
        </div>
      </header>
      <main className="home-main">
        <h1>Vos gabarits</h1>
        {!user && (
          <p className="home-banner">
            Non connecté — ces gabarits ne sont visibles que sur ce navigateur.{' '}
            <Link to="/login">Connectez-vous</Link> pour les retrouver partout.
          </p>
        )}
        {serverError && <p className="home-banner warn">{serverError}</p>}
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
