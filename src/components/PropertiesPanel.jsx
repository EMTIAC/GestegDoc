import { useRef } from 'react'
import { WIDTH_PRESETS } from '../lib/template'

function Text({ label, value, onChange, placeholder }) {
  return (
    <label className="prop">
      <span>{label}</span>
      <input type="text" value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

function Num({ label, value, onChange, min, step }) {
  return (
    <label className="prop">
      <span>{label}</span>
      <input
        type="number"
        value={value ?? ''}
        min={min}
        step={step}
        onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
      />
    </label>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="prop">
      <span>{label}</span>
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  )
}

function Checkbox({ label, value, onChange }) {
  return (
    <label className="prop check">
      <span>{label}</span>
      <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
    </label>
  )
}

function Color({ label, value, onChange, allowClear }) {
  return (
    <label className="prop">
      <span>{label}</span>
      <span className="color-row">
        <input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)} />
        <input type="text" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
        {allowClear && (
          <button type="button" className="btn small" title="Transparent" onClick={() => onChange('')}>∅</button>
        )}
      </span>
    </label>
  )
}

function WidthControl({ value, onChange }) {
  return (
    <div className="prop">
      <span>Largeur</span>
      <div className="width-presets">
        {WIDTH_PRESETS.map((w) => (
          <button
            key={w.value}
            type="button"
            className={`btn small ${Number(value) === w.value ? 'active' : ''}`}
            onClick={() => onChange(w.value)}
          >
            {w.label}
          </button>
        ))}
      </div>
      <p className="hint">Une largeur inférieure à 100 % place l'élément côte à côte avec les suivants.</p>
    </div>
  )
}

const ALIGN_OPTIONS = [
  { value: 'left', label: 'Gauche' },
  { value: 'center', label: 'Centre' },
  { value: 'right', label: 'Droite' },
]

function TextCommon({ p, set }) {
  return (
    <>
      <WidthControl value={p.width ?? 100} onChange={(v) => set({ width: v })} />
      <Text label="Contenu" value={p.text} placeholder="Texte ({{champ}} accepté)" onChange={(v) => set({ text: v })} />
      <Num label="Taille (px)" value={p.size} onChange={(v) => set({ size: v })} min={6} />
      <Select label="Alignement" value={p.align} onChange={(v) => set({ align: v })} options={ALIGN_OPTIONS} />
      <Checkbox label="Gras" value={p.bold} onChange={(v) => set({ bold: v })} />
      <Color label="Couleur" value={p.color} onChange={(v) => set({ color: v })} />
    </>
  )
}

function FieldForm({ p, set }) {
  return (
    <>
      <WidthControl value={p.width ?? 100} onChange={(v) => set({ width: v })} />
      <Text label="Libellé" value={p.label} onChange={(v) => set({ label: v })} />
      <Text label="Chemin du champ" value={p.field} placeholder="ex : facture.numero" onChange={(v) => set({ field: v })} />
      <Num label="Taille (px)" value={p.size} onChange={(v) => set({ size: v })} min={6} />
      <Checkbox label="Gras" value={p.bold} onChange={(v) => set({ bold: v })} />
      <Color label="Couleur du texte" value={p.color} onChange={(v) => set({ color: v })} />
      <Color label="Couleur du libellé" value={p.labelColor} onChange={(v) => set({ labelColor: v })} />
    </>
  )
}

function TableForm({ p, set }) {
  function updateCol(i, patch) {
    const columns = (p.columns || []).map((c, idx) => (idx === i ? { ...c, ...patch } : c))
    set({ columns })
  }
  function addCol() {
    set({ columns: [...(p.columns || []), { header: 'Colonne', field: 'champ', align: 'left' }] })
  }
  function removeCol(i) {
    set({ columns: (p.columns || []).filter((_, idx) => idx !== i) })
  }
  return (
    <>
      <WidthControl value={p.width ?? 100} onChange={(v) => set({ width: v })} />
      <Text label="Source des lignes" value={p.dataPath} placeholder="ex : lignes" onChange={(v) => set({ dataPath: v })} />
      <Num label="Taille du texte (px)" value={p.fontSize} onChange={(v) => set({ fontSize: v })} min={6} />
      <Color label="Fond de l'en-tête" value={p.headerBg} onChange={(v) => set({ headerBg: v })} />
      <Color label="Couleur des bordures" value={p.borderColor} onChange={(v) => set({ borderColor: v })} />
      <div className="prop-block">
        <span className="prop-block-title">Colonnes</span>
        {(p.columns || []).map((c, i) => (
          <div className="col-row" key={i}>
            <input
              type="text"
              value={c.header ?? ''}
              placeholder="En-tête"
              onChange={(e) => updateCol(i, { header: e.target.value })}
            />
            <input
              type="text"
              value={c.field ?? ''}
              placeholder="Champ"
              onChange={(e) => updateCol(i, { field: e.target.value })}
            />
            <select value={c.align ?? 'left'} onChange={(e) => updateCol(i, { align: e.target.value })}>
              <option value="left">G</option>
              <option value="center">C</option>
              <option value="right">D</option>
            </select>
            <button type="button" className="btn icon danger" onClick={() => removeCol(i)}>✕</button>
          </div>
        ))}
        <button type="button" className="btn small" onClick={addCol}>+ Colonne</button>
      </div>
    </>
  )
}

function DividerForm({ p, set }) {
  return (
    <>
      <WidthControl value={p.width ?? 100} onChange={(v) => set({ width: v })} />
      <Num label="Épaisseur (px)" value={p.thickness} onChange={(v) => set({ thickness: v })} min={1} />
      <Color label="Couleur" value={p.color} onChange={(v) => set({ color: v })} />
      <Num label="Marge haut (px)" value={p.marginTop} onChange={(v) => set({ marginTop: v })} min={0} />
      <Num label="Marge bas (px)" value={p.marginBottom} onChange={(v) => set({ marginBottom: v })} min={0} />
    </>
  )
}

function ContainerForm({ p, set }) {
  return (
    <>
      <WidthControl value={p.width ?? 100} onChange={(v) => set({ width: v })} />
      <Text
        label="Source des données (répétition)"
        value={p.source}
        placeholder="vide = bloc fixe (ex : clients)"
        onChange={(v) => set({ source: v })}
      />
      <p className="hint">
        Vide : bloc fixe. Renseigné (ex : <code>clients</code>) : le bloc est répété pour chaque ligne du tableau,
        et ses champs se lisent dans chaque ligne.
      </p>
      <Num label="Marge intérieure (px)" value={p.padding} onChange={(v) => set({ padding: v })} min={0} />
      <Num label="Espacement interne (px)" value={p.gap} onChange={(v) => set({ gap: v })} min={0} />
      <Num label="Hauteur mini (px)" value={p.minHeight} onChange={(v) => set({ minHeight: v })} min={0} />
      <Color label="Fond" value={p.background} onChange={(v) => set({ background: v })} allowClear />
      <Num label="Épaisseur bordure (px)" value={p.borderWidth} onChange={(v) => set({ borderWidth: v })} min={0} />
      <Color label="Couleur bordure" value={p.borderColor} onChange={(v) => set({ borderColor: v })} />
      <Num label="Rayon (px)" value={p.radius} onChange={(v) => set({ radius: v })} min={0} />
    </>
  )
}

function ImageForm({ p, set, contentW }) {
  const fileRef = useRef(null)
  function onFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => set({ src: String(reader.result) })
    reader.readAsDataURL(file)
    e.target.value = ''
  }
  function applyRatio() {
    const img = new Image()
    img.onload = () => {
      if (img.naturalWidth) {
        const widthMm = ((contentW || 190) * (Number(p.width) || 100)) / 100
        set({ height: Math.round((widthMm * img.naturalHeight) / img.naturalWidth * 10) / 10 })
      }
    }
    img.src = p.src
  }
  return (
    <>
      <WidthControl value={p.width ?? 100} onChange={(v) => set({ width: v })} />
      <Text
        label="URL de l'image"
        value={p.src}
        placeholder="https://... data:... ou {{chemin.donnee}}"
        onChange={(v) => set({ src: v })}
      />
      <p className="hint">L'URL accepte les données dynamiques : utilisez <code>{'{{chemin.donnee}}'}</code> (ex. <code>{'{{facture.logo_url}}'}</code>).</p>
      <div className="prop">
        <span>Ou importer un fichier</span>
        <span className="btn-row">
          <button type="button" className="btn small" onClick={() => fileRef.current?.click()}>Choisir…</button>
        </span>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFile} />
      </div>
      {p.src && <div className="img-preview"><img src={p.src} alt="" /></div>}
      <Num label="Hauteur (mm)" value={p.height} onChange={(v) => set({ height: v })} min={1} />
      <div className="prop">
        <span />
        <button type="button" className="btn small" onClick={applyRatio}>Ajuster la hauteur au ratio</button>
      </div>
      <Select
        label="Ajustement"
        value={p.fit}
        onChange={(v) => set({ fit: v })}
        options={[
          { value: 'cover', label: 'Remplir (cover)' },
          { value: 'contain', label: 'Contenir (contain)' },
          { value: 'fill', label: 'Étirer (fill)' },
        ]}
      />
      <Num label="Rayon (px)" value={p.radius} onChange={(v) => set({ radius: v })} min={0} />
    </>
  )
}

export default function PropertiesPanel({ element, onChange, free, contentW, onLayoutChange }) {
  if (!element) {
    return <div className="panel-empty">Sélectionnez un élément pour éditer ses propriétés.</div>
  }
  const p = element.props
  const set = (patch) => onChange(element.id, patch)
  const L = element.layout || { x: 0, y: 0, w: 100, h: 20 }

  let form
  if (element.type === 'title') form = <TextCommon p={p} set={set} />
  else if (element.type === 'text') form = <TextCommon p={p} set={set} />
  else if (element.type === 'field') form = <FieldForm p={p} set={set} />
  else if (element.type === 'table') form = <TableForm p={p} set={set} />
  else if (element.type === 'divider') form = <DividerForm p={p} set={set} />
  else if (element.type === 'container') form = <ContainerForm p={p} set={set} />
  else if (element.type === 'image') form = <ImageForm p={p} set={set} contentW={contentW} />
  else if (element.type === 'spacer')
    form = (
      <>
        <WidthControl value={p.width ?? 100} onChange={(v) => set({ width: v })} />
        <Num label="Hauteur (px)" value={p.height} onChange={(v) => set({ height: v })} min={1} />
      </>
    )
  else if (element.type === 'pageBreak')
    form = <p className="hint">Le saut de page n'est plus utilisé : créez plutôt une nouvelle page via le bandeau de pages.</p>

  return (
    <div className="props-panel">
      {free && element.layout && (
        <div className="free-geometry">
          <Num label="X (mm)" value={L.x} onChange={(v) => onLayoutChange(element.id, { x: v })} />
          <Num label="Y (mm)" value={L.y} onChange={(v) => onLayoutChange(element.id, { y: v })} />
          <Num label="L (mm)" value={L.w} onChange={(v) => onLayoutChange(element.id, { w: v })} min={5} />
          <Num label="H (mm)" value={L.h} onChange={(v) => onLayoutChange(element.id, { h: v })} min={5} />
        </div>
      )}
      {form}
    </div>
  )
}
