export const ELEMENT_TYPES = {
  title: { label: 'Titre', icon: 'H' },
  text: { label: 'Texte', icon: 'T' },
  field: { label: 'Champ lié', icon: 'ƒ' },
  table: { label: 'Tableau', icon: '≡' },
  divider: { label: 'Séparateur', icon: '―' },
  spacer: { label: 'Espace', icon: '↕' },
  container: { label: 'Bloc', icon: '▣' },
  image: { label: 'Image', icon: '▧' },
  pageBreak: { label: 'Saut de page', icon: '⤓' },
}

export const PAGE_SIZES = {
  A0: { label: 'A0', w: 841, h: 1189, group: 'Série A (ISO)' },
  A1: { label: 'A1', w: 594, h: 841, group: 'Série A (ISO)' },
  A2: { label: 'A2', w: 420, h: 594, group: 'Série A (ISO)' },
  A3: { label: 'A3', w: 297, h: 420, group: 'Série A (ISO)' },
  A4: { label: 'A4', w: 210, h: 297, group: 'Série A (ISO)' },
  A5: { label: 'A5', w: 148, h: 210, group: 'Série A (ISO)' },
  A6: { label: 'A6', w: 105, h: 148, group: 'Série A (ISO)' },
  A7: { label: 'A7', w: 74, h: 105, group: 'Série A (ISO)' },
  A8: { label: 'A8', w: 52, h: 74, group: 'Série A (ISO)' },
  B4: { label: 'B4', w: 250, h: 353, group: 'Série B (ISO)' },
  B5: { label: 'B5', w: 176, h: 250, group: 'Série B (ISO)' },
  B6: { label: 'B6', w: 125, h: 176, group: 'Série B (ISO)' },
  C4: { label: 'C4', w: 229, h: 324, group: 'Enveloppes (ISO)' },
  C5: { label: 'C5', w: 162, h: 229, group: 'Enveloppes (ISO)' },
  C6: { label: 'C6', w: 114, h: 162, group: 'Enveloppes (ISO)' },
  Letter: { label: 'Lettre (Letter)', w: 215.9, h: 279.4, group: 'Formats américains' },
  Legal: { label: 'Légal (Legal)', w: 215.9, h: 355.6, group: 'Formats américains' },
  Ledger: { label: 'Tabloïd (Ledger)', w: 279.4, h: 431.8, group: 'Formats américains' },
  Executive: { label: 'Executive', w: 184.2, h: 266.7, group: 'Formats américains' },
  HalfLetter: { label: 'Demi-lettre', w: 139.7, h: 215.9, group: 'Formats américains' },
  custom: { label: 'Personnalisé', w: 210, h: 297, group: 'Personnalisé' },
}

export const WIDTH_PRESETS = [
  { value: 100, label: '100%' },
  { value: 75, label: '3/4' },
  { value: 66, label: '2/3' },
  { value: 50, label: '1/2' },
  { value: 33, label: '1/3' },
  { value: 25, label: '1/4' },
]

export function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}

export function elWidth(element) {
  const w = Number(element?.props?.width)
  return w && w !== 100 ? `${w}%` : '100%'
}

export function createElement(type) {
  const base = { id: uid(), type, props: { width: 100 } }
  switch (type) {
    case 'title':
      return { ...base, props: { width: 100, text: 'Nouveau titre', size: 26, align: 'left', bold: true, color: '#111111' } }
    case 'text':
      return { ...base, props: { width: 100, text: 'Votre texte ici', size: 12, align: 'left', bold: false, color: '#111111' } }
    case 'field':
      return { ...base, props: { width: 50, label: 'Libellé', field: 'donnees.champ', size: 12, bold: false, color: '#111111', labelColor: '#555555' } }
    case 'table':
      return {
        ...base,
        props: {
          width: 100,
          dataPath: 'lignes',
          fontSize: 12,
          headerBg: '#eeeeee',
          borderColor: '#999999',
          columns: [
            { header: 'Désignation', field: 'designation', align: 'left' },
            { header: 'Montant', field: 'montant', align: 'right' },
          ],
        },
      }
    case 'divider':
      return { ...base, props: { width: 100, thickness: 1, color: '#999999', marginTop: 6, marginBottom: 6 } }
    case 'spacer':
      return { ...base, props: { width: 100, height: 14 } }
    case 'container':
      return {
        ...base,
        props: {
          width: 100,
          source: '',
          padding: 12,
          gap: 8,
          minHeight: 40,
          background: '',
          borderWidth: 0,
          borderColor: '#000000',
          radius: 0,
        },
        children: [],
      }
    case 'pageBreak':
      return { ...base, props: { width: 100 } }
    case 'image':
      return { ...base, props: { width: 50, height: 40, src: '', fit: 'cover', radius: 0 } }
    default:
      return base
  }
}

function elem(type, props) {
  return { id: uid(), type, props }
}

export function createBlankTemplate(name = 'Nouveau document') {
  return {
    meta: { id: uid(), name },
    page: { size: 'A4', orientation: 'portrait', margin: 25, customW: 210, customH: 297 },
    pages: [
      {
        id: uid(),
        layout: 'flow',
        elements: [elem('title', { width: 100, text: name, size: 26, align: 'left', bold: true, color: '#111111' })],
      },
    ],
    data: {},
  }
}

export function defaultInvoiceTemplate() {
  return {
    meta: { id: uid(), name: 'Facture' },
    page: { size: 'A4', orientation: 'portrait', margin: 25, customW: 210, customH: 297 },
    data: {
      entreprise: {
        nom: 'Ma Société SAS',
        adresse: "12 rue de l'Exemple, 75000 Paris",
        email: 'contact@masociete.fr',
        siret: '123 456 789 00011',
      },
      facture: {
        numero: 'FAC-2026-001',
        date: '03/08/2026',
        echeance: '03/09/2026',
        client: 'Jean Dupont',
        totalHT: '1 250,00 €',
        tva: '250,00 €',
        totalTTC: '1 500,00 €',
      },
      lignes: [
        { designation: 'Prestation de conseil', quantite: '10', prix: '120,00 €', total: '1 200,00 €' },
        { designation: 'Frais de dossier', quantite: '1', prix: '50,00 €', total: '50,00 €' },
      ],
    },
    pages: [
      {
        id: uid(),
        layout: 'flow',
        elements: [
          elem('title', { width: 100, text: 'FACTURE', size: 28, align: 'center', bold: true, color: '#111111' }),
          elem('spacer', { width: 100, height: 6 }),
          elem('field', { width: 50, label: 'Émetteur', field: 'entreprise.nom', size: 13, bold: true, color: '#111111', labelColor: '#888888' }),
          elem('field', { width: 50, label: 'SIRET', field: 'entreprise.siret', size: 11, bold: false, color: '#333333', labelColor: '#888888' }),
          elem('field', { width: 33, label: 'Facture n°', field: 'facture.numero', size: 11, bold: false, color: '#333333', labelColor: '#888888' }),
          elem('field', { width: 33, label: 'Date', field: 'facture.date', size: 11, bold: false, color: '#333333', labelColor: '#888888' }),
          elem('field', { width: 33, label: 'Échéance', field: 'facture.echeance', size: 11, bold: false, color: '#333333', labelColor: '#888888' }),
          elem('spacer', { width: 100, height: 8 }),
          elem('text', { width: 100, text: 'Client : {{facture.client}}', size: 13, align: 'left', bold: true, color: '#111111' }),
          elem('divider', { width: 100, thickness: 1, color: '#cccccc', marginTop: 8, marginBottom: 8 }),
          elem('text', { width: 100, text: 'Détail des prestations', size: 14, align: 'left', bold: true, color: '#111111' }),
          elem('table', {
            width: 100,
            dataPath: 'lignes',
            fontSize: 12,
            headerBg: '#eeeeee',
            borderColor: '#999999',
            columns: [
              { header: 'Désignation', field: 'designation', align: 'left' },
              { header: 'Qté', field: 'quantite', align: 'center' },
              { header: 'Prix unitaire', field: 'prix', align: 'right' },
              { header: 'Total', field: 'total', align: 'right' },
            ],
          }),
          elem('spacer', { width: 100, height: 8 }),
          elem('field', { width: 33, label: 'Total HT', field: 'facture.totalHT', size: 12, bold: false, color: '#111111', labelColor: '#888888' }),
          elem('field', { width: 33, label: 'TVA', field: 'facture.tva', size: 12, bold: false, color: '#111111', labelColor: '#888888' }),
          elem('field', { width: 33, label: 'Total TTC', field: 'facture.totalTTC', size: 14, bold: true, color: '#111111', labelColor: '#888888' }),
        ],
      },
    ],
  }
}

export function pageSizeMm(page) {
  const landscape = page.orientation === 'landscape'
  if (page.size === 'custom') {
    const w = Number(page.customW) || 210
    const h = Number(page.customH) || 297
    return landscape ? { w: Math.max(w, h), h: Math.min(w, h) } : { w, h }
  }
  const s = PAGE_SIZES[page.size] || PAGE_SIZES.A4
  return landscape ? { w: s.h, h: s.w } : { w: s.w, h: s.h }
}

export function toPages(elements) {
  const pages = []
  let current = []
  for (const el of elements || []) {
    if (el.type === 'pageBreak') {
      if (current.length) {
        pages.push({ id: uid(), elements: current })
        current = []
      }
    } else {
      current.push(el)
    }
  }
  if (current.length || pages.length === 0) pages.push({ id: uid(), elements: current })
  return pages
}

export function migrateTemplate(template, id) {
  const norm = (pages) => (pages || []).map((pg) => ({ ...pg, layout: pg.layout || 'flow' }))
  if (template && template.meta?.id && Array.isArray(template.pages) && template.data) {
    return { ...template, pages: norm(template.pages) }
  }
  if (!template || typeof template !== 'object') return null
  const pages = Array.isArray(template.pages)
    ? norm(template.pages)
    : norm(toPages(template.elements || []))
  const page = template.page || { size: 'A4', orientation: 'portrait', margin: 25 }
  return {
    meta: { id: id || template.meta?.id || uid(), name: template.meta?.name || 'Gabarit' },
    page: { ...page, customW: page.customW ?? 210, customH: page.customH ?? 297 },
    pages,
    data: template.data || {},
  }
}
