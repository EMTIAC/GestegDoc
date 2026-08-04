import { pageSizeMm } from './template'

function slugify(name) {
  return (name || 'document').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

// Attend que toutes les images du document soient chargées (ou en échec) avant la
// capture : sinon le PDF contient des zones vides.
function waitForImages(root) {
  const imgs = Array.from(root.querySelectorAll('img'))
  return Promise.all(
    imgs.map(
      (img) =>
        img.complete
          ? Promise.resolve()
          : new Promise((resolve) => {
              img.addEventListener('load', resolve, { once: true })
              img.addEventListener('error', resolve, { once: true })
            })
    )
  )
}

export async function generateTemplatePdf({ container, page, scale = 3 }) {
  const [{ jsPDF }, { domToCanvas }] = await Promise.all([import('jspdf'), import('modern-screenshot')])
  const root = typeof container === 'string' ? document.querySelector(container) : container
  if (!root) throw new Error('Document introuvable')
  await waitForImages(root)
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
  return pdf
}

export function pdfToBlob(pdf) {
  return pdf.output('blob')
}

export function downloadPdf(pdf, filename) {
  pdf.save(`${slugify(filename)}.pdf`)
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${slugify(filename)}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function downloadTemplatePdf({ container, filename, page, scale = 3 }) {
  const pdf = await generateTemplatePdf({ container, page, scale })
  downloadPdf(pdf, filename)
}
