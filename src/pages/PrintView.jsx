import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { getTemplate } from '../lib/storage'
import { decodeData } from '../lib/url'
import { downloadTemplatePdf } from '../lib/pdf'
import Document from '../components/Document'
import usePrintPageStyle from '../hooks/usePrintPageStyle'

export default function PrintView() {
  const [params] = useSearchParams()
  const tplParam = params.get('tpl')
  const templateId = params.get('template')
  const dataParam = params.get('data')
  const autoprint = params.get('autoprint') === '1'

  const [template, setTemplate] = useState(null)
  const [error, setError] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      let tpl = null
      try {
        if (tplParam) {
          tpl = decodeData(tplParam)
        } else if (templateId) {
          tpl = getTemplate(templateId)
          if (!tpl) {
            const res = await fetch(`/api/templates/${encodeURIComponent(templateId)}`)
            if (res.ok) {
              const json = await res.json()
              if (json && !json.error) tpl = json
            }
          }
        }
        if (tpl && dataParam) tpl = { ...tpl, data: decodeData(dataParam) }
      } catch {
        setError('Paramètres d’URL invalides.')
      }
      if (cancelled) return
      if (!tpl) {
        setError(tplParam || templateId ? 'Gabarit introuvable.' : 'Aucun gabarit spécifié.')
      } else {
        setTemplate(tpl)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [tplParam, templateId, dataParam])

  useEffect(() => {
    if (!template || !autoprint) return
    const t = setTimeout(() => window.print(), 700)
    return () => clearTimeout(t)
  }, [template, autoprint])

  usePrintPageStyle(template)

  async function handleDownload() {
    if (!template) return
    setDownloading(true)
    setDownloadError(null)
    try {
      await downloadTemplatePdf({
        container: '.print-preview',
        filename: template.meta?.name,
        page: template.page,
      })
    } catch (err) {
      setDownloadError("Le PDF n'a pas pu être généré : " + (err?.message || err))
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="print-view">
      <header className="toolbar">
        <Link to="/" className="brand">
          <span className="logo">▣</span>
          <span className="brand-name">Générateur de PDF</span>
        </Link>
        <span className="print-title">
          {template ? template.meta?.name : 'Impression'}
          {template && <span className="print-sub"> · {template.pages.length} page(s)</span>}
        </span>
        <div className="toolbar-actions">
          <button type="button" className="btn primary" onClick={handleDownload} disabled={!template || downloading}>
            {downloading ? 'Génération…' : 'Télécharger PDF'}
          </button>
          <button type="button" className="btn" onClick={() => window.print()} disabled={!template}>
            Imprimer / PDF
          </button>
          {templateId && <Link className="btn" to={`/edit/${templateId}`}>Modifier</Link>}
          <Link className="btn" to="/">Accueil</Link>
          <Link className="btn" to="/aide">Aide</Link>
        </div>
      </header>
      {downloadError && <div className="print-empty">{downloadError}</div>}
      {error && (
        <div className="print-empty">
          <p>{error}</p>
          <Link className="btn" to="/">Retour à l'accueil</Link>
        </div>
      )}
      {!template && !error && <div className="print-empty">Chargement du gabarit…</div>}
      {template && (
        <div className="print-preview">
          <Document template={template} />
        </div>
      )}
      {template && (
        <div id="print-root" aria-hidden="true">
          <Document template={template} />
        </div>
      )}
    </div>
  )
}
