import { useEffect, useRef } from 'react'

// Pointer movement updates a transform directly. React only handles the
// discrete open/close state, keeping drag work off the render path.
export default function MobileSheet({ open, onClose, title, children }) {
  const sheet = useRef(null)
  const drag = useRef({ startY: 0, startAt: 0, offset: 0, frame: 0 })

  useEffect(() => () => cancelAnimationFrame(drag.current.frame), [])

  function start(event) {
    drag.current.startY = event.clientY
    drag.current.startAt = performance.now()
    drag.current.offset = 0
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function move(event) {
    drag.current.offset = Math.max(0, event.clientY - drag.current.startY)
    cancelAnimationFrame(drag.current.frame)
    drag.current.frame = requestAnimationFrame(() => sheet.current?.style.setProperty('--sheet-drag', `${drag.current.offset}px`))
  }

  function end() {
    const velocity = drag.current.offset / Math.max(1, performance.now() - drag.current.startAt)
    const shouldClose = drag.current.offset > 112 || velocity > 0.85
    sheet.current?.style.removeProperty('--sheet-drag')
    if (shouldClose) onClose()
  }

  if (!open) return null
  return (
    <div className="mobile-sheet-layer">
      <button className="mobile-sheet-backdrop" onClick={onClose} aria-label="Close panel" type="button" />
      <section ref={sheet} className="mobile-sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="mobile-sheet__handle" onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end}><span aria-hidden="true" /></div>
        <div className="mobile-sheet__head"><h2>{title}</h2><button onClick={onClose} type="button" aria-label="Close panel">×</button></div>
        <div className="mobile-sheet__body">{children}</div>
      </section>
    </div>
  )
}
