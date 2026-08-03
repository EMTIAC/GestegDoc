import { pageSizeMm } from './template.js'

const MM_PER_INCH = 25.4

export function contentBox(page, widthPx = 0) {
  const { w, h } = pageSizeMm(page)
  const margin = Number(page.margin) || 0
  const cw = w - 2 * margin
  const ch = h - 2 * margin
  const mpp = widthPx > 0 ? cw / widthPx : MM_PER_INCH / 96
  return { width: cw, height: ch, mpp }
}

export function defaultHeight(element) {
  const props = element.props || {}
  if (element.type === 'title') return 14
  if (element.type === 'text') return 8
  if (element.type === 'divider') return 6
  if (element.type === 'spacer') return Number(props.height) || 14
  if (element.type === 'field') return 8
  if (element.type === 'image') return Number(props.height) || 40
  if (element.type === 'table') return 30
  if (element.type === 'container') return 30
  return 12
}

export function autoLayout(elements, contentW) {
  const width = contentW || 190
  const gap = 4
  const rows = []
  let cur = { y: 0, els: [], w: 0, h: 0 }
  for (const el of elements || []) {
    const widthPct = Math.max(5, Math.min(100, Number(el.props?.width) || 100))
    const w = Math.round((width * widthPct) / 100 * 10) / 10
    const full = el.props?.width === undefined || el.props?.width === 100
    if (cur.els.length && (full || cur.w + (cur.els.length ? gap : 0) + w > width)) {
      rows.push(cur)
      cur = { y: cur.y + cur.h, els: [], w: 0, h: 0 }
    }
    const h = defaultHeight(el)
    cur.els.push(el)
    cur.w += w + (cur.els.length > 1 ? gap : 0)
    cur.h = Math.max(cur.h, h)
  }
  if (cur.els.length) rows.push(cur)

  const result = []
  for (const row of rows) {
    let rx = 0
    for (const el of row.els) {
      const w = Math.round((width * (Number(el.props?.width) || 100)) / 100 * 10) / 10
      result.push({ ...el, layout: { x: Math.round(rx * 10) / 10, y: Math.round(row.y * 10) / 10, w, h: defaultHeight(el) } })
      rx += w + gap
    }
  }
  return result
}

export function snap(value, targets, threshold = 2) {
  let best = null
  let bestDist = threshold
  for (const t of targets) {
    const d = Math.abs(value - t)
    if (d < bestDist) {
      bestDist = d
      best = t
    }
  }
  return best
}

export function round1(v) {
  return Math.round(v * 10) / 10
}
