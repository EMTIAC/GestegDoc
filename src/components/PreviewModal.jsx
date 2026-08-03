import { useRef, useState } from 'react'
import Document from './Document'
import { downloadTemplatePdf } from '../lib/pdf'

export default function PreviewModal({ template, onClose }) {
  const bodyRef = useRef(null)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState(null)

  async function handleDownload() {
    setDownloading(true)
    setError(null)
    try {
      await downloadTemplatePdf({
        container: bodyRef.current,
        filename: template.meta?.name,
        page: template.page,
      })
    } catch (err) {
      setError("Le PDF n'a pas pu être généré : " + (err?.message || err))
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>Aperçu — {template.meta?.name}</h2>
          <div className="modal-actions">
            <button type="button" className="btn primary" onClick={handleDownload} disabled={downloading}>
              {downloading ? 'Génération…' : 'Télécharger PDF'}
            </button>
            <button type="button" className="btn" onClick={() => window.print()}>Imprimer / PDF</button>
            <button type="button" className="btn" onClick={onClose}>Fermer</button>
          </div>
        </header>
        {error && <div className="print-empty">{error}</div>}
        <div className="modal-body" ref={bodyRef}>
          <Document template={template} />
        </div>
      </div>
    </div>
  )
}
