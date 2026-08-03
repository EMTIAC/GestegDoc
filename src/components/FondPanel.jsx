import { useRef } from 'react'

export default function FondPanel({ page, onChange }) {
  const bg = page.background || {}
  const wm = page.watermark || {}
  const fileRef = useRef(null)

  const setBg = (patch) => onChange({ background: { ...bg, ...patch } })
  const setWm = (patch) => onChange({ watermark: { ...wm, ...patch } })

  function onImage(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setBg({ type: 'image', image: String(reader.result) })
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div className="page-panel fond-panel">
      <p className="hint">Ces réglages s'appliquent à la page active uniquement.</p>
      <div className="prop">
        <span>Fond de la page</span>
        <select value={bg.type || 'none'} onChange={(e) => setBg({ type: e.target.value })}>
          <option value="none">Aucun</option>
          <option value="color">Couleur unie</option>
          <option value="image">Image de fond</option>
        </select>
      </div>
      {bg.type === 'color' && (
        <div className="prop">
          <span>Couleur</span>
          <span className="color-row">
            <input type="color" value={bg.color || '#ffffff'} onChange={(e) => setBg({ color: e.target.value })} />
            <input type="text" value={bg.color || '#ffffff'} onChange={(e) => setBg({ color: e.target.value })} />
          </span>
        </div>
      )}
      {bg.type === 'image' && (
        <>
          <div className="prop">
            <span>Image</span>
            {bg.image ? (
              <div className="bg-preview">
                <img src={bg.image} alt="Fond de page" />
                <div className="bg-preview-actions">
                  <button type="button" className="btn small" onClick={() => fileRef.current.click()}>Changer</button>
                  <button type="button" className="btn small danger" onClick={() => setBg({ type: 'none', image: null })}>Retirer</button>
                </div>
              </div>
            ) : (
              <button type="button" className="btn" onClick={() => fileRef.current.click()}>Choisir une image…</button>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onImage} />
          </div>
          <div className="prop">
            <span>Opacité : {Math.round((bg.opacity ?? 0.3) * 100)} %</span>
            <input type="range" min="0" max="100" value={Math.round((bg.opacity ?? 0.3) * 100)} onChange={(e) => setBg({ opacity: Number(e.target.value) / 100 })} />
          </div>
          <div className="prop">
            <span>Ajustement</span>
            <select value={bg.size || 'cover'} onChange={(e) => setBg({ size: e.target.value })}>
              <option value="cover">Remplir la page</option>
              <option value="contain">Ajuster (sans couper)</option>
            </select>
          </div>
        </>
      )}
      <div className="prop-block">
        <span className="prop-block-title">Filigrane (texte)</span>
        <label className="prop">
          <span>Texte</span>
          <input type="text" value={wm.text || ''} placeholder="ex : CONFIDENTIEL" onChange={(e) => setWm({ text: e.target.value })} />
        </label>
        <label className="prop">
          <span>Opacité : {Math.round((wm.opacity ?? 0.1) * 100)} %</span>
          <input type="range" min="0" max="100" value={Math.round((wm.opacity ?? 0.1) * 100)} onChange={(e) => setWm({ opacity: Number(e.target.value) / 100 })} />
        </label>
        <label className="prop">
          <span>Taille (px)</span>
          <input type="number" min="8" value={wm.size ?? 60} onChange={(e) => setWm({ size: Number(e.target.value) || 60 })} />
        </label>
        <label className="prop">
          <span>Inclinaison (°)</span>
          <input type="number" min="-90" max="90" value={wm.angle ?? -30} onChange={(e) => setWm({ angle: Number(e.target.value) || -30 })} />
        </label>
      </div>
    </div>
  )
}
