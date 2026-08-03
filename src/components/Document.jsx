import { pageSizeMm } from '../lib/template'
import ElementView, { ElementList } from './elements/ElementView'
import PageBackdrop from './PageBackdrop'
import { contentBox } from '../lib/layout'

function FreePage({ page, data, pageSettings }) {
  const box = contentBox(pageSettings)
  return (
    <div className="pdf-free" style={{ width: `${box.width}mm`, minHeight: `${box.height}mm`, position: 'relative' }}>
      {page.elements.map((el) => {
        const L = el.layout || { x: 0, y: 0, w: 100, h: 20 }
        return (
          <div
            key={el.id}
            className={`pdf-el-free pdf-el-${el.type}`}
            style={{ left: `${L.x}mm`, top: `${L.y}mm`, width: `${L.w}mm`, height: `${L.h}mm` }}
          >
            <ElementView element={el} data={data} free />
          </div>
        )
      })}
    </div>
  )
}

export default function Document({ template }) {
  const { w, h } = pageSizeMm(template.page)
  const margin = template.page.margin ?? 25
  return (
    <div className="doc">
      {template.pages.map((page, i) => (
        <div
          key={page.id}
          className={`pdf-page ${i === template.pages.length - 1 ? 'last' : ''}`}
          style={{ width: `${w}mm`, minHeight: `${h}mm`, padding: `${margin}mm` }}
        >
          <PageBackdrop page={page} />
          {page.layout === 'free' ? (
            <FreePage page={page} data={template.data} pageSettings={template.page} />
          ) : (
            <div className="pdf-content">
              <ElementList elements={page.elements} data={template.data} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
