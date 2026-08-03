let paletteType = null

export function setPaletteType(type) {
  paletteType = type
}

export function clearPaletteType() {
  paletteType = null
}

export function getPaletteType() {
  return paletteType
}

export function draggedType(e) {
  const t = paletteType || (e.dataTransfer ? e.dataTransfer.getData('text/plain') : '')
  return t || null
}
