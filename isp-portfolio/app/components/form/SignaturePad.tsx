import { useEffect, useId, useRef, useState } from 'react'
import './SignaturePad.css'

type Props = {
  error?: string | null
  onChange: (signed: boolean) => void
  dataField: string
}

/**
 * Tanda tangan digital di <canvas> LOKAL (PRD US-07 AC 6): goresan hanya
 * digambar di peramban, tidak disimpan atau dikirim. Mendukung mouse, pena,
 * dan sentuhan (pointer events); scroll halaman dimatikan selama menggambar.
 */
export function SignaturePad({ error, onChange, dataField }: Props) {
  const id = useId()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [signed, setSigned] = useState(false)

  // Sesuaikan resolusi canvas dengan ukuran tampil × devicePixelRatio agar goresan tajam.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const setup = () => {
      const { width, height } = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.scale(dpr, dpr)
      ctx.lineWidth = 2.4
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = '#262a37'
    }
    setup()
    // Ukuran berubah → canvas direset; tanda tangan perlu diulang.
    const ro = new ResizeObserver(() => {
      setup()
      setSigned(false)
      onChange(false)
    })
    ro.observe(canvas)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cukup dipasang sekali
  }, [])

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = e.currentTarget.getContext('2d')
    if (!ctx) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drawing.current = true
    const { x, y } = point(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + 0.1, y + 0.1)
    ctx.stroke()
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return
    const ctx = e.currentTarget.getContext('2d')
    if (!ctx) return
    const { x, y } = point(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  function end() {
    if (!drawing.current) return
    drawing.current = false
    if (!signed) {
      setSigned(true)
      onChange(true)
    }
  }

  function clear() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.restore()
    setSigned(false)
    onChange(false)
  }

  return (
    <div className={`field signature${error ? ' field--error' : ''}`}>
      <span className="field__label" id={`${id}-label`}>
        Tanda Tangan Digital
        <span className="field__required" aria-hidden="true">
          {' '}
          *
        </span>
        <span className="sr-only"> (wajib)</span>
      </span>
      <div className="signature__box" data-lenis-prevent>
        <canvas
          ref={canvasRef}
          className="signature__canvas"
          tabIndex={0}
          role="img"
          data-field={dataField}
          aria-labelledby={`${id}-label`}
          aria-describedby={`${id}-help`}
          aria-invalid={error ? true : undefined}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          onPointerLeave={end}
        />
        {!signed && (
          <span className="signature__placeholder" aria-hidden="true">
            Tanda tangan di sini
          </span>
        )}
      </div>
      <div className="signature__footer">
        <p id={`${id}-help`} className="field__hint">
          Gunakan mouse atau jari. Tanda tangan hanya tampil di perangkat Anda.
        </p>
        <button type="button" className="signature__clear" onClick={clear} disabled={!signed}>
          Hapus Tanda Tangan
        </button>
      </div>
      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
