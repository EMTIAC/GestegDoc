import { Link } from 'react-router'
import { useRef } from 'react'

export default function Toolbar({ name, onRename, onPreview, onExport, onImport, onReset, onSaveServer, onShare, onGuide, saving }) {
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
        <button type="button" className="btn" onClick={onSaveServer} disabled={saving}>
          {saving ? 'Envoi…' : 'Enregistrer serveur'}
        </button>
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
