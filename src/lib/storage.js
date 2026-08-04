import { uid, migrateTemplate } from './template'

const KEY_ALL = 'get_pdf_templates_v2'
const KEY_LEGACY = 'get_pdf_template_v1'

export function loadAll() {
  try {
    const raw = localStorage.getItem(KEY_ALL)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
    }
  } catch {
    // ignore
  }
  return migrateLegacy()
}

function migrateLegacy() {
  const map = {}
  try {
    const raw = localStorage.getItem(KEY_LEGACY)
    if (raw) {
      const legacy = JSON.parse(raw)
      const migrated = migrateTemplate(legacy, 'gabarit-1')
      if (migrated) map[migrated.meta.id] = migrated
    }
  } catch {
    // ignore
  }
  return map
}

function saveAll(map) {
  try {
    localStorage.setItem(KEY_ALL, JSON.stringify(map))
  } catch {
    // ignore
  }
}

export function getTemplate(id) {
  return loadAll()[id] || null
}

export function saveTemplate(template) {
  const map = loadAll()
  map[template.meta.id] = template
  saveAll(map)
}

export function deleteTemplate(id) {
  const map = loadAll()
  delete map[id]
  saveAll(map)
}

export function clearTemplates() {
  try {
    localStorage.removeItem(KEY_ALL)
  } catch {
    // ignore
  }
}

export function exportTemplateFile(template) {
  const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const base = (template.meta?.name || 'gabarit').toLowerCase().replace(/\s+/g, '-')
  a.href = url
  a.download = `${base}.pdf-gabarit.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function parseImportedTemplate(text) {
  const parsed = JSON.parse(text)
  const migrated = migrateTemplate(parsed)
  if (!migrated) throw new Error('Structure de gabarit invalide')
  return migrated
}

export function saveToServer(template) {
  return fetch(`/api/templates/${encodeURIComponent(template.meta.id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(template),
  }).then((r) => {
    if (!r.ok) throw new Error(`Erreur serveur ${r.status}`)
    return r.json()
  })
}

export function fetchServerTemplates() {
  return fetch('/api/templates', { credentials: 'same-origin' }).then((r) => {
    if (!r.ok) throw new Error(`Erreur serveur ${r.status}`)
    return r.json()
  })
}

export function deleteOnServer(id) {
  return fetch(`/api/templates/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  }).then((r) => {
    if (!r.ok) throw new Error(`Erreur serveur ${r.status}`)
    return r.json()
  })
}

export function createId() {
  return uid()
}
