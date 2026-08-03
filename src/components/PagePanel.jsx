import { PAGE_SIZES } from '../lib/template'

export default function PagePanel({ page, onChange, layout, onLayoutModeChange }) {
  const set = (patch) => onChange(patch)
  const custom = page.size === 'custom'
  const groups = [...new Set(Object.values(PAGE_SIZES).map((s) => s.group))]

  return (
    <div className="page-panel">
      <p className="hint">Règle le format et l'impression. Le format s'applique à toutes les pages du document.</p>
      <div className="prop">
        <span>Mise en page de la page active</span>
        <div className="width-presets">
          <button
            type="button"
            className={`btn small ${layout !== 'free' ? 'active' : ''}`}
            onClick={() => onLayoutModeChange('flow')}
          >
            Flux
          </button>
          <button
            type="button"
            className={`btn small ${layout === 'free' ? 'active' : ''}`}
            onClick={() => onLayoutModeChange('free')}
          >
            Libre
          </button>
        </div>
        <p className="hint">
          Libre : positionnez chaque élément à la souris (glisser-déposer), avec aimantation et guides d'alignement.
        </p>
      </div>
      <label className="prop">
        <span>Format</span>
        <select value={page.size} onChange={(e) => set({ size: e.target.value })}>
          {groups.map((g) => (
            <optgroup key={g} label={g}>
              {Object.entries(PAGE_SIZES)
                .filter(([, v]) => v.group === g)
                .map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
            </optgroup>
          ))}
        </select>
      </label>
      <label className="prop">
        <span>Orientation</span>
        <select value={page.orientation} onChange={(e) => set({ orientation: e.target.value })}>
          <option value="portrait">Portrait</option>
          <option value="landscape">Paysage</option>
        </select>
      </label>
      <label className="prop">
        <span>Marge (mm)</span>
        <input
          type="number"
          min="0"
          value={page.margin ?? 0}
          onChange={(e) => set({ margin: Math.max(0, Number(e.target.value) || 0) })}
        />
      </label>
      {custom && (
        <>
          <label className="prop">
            <span>Largeur personnalisée (mm)</span>
            <input
              type="number"
              min="1"
              value={page.customW ?? 210}
              onChange={(e) => set({ customW: Number(e.target.value) || 210 })}
            />
          </label>
          <label className="prop">
            <span>Hauteur personnalisée (mm)</span>
            <input
              type="number"
              min="1"
              value={page.customH ?? 297}
              onChange={(e) => set({ customH: Number(e.target.value) || 297 })}
            />
          </label>
        </>
      )}
    </div>
  )
}
