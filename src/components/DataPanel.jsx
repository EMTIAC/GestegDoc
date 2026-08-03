import { useEffect, useState } from 'react'

export default function DataPanel({ data, onApply }) {
  const [text, setText] = useState(() => JSON.stringify(data, null, 2))
  const [error, setError] = useState(null)

  useEffect(() => {
    setText(JSON.stringify(data, null, 2))
  }, [data])

  function apply() {
    try {
      const parsed = JSON.parse(text)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        onApply(parsed)
        setError(null)
      } else {
        setError('Le JSON doit être un objet, ex : { "facture": { "numero": "..." } }')
      }
    } catch (e) {
      setError(`JSON invalide : ${e.message}`)
    }
  }

  return (
    <div className="data-panel">
      <p className="hint">
        Ces valeurs remplissent les champs du document. Les champs référencent des chemins comme{' '}
        <code>facture.numero</code>. Les tableaux (ex : <code>lignes</code>) alimentent les tableaux.
      </p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
      {error && <div className="error">{error}</div>}
      <div className="panel-actions">
        <button type="button" className="btn primary" onClick={apply}>Appliquer</button>
        <button type="button" className="btn" onClick={() => setText(JSON.stringify(data, null, 2))}>Annuler</button>
      </div>
    </div>
  )
}
