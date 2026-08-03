import { useEffect } from 'react'
import { pageSizeMm } from '../lib/template'

export default function usePrintPageStyle(template) {
  useEffect(() => {
    if (!template) return
    let el = document.getElementById('pdf-print-style')
    if (!el) {
      el = document.createElement('style')
      el.id = 'pdf-print-style'
      document.head.appendChild(el)
    }
    const { w, h } = pageSizeMm(template.page)
    const size = template.page.size === 'custom' ? `${w}mm ${h}mm` : `${template.page.size} ${template.page.orientation}`
    el.textContent = `@media print { @page { size: ${size}; margin: 0; } }`
  }, [template])
}
