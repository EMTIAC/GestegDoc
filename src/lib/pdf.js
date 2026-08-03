import { pageSizeMm } from './template'

function slugify(name) {
  return (name || 'document').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export async function downloadTemplatePdf({ container, filename, page, scale = 3 }) {
  const [{ jsPDF }, { domToCanvas }] = await Promise.all([import('jspdf'), import('modern-screenshot')])
  const root = typeof container === 'string' ? document.querySelector(container) : container
  if (!root) throw new Error('Document introuvable')
  const pages = Array.from(root.querySelectorAll('.pdf-page'))
  if (pages.length === 0) throw new Error('Aucune page à exporter')

  const { w, h } = pageSizeMm(page)
  const landscape = h >= w ? 'portrait' : 'landscape'
  const pdf = new jsPDF({ orientation: landscape, unit: 'mm', format: [w, h], compress: true })

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) pdf.addPage([w, h], landscape)
    const canvas = await domToCanvas(pages[i], {
      scale,
      backgroundColor: '#ffffff',
    })
    const img = canvas.toDataURL('image/jpeg', 0.95)
    pdf.addImage(img, 'JPEG', 0, 0, w, h)
  }

  pdf.save(`${slugify(filename)}.pdf`)
}
