'use client'

import { useEffect, useRef } from 'react'

// A route solver, running.
//
// Every engagement on this site is the same shape underneath: a set of points
// and a constraint, and a better way to join them than the one in use. Bins on
// a collection round, parts against parts already quoted, stock against demand,
// bids against inventory. So the hero is a solver mid-run — nodes settle, edges
// are tried and dropped, and the tour tightens. It does not loop a canned
// animation; it actually anneals, and it visibly improves.

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  r: number
}

export function HeroField({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let W = 0
    let H = 0
    let raf = 0
    let running = true
    let last = 0
    let nodes: Node[] = []
    let tour: number[] = []
    let temperature = 1

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = rect.width
      H = rect.height
      canvas.width = Math.floor(W * dpr)
      canvas.height = Math.floor(H * dpr)
      canvas.style.width = `${W}px`
      canvas.style.height = `${H}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const seed = () => {
      const count = W < 640 ? 26 : W < 1100 ? 40 : 54
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        r: 1.2 + Math.random() * 1.8,
      }))
      tour = nodes.map((_, i) => i)
      temperature = 1
    }

    const dist = (a: Node, b: Node) => Math.hypot(a.x - b.x, a.y - b.y)

    /** One 2-opt step: reverse a segment if doing so shortens the tour.
     *  Accepted worse moves decay with temperature, so it escapes local minima
     *  early and settles later — the visible "tightening". */
    const anneal = () => {
      const n = tour.length
      if (n < 5) return
      for (let attempt = 0; attempt < 18; attempt++) {
        const i = 1 + Math.floor(Math.random() * (n - 2))
        const j = i + 1 + Math.floor(Math.random() * (n - i - 1))
        const a = nodes[tour[i - 1]]
        const b = nodes[tour[i]]
        const c = nodes[tour[j]]
        const d = nodes[tour[(j + 1) % n]]
        const delta = dist(a, c) + dist(b, d) - dist(a, b) - dist(c, d)
        if (delta < 0 || Math.random() < Math.exp(-delta / (temperature * 40 + 0.001))) {
          for (let lo = i, hi = j; lo < hi; lo++, hi--) {
            const t = tour[lo]
            tour[lo] = tour[hi]
            tour[hi] = t
          }
        }
      }
      temperature *= 0.9985
      // Re-heat occasionally so the field keeps moving instead of freezing.
      if (temperature < 0.02) temperature = 1
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H)

      // The tour, drawn as one continuous path. Opacity rises as the solution
      // settles, so a converged route looks resolved rather than merely drawn.
      const settled = 1 - temperature
      ctx.beginPath()
      for (let k = 0; k < tour.length; k++) {
        const p = nodes[tour[k]]
        if (k === 0) ctx.moveTo(p.x, p.y)
        else ctx.lineTo(p.x, p.y)
      }
      ctx.closePath()
      ctx.strokeStyle = `rgba(59, 130, 246, ${0.1 + settled * 0.3})`
      ctx.lineWidth = 1
      ctx.stroke()

      // A brighter leading segment, so the eye has somewhere to rest.
      const head = Math.floor((Date.now() / 90) % tour.length)
      ctx.beginPath()
      for (let k = 0; k < 7; k++) {
        const p = nodes[tour[(head + k) % tour.length]]
        if (k === 0) ctx.moveTo(p.x, p.y)
        else ctx.lineTo(p.x, p.y)
      }
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.75)'
      ctx.lineWidth = 1.4
      ctx.stroke()

      for (let i = 0; i < nodes.length; i++) {
        const p = nodes[i]
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(147, 197, 253, 0.55)'
        ctx.fill()
      }

      // The node the leading segment is passing through, haloed.
      const hp = nodes[tour[head]]
      ctx.beginPath()
      ctx.arc(hp.x, hp.y, 4.5, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.6)'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    resize()
    seed()

    if (reduced) {
      // Solve it without animating, then show the settled result once.
      for (let i = 0; i < 4000; i++) anneal()
      temperature = 0.02
      draw()
      const onResizeStatic = () => {
        resize()
        seed()
        for (let i = 0; i < 4000; i++) anneal()
        draw()
      }
      window.addEventListener('resize', onResizeStatic)
      return () => window.removeEventListener('resize', onResizeStatic)
    }

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame)
      if (!running) return
      if (t - last < 32) return
      last = t

      for (const p of nodes) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > W) p.vx *= -1
        if (p.y < 0 || p.y > H) p.vy *= -1
      }
      anneal()
      draw()
    }

    const onResize = () => {
      resize()
      seed()
    }
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

  return <canvas ref={ref} className={className} aria-hidden="true" />
}
