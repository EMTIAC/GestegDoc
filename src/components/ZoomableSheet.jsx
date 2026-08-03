import { useLayoutEffect, useRef, useState } from 'react'

export default function ZoomableSheet({ children, zoom }) {
  const outerRef = useRef(null)
  const innerRef = useRef(null)
  const [dims, setDims] = useState({ w: 0, h: 0 })

  useLayoutEffect(() => {
    const measure = () => {
      const el = innerRef.current
      if (!el) return
      setDims((d) => {
        const w = el.offsetWidth
        const h = el.offsetHeight
        return d.w === w && d.h === h ? d : { w, h }
      })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const fitScale = dims.w ? Math.max(0.05, (outerRef.current?.clientWidth || 0) / dims.w) : 1
  const scale = zoom === 'fit' ? fitScale : Math.max(0.05, zoom / 100)

  return (
    <div className="zoom-wrap" ref={outerRef}>
      <div className="zoom-canvas" style={{ width: dims.w * scale, height: dims.h * scale }}>
        <div ref={innerRef} style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
