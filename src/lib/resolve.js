export function getPath(obj, path) {
  if (!path) return undefined
  const parts = path.split('.')
  let cur = obj
  for (const p of parts) {
    if (cur == null) return undefined
    cur = cur[p]
  }
  return cur
}

export function substitute(text, data) {
  if (typeof text !== 'string') return text
  return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, path) => {
    const value = getPath(data, path)
    return value === undefined || value === null ? '' : String(value)
  })
}
