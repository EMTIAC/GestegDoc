import { Link } from 'react-router'
import { useRef } from 'react'

const SAVE_LABELS = {
  saving: 'Synchronisation…',
  saved: 'Enregistré',
  dirty: 'Non enregistré (Ctrl+S)',
  error: 'Échec de synchro',
  offline: 'Hors ligne',
  idle: '',
}

export default function Toolbar({ name, onRename, onPreview, onExport, onImport, onReset, onShare, onGuide, user, saveState, syncMode, onToggleSync, onSaveNow }) {
  const fileRef = useRef(null)
  return (
    <header className="toolbar">
      <Link to="/" className="brand">
        <span className="logo">▣</span>
        <span className="brand-name">Générateur de PDF</span>
      </Link>
      <input
        className="name-input"
        value={name}
        placeholder="Nom du gabarit"
        aria-label="Nom du gabarit"
        onChange={(e) => onRename(e.target.value)}
      />
      <div className="toolbar-actions">
        <button type="button" className="btn" onClick={onGuide} title="Télécharger le guide d'utilisation de ce gabarit">Guide</button>
        <button type="button" className="btn" onClick={onShare}>Partager</button>
        <button type="button" className="btn" onClick={onPreview}>Aperçu</button>
        <button type="button" className="btn primary" onClick={onPreview}>Imprimer / PDF</button>
        <button type="button" className="btn" onClick={onExport}>Exporter</button>
        <button type="button" className="btn" onClick={() => fileRef.current.click()}>Importer</button>
        {user ? (
          <span className="save-status">
            <button
              type="button"
              className={`btn small sync-toggle ${syncMode === 'live' ? 'active' : ''}`}
              onClick={onToggleSync}
              title={syncMode === 'live' ? 'Sauvegarde automatique active — passez en Ctrl+S' : 'Sauvegarde manuelle (Ctrl+S) — passez en automatique'}
            >
              {syncMode === 'live' ? 'Auto' : 'Ctrl+S'}
            </button>
            <span className={`save-dot ${saveState}`} />
            <span className="save-label">{SAVE_LABELS[saveState] || ''}</span>
            <button type="button" className="btn" onClick={onSaveNow} disabled={saveState === 'saving' || saveState === 'offline'}>
              Enregistrer
            </button>
          </span>
        ) : (
          <Link className="btn" to="/login">Se connecter</Link>
        )}
        <button type="button" className="btn danger" onClick={onReset}>Réinitialiser</button>
        <Link className="btn" to="/aide">Aide</Link>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={onImport}
        />
      </div>
    </header>
  )
}
