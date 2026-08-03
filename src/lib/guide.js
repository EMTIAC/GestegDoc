import { pageSizeMm } from './template.js'

function slugify(name) {
  return (name || 'document').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function walk(elements, visit) {
  for (const el of elements || []) {
    visit(el)
    if (el.type === 'container') walk(el.children || [], visit)
  }
}

function textPaths(text) {
  const out = []
  if (typeof text !== 'string') return out
  const re = /\{\{\s*([\w.]+)\s*\}\}/g
  let m
  while ((m = re.exec(text))) out.push(m[1])
  return out
}

function layoutLabel(layout) {
  return layout === 'free' ? 'Libre (positionnement absolu)' : 'Flux (côte à côte)'
}

export function buildGuide(template) {
  const name = template.meta?.name || 'Gabarit'
  const id = template.meta?.id || '?'
  const { w, h } = pageSizeMm(template.page)
  const margin = template.page.margin ?? 0
  const pages = template.pages || []
  const L = []

  L.push(`# Guide — ${name}`)
  L.push('')
  L.push('Ce guide décrit le contenu du gabarit : mise en page, données attendues et')
  L.push('champs utilisés. Il permet de générer des documents avec les bonnes informations.')
  L.push('')
  L.push('## 1. Identité')
  L.push('')
  L.push(`- **Nom** : ${name}`)
  L.push(`- **ID** : ${id}`)
  L.push(`- **Pages** : ${pages.length}`)
  L.push(`- **Format** : ${template.page.size} (${w} × ${h} mm) · ${template.page.orientation === 'landscape' ? 'paysage' : 'portrait'} · marge ${margin} mm`)
  L.push('')

  L.push('## 2. Données attendues')
  L.push('')
  L.push('Le document se remplit avec un objet JSON (voir l’onglet « Données » de l’éditeur).')
  L.push('Les valeurs sont injectées par **chemins à points** (ex. `facture.numero`).')
  L.push('')
  L.push('Structure d’exemple (à adapter) :')
  L.push('')
  L.push('```json')
  L.push(JSON.stringify(template.data || {}, null, 2))
  L.push('```')
  L.push('')

  const fieldRefs = []
  const textRefs = []
  const tables = []
  const sources = []
  walk(pages.flatMap((p) => p.elements), (el) => {
    const p = el.props || {}
    if (el.type === 'field') fieldRefs.push({ label: p.label, field: p.field })
    if (el.type === 'text' || el.type === 'title') {
      for (const path of textPaths(p.text)) textRefs.push(path)
    }
    if (el.type === 'table') tables.push({ dataPath: p.dataPath, columns: (p.columns || []).map((c) => `${c.header} → ${c.field}`) })
    if (el.type === 'container' && p.source) sources.push(p.source)
  })

  L.push('## 3. Champs utilisés par les éléments')
  L.push('')
  if (fieldRefs.length || textRefs.length || tables.length || sources.length) {
    if (fieldRefs.length) {
      L.push('### Champs liés')
      L.push('')
      L.push('| Libellé | Chemin |')
      L.push('|---|---|')
      for (const f of fieldRefs) L.push(`| ${f.label || '—'} | \`${f.field}\` |`)
      L.push('')
    }
    if (textRefs.length) {
      const uniq = [...new Set(textRefs)]
      L.push('### Variables dans les textes')
      L.push('')
      for (const path of uniq) L.push(`- \`${path}\``)
      L.push('')
    }
    if (tables.length) {
      L.push('### Tableaux')
      L.push('')
      for (const t of tables) {
        L.push(`- **Source** : \`${t.dataPath}\``)
        for (const c of t.columns) L.push(`  - ${c}`)
      }
      L.push('')
    }
    if (sources.length) {
      L.push('### Blocs répétés (source)')
      L.push('')
      for (const s of [...new Set(sources)]) L.push(`- \`${s}\` : bloc répété pour chaque ligne du tableau`)
      L.push('')
    }
  } else {
    L.push('Aucun champ de données utilisé (gabarit statique).')
    L.push('')
  }

  L.push('## 4. Pages et mise en page')
  L.push('')
  pages.forEach((pg, i) => {
    L.push(`### Page ${i + 1} — ${layoutLabel(pg.layout)}`)
    if (pg.layout === 'free') {
      L.push('Les éléments sont positionnés en millimètres (X, Y, largeur, hauteur).')
    }
    L.push('')
  })

  L.push('## 5. Impression et intégration')
  L.push('')
  L.push(`### URL d’impression (sans serveur)`)
  L.push('')
  L.push('```')
  L.push(`/print?tpl=<gabarit encodé base64url>&data=<données encodées>&autoprint=1`)
  L.push('```')
  L.push('')
  L.push('### URL d’impression (gabarit enregistré)')
  L.push('')
  L.push('```')
  L.push(`/print?template=${id}&data=<données encodées>&autoprint=1`)
  L.push('```')
  L.push('')
  L.push('### API')
  L.push('')
  L.push('```')
  L.push(`POST /api/print`)
  L.push(`{ "templateId": "${id}", "data": { ... }, "autoprint": true }`)
  L.push('```')
  L.push('')
  L.push('Encodage base64url des données (JavaScript) :')
  L.push('')
  L.push('```js')
  L.push('function encodeB64Url(obj) {')
  L.push('  const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(obj))))')
  L.push('  return b64.replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/, "")')
  L.push('}')
  L.push('```')
  L.push('')

  return L.join('\n')
}

export function downloadTemplateGuide(template) {
  const content = buildGuide(template)
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${slugify(template.meta?.name || 'gabarit')}-guide.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
