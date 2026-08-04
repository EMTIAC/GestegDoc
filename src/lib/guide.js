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
  // Origine de l'application : nécessaire pour que les URL d'intégration soient
  // absolues et fonctionnent depuis n'importe quel autre projet/site.
  const origin = (typeof window !== 'undefined' && window.location.origin) || ''

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
  const imageRefs = []
  const tables = []
  const sources = []
  walk(pages.flatMap((p) => p.elements), (el) => {
    const p = el.props || {}
    if (el.type === 'field') fieldRefs.push({ label: p.label, field: p.field })
    if (el.type === 'text' || el.type === 'title') {
      for (const path of textPaths(p.text)) textRefs.push(path)
    }
    if (el.type === 'image') {
      for (const path of textPaths(p.src)) imageRefs.push(path)
    }
    if (el.type === 'table') tables.push({ dataPath: p.dataPath, columns: (p.columns || []).map((c) => `${c.header} → ${c.field}`) })
    if (el.type === 'container' && p.source) sources.push(p.source)
  })

  L.push('## 3. Champs utilisés par les éléments')
  L.push('')
  if (fieldRefs.length || textRefs.length || imageRefs.length || tables.length || sources.length) {
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
    if (imageRefs.length) {
      const uniq = [...new Set(imageRefs)]
      L.push('### Variables dans les URL d’images')
      L.push('')
      L.push('Le gabarit contient des images dont l’URL est dynamique :')
      L.push('')
      for (const path of uniq) L.push(`- \`{{${path}}}\``)
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
  L.push('Ce gabarit peut être imprimé depuis n’importe quel autre site ou application,')
  L.push('de deux manières :')
  L.push('')
  L.push('- **URL directe** — un simple lien qui ouvre la page d’impression avec les données')
  L.push('  (recommandée pour un bouton ou un lien « Imprimer »).')
  L.push('- **API** — votre serveur (ou votre application) appelle l’API et reçoit l’URL')
  L.push('  d’impression à utiliser, ce qui garde les données hors de l’URL finale.')
  L.push('')
  L.push('Dans les deux cas, les URL sont **absolues** : elles commencent par l’origine de')
  L.push(`cette application (\`${origin}\`) et fonctionnent depuis n’importe quel autre site.`)
  L.push('')
  L.push('### URL directe')
  L.push('')
  L.push('Deux formes : **gabarit enregistré** (URL courte, recommandé) ou **gabarit embarqué**')
  L.push('(sans enregistrement préalable, mais URL plus longue).')
  L.push('')
  L.push('```')
  L.push(`# Gabarit enregistré sur le serveur (URL courte, recommandé)`)
  L.push(`${origin}/print?template=${id}&data=<données encodées>&autoprint=1`)
  L.push('')
  L.push(`# Gabarit embarqué dans l’URL (fonctionne sans serveur)`)
  L.push(`${origin}/print?tpl=<gabarit encodé base64url>&data=<données encodées>&autoprint=1`)
  L.push('```')
  L.push('')
  L.push('### API')
  L.push('')
  L.push('Votre serveur appelle l’API ; celle-ci répond par une redirection 302 vers la page')
  L.push('d’impression (ou un JSON `{ "url": "..." }` avec `?redirect=false`).')
  L.push('')
  L.push('```')
  L.push(`POST ${origin}/api/print`)
  L.push(`{ "templateId": "${id}", "data": { ... }, "autoprint": true }`)
  L.push('```')
  L.push('')
  L.push('### Quelle méthode choisir ?')
  L.push('')
  L.push('| | URL directe | API |')
  L.push('|---|---|---|')
  L.push('| **Qui l’utilise** | Le lien/le bouton de votre application (navigateur) | Votre serveur ou application (appel `fetch`/HTTP) |')
  L.push('| **Résultat** | La page d’impression s’ouvre directement | Une redirection (ou une URL en JSON) que vous suivez |')
  L.push('| **Gabarit** | `template=<id>` enregistré, ou `tpl=` embarqué | `templateId` enregistré, ou `template` complet |')
  L.push('| **Taille de l’URL** | Peut devenir très longue avec `tpl=` et de grosses données | Toujours courte (les données ne sont pas dans l’URL) |')
  L.push('| **Usage typique** | Bouton/lien « Imprimer » dans une application | Backend qui construit l’URL d’impression |')
  L.push('')
  L.push('**Recommandation** : dans la majorité des cas, l’**URL directe** avec un gabarit')
  L.push('enregistré suffit. Passez à l’**API** si l’URL devient trop longue ou si vous devez')
  L.push('construire l’URL côté serveur.')
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
