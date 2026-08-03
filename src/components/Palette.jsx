import { ELEMENT_TYPES } from '../lib/template'
import { setPaletteType, clearPaletteType } from '../lib/dnd'

export default function Palette({ onAdd }) {
  return (
    <aside className="palette">
      <h2>Éléments</h2>
      <p className="hint">Glissez un élément dans la page (ou cliquez pour l'ajouter)</p>
      <div className="palette-list">
        {Object.entries(ELEMENT_TYPES).map(([type, def]) => (
          <div
            key={type}
            className="palette-item"
            draggable
            onDragStart={(e) => {
              setPaletteType(type)
              e.dataTransfer.setData('text/plain', type)
              e.dataTransfer.effectAllowed = 'copy'
            }}
            onDragEnd={() => clearPaletteType()}
            onClick={() => onAdd(type)}
          >
            <span className="palette-icon">{def.icon}</span>
            <span>{def.label}</span>
          </div>
        ))}
      </div>
    </aside>
  )
}
