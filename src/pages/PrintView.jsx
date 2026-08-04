import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { getTemplate } from '../lib/storage'
import { decodeData } from '../lib/url'
import { generateTemplatePdf, pdfToBlob, downloadBlob, downloadPdf } from '../lib/pdf'
import Document from '../components/Document'
import { CacheBustContext } from '../lib/bustContext'
import usePrintPageStyle from '../hooks/usePrintPageStyle'

export default function PrintView() {
  const [params] = useSearchParams()
  const tplParam = params.get('tpl')
  const templateId = params.get('template')
  const dataParam = params.get('data')
  const autoprint = params.get('autoprint') === '1'
  // `download=1` : télécharge le PDF dès l'ouverture du lien (l'utilisateur n'a
  // rien à cliquer). `pdf=1` : ouvre le PDF dans le lecteur PDF natif du
  // navigateur (avec ses propres boutons Enregistrer / Télécharger / Imprimer).
  const autoDownload = params.get('download') === '1'
  const nativeView = params.get('pdf') === '1'
  // Mode « simple utilisateur » : masque les boutons d'administration
  // (Modifier / Accueil / Aide) réservés au propriétaire du gabarit.
  const toolbarHidden = params.get('toolbar') === '0' || params.get('toolbar') === 'hide'

  const [template, setTemplate] = useState(null)
  const [error, setError] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState(null)

  // Cache-busting : stable pour toute la durée de vie de la page (rechargement
  // frais des images externes à chaque ouverture du lien, sans recharger à chaque
  // re-rendu).
  const bustKey = useMemo(() => Date.now().toString(36), [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      let tpl = null
      try {
        if (tplParam) {
          tpl = await decodeData(tplParam)
        } else if (templateId) {
          tpl = getTemplate(templateId)
          if (!tpl) {
            const res = await fetch(`/api/templates/${encodeURIComponent(templateId)}`, { cache: 'no-store' })
            if (res.ok) {
              const json = await res.json()
              if (json && !json.error) tpl = json
            }
          }
        }
        if (tpl && dataParam) tpl = { ...tpl, data: await decodeData(dataParam) }
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

  // Génération automatique : download=1 télécharge le fichier, pdf=1 l'ouvre dans
  // le lecteur PDF du navigateur (redirection vers l'URL blob du PDF).
  useEffect(() => {
    if (!template || (!autoDownload && !nativeView)) return
    let cancelled = false
    const t = setTimeout(async () => {
      setDownloading(true)
      setDownloadError(null)
      try {
        const pdf = await generateTemplatePdf({
          container: '.print-preview',
          page: template.page,
        })
        if (cancelled) return
        if (nativeView) {
          const url = URL.createObjectURL(pdfToBlob(pdf))
          // Lecture dans le lecteur natif : nouvel onglet si le navigateur l'autorise,
          // sinon on navigue vers le PDF généré.
          const win = window.open(url, '_blank')
          if (!win) window.location.href = url
        } else {
          downloadBlob(pdfToBlob(pdf), template.meta?.name)
          setDownloading(false)
        }
      } catch (err) {
        if (cancelled) return
        setDownloading(false)
        setDownloadError("Le PDF n'a pas pu être généré : " + (err?.message || err))
      }
    }, 800)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [template, autoDownload, nativeView])

  usePrintPageStyle(template)

  async function handleDownload() {
    if (!template) return
    setDownloading(true)
    setDownloadError(null)
    try {
      const pdf = await generateTemplatePdf({
        container: '.print-preview',
        page: template.page,
      })
      downloadPdf(pdf, template.meta?.name)
    } catch (err) {
      setDownloadError("Le PDF n'a pas pu être généré : " + (err?.message || err))
    } finally {
      setDownloading(false)
    }
  }

  return (
    <CacheBustContext.Provider value={bustKey}>
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
            {!toolbarHidden && templateId && <Link className="btn" to={`/edit/${templateId}`}>Modifier</Link>}
            {!toolbarHidden && <Link className="btn" to="/">Accueil</Link>}
            {!toolbarHidden && <Link className="btn" to="/aide">Aide</Link>}
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
    </CacheBustContext.Provider>
  )
}
