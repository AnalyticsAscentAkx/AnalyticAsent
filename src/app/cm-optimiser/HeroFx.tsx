'use client'

import { useEffect, useRef } from 'react'

// The hero is a parts washer: the ultrasonic tank every machine shop keeps in
// the corner, with finished parts and tooling suspended in it and bubbles
// rising past them. It is the one piece of motion on the page.

type Draw = (ctx: CanvasRenderingContext2D, s: number) => void

/** Tooling and parts, drawn as outlines at unit scale and centred on the origin.
 *  Stroked rather than filled, because a machine shop's own drawings are. */
const SHAPES: Draw[] = [
  // end mill: shank, flutes, corner radius
  (c, s) => {
    c.beginPath()
    c.rect(-0.16 * s, -0.95 * s, 0.32 * s, 1.9 * s)
    c.stroke()
    for (let i = 0; i < 5; i++) {
      const y = -0.5 * s + i * 0.3 * s
      c.beginPath()
      c.moveTo(-0.16 * s, y)
      c.lineTo(0.16 * s, y + 0.22 * s)
      c.stroke()
    }
    c.beginPath()
    c.moveTo(-0.16 * s, 0.62 * s)
    c.lineTo(0.16 * s, 0.62 * s)
    c.stroke()
  },
  // twist drill: point angle and two flutes
  (c, s) => {
    c.beginPath()
    c.moveTo(-0.14 * s, -0.95 * s)
    c.lineTo(-0.14 * s, 0.7 * s)
    c.lineTo(0, 0.95 * s)
    c.lineTo(0.14 * s, 0.7 * s)
    c.lineTo(0.14 * s, -0.95 * s)
    c.closePath()
    c.stroke()
    for (let i = 0; i < 6; i++) {
      const y = -0.8 * s + i * 0.26 * s
      c.beginPath()
      c.moveTo(-0.14 * s, y)
      c.lineTo(0.14 * s, y + 0.18 * s)
      c.stroke()
    }
  },
  // turning insert: 80° diamond with a clamping hole
  (c, s) => {
    const r = 0.1 * s
    const pts: [number, number][] = [
      [0, -0.9 * s],
      [0.62 * s, 0],
      [0, 0.9 * s],
      [-0.62 * s, 0],
    ]
    c.beginPath()
    pts.forEach(([x, y], i) => (i === 0 ? c.moveTo(x, y) : c.lineTo(x, y)))
    c.closePath()
    c.stroke()
    c.beginPath()
    c.arc(0, 0, r * 1.6, 0, Math.PI * 2)
    c.stroke()
  },
  // vernier calliper: beam, fixed jaw, sliding jaw
  (c, s) => {
    c.beginPath()
    c.rect(-1.1 * s, -0.09 * s, 2.2 * s, 0.18 * s)
    c.stroke()
    c.beginPath()
    c.moveTo(-1.1 * s, -0.09 * s)
    c.lineTo(-1.1 * s, -0.75 * s)
    c.lineTo(-0.94 * s, -0.75 * s)
    c.lineTo(-0.94 * s, -0.09 * s)
    c.stroke()
    c.beginPath()
    c.moveTo(0.1 * s, -0.09 * s)
    c.lineTo(0.1 * s, -0.68 * s)
    c.lineTo(0.26 * s, -0.68 * s)
    c.lineTo(0.26 * s, -0.09 * s)
    c.stroke()
    c.beginPath()
    c.rect(0.1 * s, -0.09 * s, 0.5 * s, 0.34 * s)
    c.stroke()
    for (let i = 0; i < 9; i++) {
      const x = -1.0 * s + i * 0.22 * s
      c.beginPath()
      c.moveTo(x, -0.09 * s)
      c.lineTo(x, -0.02 * s)
      c.stroke()
    }
  },
  // flange: bolt circle
  (c, s) => {
    c.beginPath()
    c.arc(0, 0, 0.92 * s, 0, Math.PI * 2)
    c.stroke()
    c.beginPath()
    c.arc(0, 0, 0.34 * s, 0, Math.PI * 2)
    c.stroke()
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      c.beginPath()
      c.arc(Math.cos(a) * 0.63 * s, Math.sin(a) * 0.63 * s, 0.1 * s, 0, Math.PI * 2)
      c.stroke()
    }
  },
  // gear blank: pitch circle, bore, keyway, a few teeth
  (c, s) => {
    c.beginPath()
    c.arc(0, 0, 0.78 * s, 0, Math.PI * 2)
    c.stroke()
    c.beginPath()
    c.arc(0, 0, 0.26 * s, 0, Math.PI * 2)
    c.stroke()
    c.beginPath()
    c.rect(-0.06 * s, -0.34 * s, 0.12 * s, 0.1 * s)
    c.stroke()
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2
      c.beginPath()
      c.moveTo(Math.cos(a) * 0.78 * s, Math.sin(a) * 0.78 * s)
      c.lineTo(Math.cos(a) * 0.93 * s, Math.sin(a) * 0.93 * s)
      c.stroke()
    }
  },
  // machined bracket: L profile with mounting holes
  (c, s) => {
    c.beginPath()
    c.moveTo(-0.85 * s, -0.6 * s)
    c.lineTo(-0.85 * s, 0.6 * s)
    c.lineTo(0.85 * s, 0.6 * s)
    c.lineTo(0.85 * s, 0.3 * s)
    c.lineTo(-0.5 * s, 0.3 * s)
    c.lineTo(-0.5 * s, -0.6 * s)
    c.closePath()
    c.stroke()
    c.beginPath()
    c.arc(-0.67 * s, -0.3 * s, 0.11 * s, 0, Math.PI * 2)
    c.stroke()
    c.beginPath()
    c.arc(0.5 * s, 0.45 * s, 0.11 * s, 0, Math.PI * 2)
    c.stroke()
  },
]

interface Item {
  x: number
  y: number
  vy: number
  vx: number
  rot: number
  spin: number
  scale: number
  shape: number
  alpha: number
}

interface Bubble {
  x: number
  y: number
  vy: number
  r: number
  alpha: number
  phase: number
  wobble: number
}

interface Ring {
  x: number
  y: number
  r: number
  alpha: number
}

export function HeroFx({
  className,
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let W = 0
    let H = 0
    let dpr = 1
    const items: Item[] = []
    const bubbles: Bubble[] = []
    const rings: Ring[] = []
    let raf = 0
    let running = true
    let last = 0

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = rect.width
      H = rect.height
      canvas.width = Math.floor(W * dpr)
      canvas.height = Math.floor(H * dpr)
      canvas.style.width = `${W}px`
      canvas.style.height = `${H}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const seedItem = (initial: boolean): Item => ({
      x: Math.random() * W,
      y: initial ? Math.random() * H : H + 120,
      vy: 0.06 + Math.random() * 0.1,
      vx: (Math.random() - 0.5) * 0.06,
      rot: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.0016,
      scale: 34 + Math.random() * 46,
      shape: Math.floor(Math.random() * SHAPES.length),
      alpha: 0.1 + Math.random() * 0.16,
    })

    const seedBubble = (initial: boolean): Bubble => ({
      x: Math.random() * W,
      y: initial ? Math.random() * H : H + 12,
      vy: 0.35 + Math.random() * 0.85,
      r: 1.1 + Math.random() * 3.2,
      alpha: 0.18 + Math.random() * 0.32,
      phase: Math.random() * Math.PI * 2,
      wobble: 0.25 + Math.random() * 0.7,
    })

    resize()
    for (let i = 0; i < 9; i++) items.push(seedItem(true))
    for (let i = 0; i < 54; i++) bubbles.push(seedBubble(true))

    const drawStatic = () => {
      ctx.clearRect(0, 0, W, H)
      for (const it of items) {
        ctx.save()
        ctx.translate(it.x, it.y)
        ctx.rotate(it.rot)
        ctx.strokeStyle = `rgba(96, 165, 250, ${it.alpha})`
        ctx.lineWidth = 1
        SHAPES[it.shape](ctx, it.scale)
        ctx.restore()
      }
      for (const b of bubbles) {
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(96, 165, 250, ${b.alpha * 0.5})`
        ctx.fill()
      }
    }

    if (reduced) {
      // One still frame: the tank, without the motion.
      drawStatic()
      window.addEventListener('resize', drawStatic)
      return () => window.removeEventListener('resize', drawStatic)
    }

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame)
      if (!running) return
      if (t - last < 28) return
      const dt = Math.min((t - last) / 16.67, 3)
      last = t

      ctx.clearRect(0, 0, W, H)

      for (let i = 0; i < items.length; i++) {
        const it = items[i]
        it.y -= it.vy * dt
        it.x += it.vx * dt
        it.rot += it.spin * dt
        if (it.y < -140) items[i] = seedItem(false)
        ctx.save()
        ctx.translate(it.x, it.y)
        ctx.rotate(it.rot)
        ctx.strokeStyle = `rgba(96, 165, 250, ${it.alpha})`
        ctx.lineWidth = 1
        SHAPES[it.shape](ctx, it.scale)
        ctx.restore()
      }

      for (let i = 0; i < bubbles.length; i++) {
        const b = bubbles[i]
        b.y -= b.vy * dt
        b.phase += 0.03 * dt
        const x = b.x + Math.sin(b.phase) * b.wobble * 6
        ctx.beginPath()
        ctx.arc(x, b.y, b.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(96, 165, 250, ${b.alpha * 0.55})`
        ctx.fill()
        ctx.strokeStyle = `rgba(96, 165, 250, ${b.alpha})`
        ctx.lineWidth = 0.7
        ctx.stroke()
        if (b.y < -8) {
          // surface: the bubble breaks and leaves a ring
          if (Math.random() < 0.45) rings.push({ x, y: 4, r: b.r, alpha: 0.32 })
          bubbles[i] = seedBubble(false)
        }
      }

      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i]
        r.r += 0.9 * dt
        r.alpha -= 0.012 * dt
        if (r.alpha <= 0) {
          rings.splice(i, 1)
          continue
        }
        ctx.beginPath()
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(96, 165, 250, ${r.alpha})`
        ctx.lineWidth = 1
        ctx.stroke()
      }
    }

    const onResize = () => resize()
    window.addEventListener('resize', onResize)
    const io = new IntersectionObserver((e) => (running = e[0].isIntersecting), {
      threshold: 0.02,
    })
    io.observe(canvas)
    const onVisible = () => (running = !document.hidden)
    document.addEventListener('visibilitychange', onVisible)
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisible)
      io.disconnect()
    }
  }, [])

  return <canvas ref={ref} className={className} style={style} aria-hidden="true" />
}
