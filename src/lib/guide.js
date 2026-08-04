import { pageSizeMm } from './template.js'
import { encodeData } from './url.js'

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

export async function buildGuide(template) {
  const name = template.meta?.name || 'Gabarit'
  const id = template.meta?.id || '?'
  const { w, h } = pageSizeMm(template.page)
  const margin = template.page.margin ?? 0
  const pages = template.pages || []
  const L = []
  // Origine de l'application : nécessaire pour que les URL d'intégration soient
  // absolues et fonctionnent depuis n'importe quel autre projet/site.
  const origin = (typeof window !== 'undefined' && window.location.origin) || ''
  const tplUrl = await encodeData(template)

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
  L.push('Ce gabarit peut être imprimé depuis n’importe quel autre site ou application, de')
  L.push('**trois manières** :')
  L.push('')
  L.push('1. **Gabarit embarqué dans l’URL (`tpl=`)** — aucune dépendance au serveur : le')
  L.push('   gabarit est encodé directement dans le lien. Fonctionne même sans enregistrement.')
  L.push('   Inconvénient : URL longue, limitée par la taille maximale acceptée par le')
  L.push('   navigateur/serveur (à éviter avec de grosses images).')
  L.push('2. **Gabarit enregistré (`template=<id>`)** — URL courte et propre ; le gabarit')
  L.push('   doit être enregistré sur le serveur. **Recommandé.**')
  L.push('3. **API (`POST /api/print`)** — votre serveur appelle l’API, qui répond par une')
  L.push('   redirection vers la page d’impression. Les données ne transitent pas par l’URL.')
  L.push('')
  L.push('Dans tous les cas, les URL sont **absolues** : elles commencent par l’origine de')
  L.push(`cette application (\`${origin}\`) et fonctionnent depuis n’importe quel autre site.`)
  L.push('')
  L.push('### 1. Gabarit embarqué dans l’URL (sans serveur)')
  L.push('')
  if (tplUrl.length <= 30000) {
    L.push('URL prête à l’emploi pour CE gabarit (le gabarit est encodé dedans) :')
    L.push('')
    L.push('```')
    L.push(`${origin}/print?tpl=${tplUrl}&toolbar=0`)
    L.push('```')
    L.push('')
  } else {
    L.push('Ce gabarit contient des données volumineuses (images…) : l’URL `tpl=` serait trop')
    L.push('longue. Utilisez la forme enregistrée ci-dessous, ou le bouton **Partager → URL')
    L.push('portable** de l’éditeur pour générer le lien complet.')
    L.push('')
  }
  L.push('### 2. Gabarit enregistré (URL courte, recommandé)')
  L.push('')
  L.push('```')
  L.push(`${origin}/print?template=${id}&toolbar=0`)
  L.push('```')
  L.push('')
  L.push('### 3. API')
  L.push('')
  L.push('Votre serveur appelle l’API ; celle-ci répond par une redirection 302 vers la page')
  L.push('d’impression (ou un JSON `{ "url": "..." }` avec `?redirect=false`).')
  L.push('')
  L.push('```')
  L.push(`POST ${origin}/api/print`)
  L.push(`{ "templateId": "${id}", "data": { ... }, "autoprint": false, "toolbar": false }`)
  L.push('```')
  L.push('')
  L.push('Options de l’API : `toolbar: false` (mode simple), `download: true`')
  L.push('(télécharge le PDF), `view: true` (lecteur PDF du navigateur).')
  L.push('')
  L.push('### Paramètres communs')
  L.push('')
  L.push('- `data=<base64url JSON>` : injecte les données du document.')
  L.push('- `toolbar=0` : **mode simple utilisateur** — la page s’affiche sans les boutons')
  L.push('  Modifier / Accueil / Aide (recommandé quand le visiteur vient juste imprimer).')
  L.push('  Sans ce paramètre, le mode professionnel conserve ces boutons.')
  L.push('- `autoprint=1` : **optionnel** — déclenche automatiquement la boîte de dialogue')
  L.push('  d’impression du navigateur au chargement. À n’utiliser que si nécessaire')
  L.push('  (sinon elle s’ouvre à chaque chargement ou rechargement de la page).')
  L.push('- `download=1` : **télécharge directement le PDF** dès l’ouverture du lien, sans')
  L.push('  passer par la page d’impression. Idéal pour un bouton « Télécharger » externe.')
  L.push('- `pdf=1` : ouvre le PDF dans le **lecteur PDF natif du navigateur** (avec les')
  L.push('  outils habituels : Enregistrer, Télécharger, Imprimer) au lieu de la page')
  L.push('  d’impression de l’application.')
  L.push('')
  L.push('> La valeur `tpl=` est automatiquement **compressée** : le gabarit est gzippé')
  L.push('> avant l’encodage base64url pour réduire la longueur de l’URL. Les anciens')
  L.push('> liens `tpl=` restent compatibles.')
  L.push('')
  L.push('### Quelle méthode choisir ?')
  L.push('')
  L.push('| | Embarqué (`tpl=`) | Enregistré (`template=`) | API |')
  L.push('|---|---|---|---|')
  L.push('| **Qui l’utilise** | Lien/bouton (navigateur) | Lien/bouton (navigateur) | Votre serveur (appel `fetch`) |')
  L.push('| **Serveur requis** | Non | Oui (gabarit enregistré) | Oui |')
  L.push('| **Résultat** | Page d’impression ouverte | Page d’impression ouverte | Redirection 302 (ou URL en JSON) à suivre |')
  L.push('| **Taille de l’URL** | Longue (limite à respecter) | Courte | Toujours courte (données hors URL) |')
  L.push('| **Usage typique** | Démo, gabarit non enregistré | La plupart des cas | Backend qui construit l’URL |')
  L.push('')
  L.push('**Recommandation** : dans la majorité des cas, utilisez la forme **enregistrée**')
  L.push('(`template=<id>`) avec `toolbar=0`. Passez à l’**API** si vous construisez l’URL')
  L.push('côté serveur ou si l’URL devient trop longue. Réservez `tpl=` aux gabarits simples.')
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

export async function downloadTemplateGuide(template) {
  const content = await buildGuide(template)
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
