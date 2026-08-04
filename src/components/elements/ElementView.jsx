import { getPath, substitute } from '../../lib/resolve'
import { elWidth } from '../../lib/template'

export function ElementList({ elements, data }) {
  return (
    <>
      {(elements || []).map((el) => (
        <div key={el.id} className={`pdf-el pdf-el-${el.type}`} style={{ width: elWidth(el) }}>
          <ElementView element={el} data={data} />
        </div>
      ))}
    </>
  )
}

function valueOf(data, field) {
  const raw = getPath(data, field)
  return raw === undefined || raw === null ? '' : String(raw)
}

function TitleElement({ p, data }) {
  return (
    <div
      className="pdf-title"
      style={{
        fontSize: p.size || 26,
        fontWeight: p.bold ? 700 : 400,
        textAlign: p.align || 'left',
        color: p.color || '#111111',
      }}
    >
      {substitute(p.text, data)}
    </div>
  )
}

function TextElement({ p, data }) {
  return (
    <div
      className="pdf-text"
      style={{
        fontSize: p.size || 12,
        fontWeight: p.bold ? 700 : 400,
        textAlign: p.align || 'left',
        color: p.color || '#111111',
      }}
    >
      {substitute(p.text, data)}
    </div>
  )
}

function FieldElement({ p, data }) {
  const label = p.label
    ? <span className="pdf-label" style={{ color: p.labelColor || '#888888' }}>{p.label}{p.label.endsWith(':') ? '' : ' :'}</span>
    : null
  return (
    <div
      className="pdf-field"
      style={{
        fontSize: p.size || 12,
        fontWeight: p.bold ? 700 : 400,
        color: p.color || '#111111',
      }}
    >
      {label}
      <span className="pdf-value">{valueOf(data, p.field)}</span>
    </div>
  )
}

function DividerElement({ p }) {
  return (
    <hr
      className="pdf-divider"
      style={{
        borderTop: `${p.thickness || 1}px solid ${p.color || '#999999'}`,
        marginTop: p.marginTop ?? 10,
        marginBottom: p.marginBottom ?? 10,
      }}
    />
  )
}

function SpacerElement({ p }) {
  return <div className="pdf-spacer" style={{ height: p.height || 20 }} />
}

function TableElement({ p, data }) {
  const rows = Array.isArray(getPath(data, p.dataPath)) ? getPath(data, p.dataPath) : []
  const cols = p.columns || []
  const fontSize = p.fontSize || 12
  const border = `1px solid ${p.borderColor || '#999999'}`
  const cellStyle = (align) => ({ textAlign: align || 'left', border, fontSize, padding: '6px 8px' })
  const headerStyle = (align) => ({ textAlign: align || 'left', border, background: p.headerBg || '#eeeeee', fontSize, padding: '6px 8px' })
  return (
    <table className="pdf-table" style={{ borderCollapse: 'collapse', width: '100%' }}>
      <thead>
        <tr>
          {cols.map((c, i) => (
            <th key={i} style={headerStyle(c.align)}>{c.header || ''}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {cols.map((c, j) => (
              <td key={j} style={cellStyle(c.align)}>{valueOf(row, c.field)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function PageBreakElement() {
  return <div className="pdf-page-break" />
}

function ImageElement({ p, free, data }) {
  const src = substitute(p.src, data)
  if (!src) {
    return (
      <div className="pdf-image-empty" style={{ height: free ? '100%' : `${p.height || 40}mm` }}>
        Image
      </div>
    )
  }
  return (
    <img
      className="pdf-image"
      src={src}
      alt=""
      style={{
        width: '100%',
        height: free ? '100%' : `${p.height || 40}mm`,
        objectFit: p.fit || 'cover',
        borderRadius: `${p.radius || 0}px`,
      }}
    />
  )
}

function ContainerElement({ p, children, free }) {
  return (
    <div
      className="pdf-container"
      style={{
        padding: `${p.padding ?? 12}px`,
        background: p.background || 'transparent',
        border: `${p.borderWidth || 0}px solid ${p.borderColor || '#000000'}`,
        borderRadius: `${p.radius || 0}px`,
        minHeight: `${p.minHeight || 0}px`,
        gap: `${p.gap ?? 8}px`,
        ...(free && !p.source ? { height: '100%', overflow: 'hidden', minHeight: 0 } : {}),
      }}
    >
      {children}
    </div>
  )
}

export default function ElementView({ element, data, free }) {
  const p = element.props || {}
  switch (element.type) {
    case 'title':
      return <TitleElement p={p} data={data} />
    case 'text':
      return <TextElement p={p} data={data} />
    case 'field':
      return <FieldElement p={p} data={data} />
    case 'divider':
      return <DividerElement p={p} />
    case 'spacer':
      return <SpacerElement p={p} />
    case 'table':
      return <TableElement p={p} data={data} />
    case 'image':
      return <ImageElement p={p} free={free} data={data} />
    case 'container': {
      const childrenEls = element.children || []
      if (p.source) {
        const rows = Array.isArray(getPath(data, p.source)) ? getPath(data, p.source) : []
        const instances = rows.length ? rows : [null]
        return (
          <>
            {instances.map((row, i) => (
              <ContainerElement key={i} p={p} free={free}>
                <ElementList elements={childrenEls} data={row || {}} />
              </ContainerElement>
            ))}
          </>
        )
      }
      return (
        <ContainerElement p={p} free={free}>
          <ElementList elements={childrenEls} data={data} />
        </ContainerElement>
      )
    }
    case 'pageBreak':
      return <PageBreakElement />
    default:
      return null
  }
}
