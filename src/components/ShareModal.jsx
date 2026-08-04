import { useState } from 'react'
import { encodeData } from '../lib/url'

function fallbackCopy(text) {
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  document.execCommand('copy')
  ta.remove()
}

export default function ShareModal({ template, onClose }) {
  const [copied, setCopied] = useState(null)

  const origin = window.location.origin
  const base = `${origin}/print`
  const portableUrl = `${base}?tpl=${encodeData(template)}`
  const serverUrl = `${base}?template=${encodeURIComponent(template.meta.id)}`

  async function copy(text, key) {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      fallbackCopy(text)
    }
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal share-modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>Partager « {template.meta.name} »</h2>
          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>Fermer</button>
          </div>
        </header>
        <div className="share-body">
          <p className="hint">
            Envoyez l'utilisateur de votre projet sur l'une de ces URLs pour imprimer ce gabarit.
            Ajoutez <code>&amp;data=&lt;base64url JSON&gt;</code> pour injecter les données du document, et{' '}
            <code>&amp;autoprint=1</code> pour déclencher l'impression automatiquement.
          </p>
          <div className="share-row">
            <div className="share-row-main">
              <span className="share-label">URL portable (gabarit inclus, fonctionne partout)</span>
              <input readOnly value={portableUrl} />
            </div>
            <button type="button" className="btn primary" onClick={() => copy(portableUrl, 'portable')}>
              {copied === 'portable' ? 'Copié !' : 'Copier'}
            </button>
          </div>
          <div className="share-row">
            <div className="share-row-main">
              <span className="share-label">URL serveur (gabarit synchronisé sur le serveur)</span>
              <input readOnly value={serverUrl} />
            </div>
            <button type="button" className="btn" onClick={() => copy(serverUrl, 'server')}>
              {copied === 'server' ? 'Copié !' : 'Copier'}
            </button>
          </div>
          <div className="share-note">
            <p>Exemple côté d'une application consommatrice (JavaScript) :</p>
            <pre>{`const origin = "${origin}"; // origine de cette application
const data = { facture: { numero: "FAC-2027-001" } };
const url = origin + "/print?tpl=<votre-gabarit>&data=" + btoa(JSON.stringify(data));
window.location.href = url;`}</pre>
            <p>Ou bien via l'API : <code>POST {origin}/api/print</code> avec <code>{'{ templateId, data, autoprint }'}</code> → le serveur répond par une redirection vers la page d'impression.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
