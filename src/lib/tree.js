import { uid } from './template'

export function sameList(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i])
}

export function parentOf(path) {
  return path.slice(0, -1)
}

export function updateTree(elements, id, patch) {
  return elements.map((el) => {
    if (el.id === id) return { ...el, props: { ...el.props, ...patch } }
    if (el.type === 'container') return { ...el, children: updateTree(el.children || [], id, patch) }
    return el
  })
}

export function updateLayout(elements, id, patch) {
  const clean = Object.fromEntries(Object.entries(patch).filter(([, v]) => typeof v === 'number' && Number.isFinite(v)))
  if (Object.keys(clean).length === 0) return elements
  return elements.map((el) => {
    if (el.id === id) return { ...el, layout: { ...(el.layout || {}), ...clean } }
    if (el.type === 'container') return { ...el, children: updateLayout(el.children || [], id, patch) }
    return el
  })
}

export function insertAtEnd(elements, element) {
  return [...elements, element]
}

export function insertAfter(elements, path, element) {
  const [head, ...rest] = path
  if (rest.length === 0) {
    return [...elements.slice(0, head + 1), element, ...elements.slice(head + 1)]
  }
  return elements.map((el, i) =>
    i === head ? { ...el, children: insertAfter(el.children || [], rest, element) } : el
  )
}

export function findPath(elements, id, prefix = []) {
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i]
    if (el.id === id) return [...prefix, i]
    if (el.type === 'container') {
      const p = findPath(el.children || [], id, [...prefix, i])
      if (p) return p
    }
  }
  return null
}

export function insertInto(elements, containerId, element) {
  return elements.map((el) => {
    if (el.id === containerId && el.type === 'container') {
      return { ...el, children: [...(el.children || []), element] }
    }
    if (el.type === 'container') return { ...el, children: insertInto(el.children || [], containerId, element) }
    return el
  })
}

export function removeAtPath(elements, path) {
  if (path.length === 1) return elements.filter((_, i) => i !== path[0])
  const [head, ...rest] = path
  return elements.map((el, i) => (i === head ? { ...el, children: removeAtPath(el.children || [], rest) } : el))
}

export function moveAtPath(elements, path, to) {
  if (path.length === 1) {
    const from = path[0]
    const list = [...elements]
    if (to < 0 || to >= list.length || from === to) return list
    const [item] = list.splice(from, 1)
    list.splice(to, 0, item)
    return list
  }
  const [head, ...rest] = path
  return elements.map((el, i) => (i === head ? { ...el, children: moveAtPath(el.children || [], rest, to) } : el))
}

export function deepCopy(el) {
  return {
    ...el,
    id: uid(),
    props: { ...(el.props || {}) },
    layout: el.layout ? { ...el.layout } : el.layout,
    children: el.children ? el.children.map(deepCopy) : el.children,
  }
}

export function duplicateAtPath(elements, path, newId, layoutOffset = null) {
  if (path.length === 1) {
    const idx = path[0]
    const copy = deepCopy(elements[idx])
    copy.id = newId
    if (layoutOffset && copy.layout) {
      copy.layout = {
        ...copy.layout,
        x: Math.round((copy.layout.x + layoutOffset.x) * 10) / 10,
        y: Math.round((copy.layout.y + layoutOffset.y) * 10) / 10,
      }
    }
    const list = [...elements]
    list.splice(idx + 1, 0, copy)
    return list
  }
  const [head, ...rest] = path
  return elements.map((el, i) => (i === head ? { ...el, children: duplicateAtPath(el.children || [], rest, newId, layoutOffset) } : el))
}

export function elementAtPath(elements, path) {
  let node = null
  let list = elements
  for (const idx of path) {
    node = list[idx]
    if (!node) return null
    list = node.children || []
  }
  return node
}

export function findById(elements, id) {
  for (const el of elements) {
    if (el.id === id) return el
    if (el.type === 'container') {
      const found = findById(el.children || [], id)
      if (found) return found
    }
  }
  return null
}

export function extractElement(elements, id) {
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i]
    if (el.id === id) return { element: el, elements: elements.filter((_, j) => j !== i) }
    if (el.type === 'container') {
      const sub = extractElement(el.children || [], id)
      if (sub) {
        return { ...sub, elements: elements.map((e, j) => (j === i ? { ...e, children: sub.elements } : e)) }
      }
    }
  }
  return null
}

export function containsElement(el, id) {
  if (el.id === id) return true
  if (el.type === 'container') return (el.children || []).some((c) => containsElement(c, id))
  return false
}

export function flatten(elements) {
  const out = []
  for (const el of elements) {
    out.push(el)
    if (el.type === 'container') out.push(...flatten(el.children || []))
  }
  return out
}
