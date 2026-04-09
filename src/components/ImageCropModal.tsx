'use client'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { X, ZoomIn, ZoomOut, Move, Check } from 'lucide-react'

interface Props {
  /** URL do objeto ou base64 da imagem original */
  src: string
  /** Proporção largura/altura do recorte. Padrão: 8/3 (cover wide) */
  aspectRatio?: number
  /** Resolução do output em pixels */
  outputWidth?: number
  onConfirm: (croppedBase64: string) => void
  onClose: () => void
}

export default function ImageCropModal({
  src,
  aspectRatio = 8 / 3,
  outputWidth = 1200,
  onConfirm,
  onClose,
}: Props) {
  const outputHeight = Math.round(outputWidth / aspectRatio)

  const frameRef = useRef<HTMLDivElement>(null)
  const dragRef  = useRef({ mx: 0, my: 0, px: 0, py: 0 })

  const [frameSize, setFrameSize] = useState({ w: 0, h: 0 })
  const [natSize,   setNatSize]   = useState({ w: 0, h: 0 })
  const [pos,       setPos]       = useState({ x: 0, y: 0 })
  const [scale,     setScale]     = useState(1)
  const [dragging,  setDragging]  = useState(false)
  const [ready,     setReady]     = useState(false)

  /* Mede o frame após renderização */
  useLayoutEffect(() => {
    if (!frameRef.current) return
    const { width, height } = frameRef.current.getBoundingClientRect()
    setFrameSize({ w: width, h: height })
  }, [])

  /* Carrega imagem para obter tamanho natural */
  useEffect(() => {
    const img = new window.Image()
    img.onload = () => setNatSize({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = src
  }, [src])

  /* Inicializa escala e posição centralizando a imagem */
  useEffect(() => {
    if (natSize.w === 0 || frameSize.w === 0) return
    const s = Math.max(frameSize.w / natSize.w, frameSize.h / natSize.h)
    setScale(s)
    setPos({
      x: (frameSize.w - natSize.w * s) / 2,
      y: (frameSize.h - natSize.h * s) / 2,
    })
    setReady(true)
  }, [natSize, frameSize])

  const minScale = natSize.w > 0
    ? Math.max(frameSize.w / natSize.w, frameSize.h / natSize.h)
    : 1

  const clamp = (x: number, y: number, s: number) => ({
    x: Math.min(0, Math.max(frameSize.w - natSize.w * s, x)),
    y: Math.min(0, Math.max(frameSize.h - natSize.h * s, y)),
  })

  /* Zoom mantendo o centro do frame fixo */
  const applyZoom = (ns: number) => {
    ns = Math.max(minScale, Math.min(ns, minScale * 4))
    const cx = frameSize.w / 2
    const cy = frameSize.h / 2
    const imgX = (cx - pos.x) / scale
    const imgY = (cy - pos.y) / scale
    const np = clamp(cx - imgX * ns, cy - imgY * ns, ns)
    setScale(ns); setPos(np)
  }

  /* Mouse */
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setDragging(true)
    dragRef.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y }
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return
    const nx = dragRef.current.px + (e.clientX - dragRef.current.mx)
    const ny = dragRef.current.py + (e.clientY - dragRef.current.my)
    setPos(clamp(nx, ny, scale))
  }
  const onMouseUp = () => setDragging(false)

  /* Touch */
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    setDragging(true)
    dragRef.current = { mx: t.clientX, my: t.clientY, px: pos.x, py: pos.y }
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging) return
    const t = e.touches[0]
    const nx = dragRef.current.px + (t.clientX - dragRef.current.mx)
    const ny = dragRef.current.py + (t.clientY - dragRef.current.my)
    setPos(clamp(nx, ny, scale))
  }

  /* Roda o mouse para zoom */
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    applyZoom(scale + (e.deltaY < 0 ? minScale * 0.08 : -minScale * 0.08))
  }

  /* Exporta com Canvas */
  const handleConfirm = () => {
    const canvas = document.createElement('canvas')
    canvas.width  = outputWidth
    canvas.height = outputHeight
    const ctx = canvas.getContext('2d')!
    const img = new window.Image()
    img.onload = () => {
      /* Converte posição de display para coordenadas da imagem original */
      const sx = -pos.x / scale
      const sy = -pos.y / scale
      const sw = frameSize.w / scale
      const sh = frameSize.h / scale
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outputWidth, outputHeight)
      onConfirm(canvas.toDataURL('image/jpeg', 0.92))
    }
    img.src = src
  }

  const zoomPct = minScale > 0 ? Math.round((scale / minScale) * 100) : 100

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(17,24,39,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px 16px',
        backdropFilter: 'blur(4px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'white', borderRadius: 24,
        padding: '28px 28px 24px',
        width: '100%', maxWidth: 640,
        boxShadow: '0 32px 80px rgba(0,0,0,0.22)',
        animation: 'fadeUp 0.2s ease-out',
      }}>

        {/* Cabeçalho */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h3 style={{
              fontFamily: 'Poppins', fontWeight: 700, fontSize: 18,
              color: '#111827', margin: 0, lineHeight: 1.2,
            }}>
              Posicionar foto de capa
            </h3>
            <p style={{ fontFamily: 'Inter', fontSize: 13, color: '#6B7280', margin: '5px 0 0' }}>
              Arraste para enquadrar · Scroll ou slider para zoom
            </p>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8,
            border: '1px solid #E5E7EB', background: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#6B7280', flexShrink: 0,
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.borderColor = '#D1D5DB' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#E5E7EB' }}
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Frame de crop ── */}
        <div
          ref={frameRef}
          style={{
            width: '100%',
            paddingBottom: `${(1 / aspectRatio) * 100}%`,
            position: 'relative',
            borderRadius: 14,
            overflow: 'hidden',
            background: '#F3F4F6',
            border: '2px solid #E5E7EB',
            cursor: dragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            touchAction: 'none',
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={() => setDragging(false)}
          onWheel={onWheel}
        >
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            {/* Imagem posicionada */}
            {ready && (
              <img
                src={src}
                alt="crop preview"
                draggable={false}
                style={{
                  position: 'absolute',
                  left: pos.x,
                  top: pos.y,
                  width: natSize.w * scale,
                  height: natSize.h * scale,
                  pointerEvents: 'none',
                  willChange: 'transform',
                }}
              />
            )}

            {/* Esqueleto de carregamento */}
            {!ready && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.4s infinite',
              }} />
            )}

            {/* Grid de terços */}
            {ready && (
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px),' +
                  'linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)',
                backgroundSize: '33.333% 33.333%',
              }} />
            )}

            {/* Hint de arrastar */}
            {ready && (
              <div style={{
                position: 'absolute', bottom: 10, right: 10,
                background: 'rgba(0,0,0,0.48)', borderRadius: 8,
                padding: '5px 10px',
                display: 'flex', alignItems: 'center', gap: 6,
                pointerEvents: 'none',
              }}>
                <Move size={11} color="white" />
                <span style={{ color: 'white', fontSize: 11, fontFamily: 'Inter' }}>
                  Arraste para reposicionar
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Controle de zoom ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginTop: 14, padding: '0 2px',
        }}>
          <button
            onClick={() => applyZoom(scale - minScale * 0.15)}
            style={{
              width: 30, height: 30, borderRadius: 8,
              border: '1px solid #E5E7EB', background: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#4B5563', flexShrink: 0,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#16A34A'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#E5E7EB'}
          >
            <ZoomOut size={14} />
          </button>

          <input
            type="range"
            min={minScale}
            max={minScale * 4}
            step={minScale * 0.01}
            value={scale}
            onChange={e => applyZoom(Number(e.target.value))}
            style={{ flex: 1, accentColor: '#16A34A', cursor: 'pointer' }}
          />

          <button
            onClick={() => applyZoom(scale + minScale * 0.15)}
            style={{
              width: 30, height: 30, borderRadius: 8,
              border: '1px solid #E5E7EB', background: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#4B5563', flexShrink: 0,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#16A34A'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#E5E7EB'}
          >
            <ZoomIn size={14} />
          </button>

          <span style={{
            fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter',
            flexShrink: 0, minWidth: 36, textAlign: 'right',
          }}>
            {zoomPct}%
          </span>
        </div>

        {/* ── Ações ── */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '11px', borderRadius: 999,
              border: '1.5px solid #E5E7EB', background: 'white',
              color: '#4B5563', fontSize: 14, fontWeight: 600,
              fontFamily: 'Poppins', cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.background = '#F9FAFB' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = 'white' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!ready}
            style={{
              flex: 2, padding: '11px', borderRadius: 999, border: 'none',
              background: ready ? '#16A34A' : '#D1D5DB',
              color: 'white', fontSize: 14, fontWeight: 700,
              fontFamily: 'Poppins', cursor: ready ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              transition: 'all 0.2s',
              boxShadow: ready ? '0 4px 16px rgba(22,163,74,0.35)' : 'none',
            }}
            onMouseEnter={e => { if (ready) e.currentTarget.style.background = '#15803D' }}
            onMouseLeave={e => { if (ready) e.currentTarget.style.background = '#16A34A' }}
          >
            <Check size={16} />
            Usar esta posição
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}
