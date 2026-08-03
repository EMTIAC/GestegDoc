export default function PageBackdrop({ page }) {
  const bg = page.background || {}
  const wm = page.watermark || {}
  return (
    <div className="page-backdrop">
      {bg.type === 'color' && <div className="page-bg-color" style={{ background: bg.color || '#ffffff' }} />}
      {bg.type === 'image' && bg.image && (
        <div
          className="page-bg-image"
          style={{
            backgroundImage: `url(${bg.image})`,
            backgroundSize: bg.size === 'contain' ? 'contain' : 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: bg.opacity ?? 0.3,
          }}
        />
      )}
      {wm.text && (
        <div
          className="page-wm"
          style={{
            opacity: wm.opacity ?? 0.1,
            fontSize: `${wm.size || 60}px`,
            transform: `rotate(${wm.angle ?? -30}deg)`,
          }}
        >
          {wm.text}
        </div>
      )}
    </div>
  )
}
