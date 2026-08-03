export default function PageStrip({ pages, activeIndex, onSelect, onAdd, onRemove, onMove }) {
  return (
    <div className="page-strip">
      {pages.map((p, i) => (
        <div
          key={p.id}
          className={`page-chip ${i === activeIndex ? 'active' : ''}`}
          onClick={() => onSelect(i)}
        >
          <span className="chip-label">Page {i + 1}</span>
          {pages.length > 1 && (
            <span className="chip-actions" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                title="Déplacer à gauche"
                disabled={i === 0}
                onClick={() => onMove(i, i - 1)}
              >◀</button>
              <button
                type="button"
                title="Déplacer à droite"
                disabled={i === pages.length - 1}
                onClick={() => onMove(i, i + 1)}
              >▶</button>
              <button type="button" title="Supprimer la page" onClick={() => onRemove(i)}>✕</button>
            </span>
          )}
        </div>
      ))}
      <button type="button" className="chip-add" onClick={onAdd}>+ Page</button>
    </div>
  )
}
