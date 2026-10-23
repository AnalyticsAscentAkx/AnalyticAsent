// The routes the home hero's solver produced, running.
//
// A depot, ten delivery points, six delivery tours drawn as roads in the site's line language, a truck on
// each, a lit segment trailing each truck (the home hero's leading segment) and a ring that opens where a
// tour ends: the label gets printed there, and what comes after it is what this page is about.
//
// No JavaScript. Inline SVG and CSS animation only, so there is nothing to pause: the browser stops CSS
// animation off-screen and in background tabs by itself. Each tour's trail and ring share the truck's
// period and delay, so the lit segment always ends at the truck and the ring opens as it arrives.
// Negative delays put the field mid-run on first paint. Blue and the navy ramp only.

const TOURS = [
  { d: 'M240 300 C360 285,500 220,640 200 C740 240,820 300,900 330 C960 300,1020 262,1080 232', dur: 26, delay: -9, park: 38, end: [1080, 232] },
  { d: 'M240 300 C340 380,440 420,560 420 C640 450,700 470,760 480', dur: 20, delay: -3, park: 62, end: [760, 480] },
  { d: 'M240 300 C300 230,350 150,420 120 C560 100,720 90,860 110', dur: 24, delay: -14, park: 24, end: [860, 110] },
  { d: 'M240 300 C270 360,300 430,330 470', dur: 14, delay: -6, park: 70, end: [330, 470] },
  { d: 'M240 300 C360 285,500 220,640 200 C720 170,790 130,860 110 C940 102,1020 96,1090 90', dur: 30, delay: -21, park: 52, end: [1090, 90] },
  { d: 'M240 300 C340 380,440 420,560 420 C720 440,880 450,1040 470', dur: 28, delay: -11, park: 45, end: [1040, 470] },
]

const NODES = [[640, 200], [900, 330], [1080, 232], [560, 420], [760, 480], [420, 120], [860, 110], [330, 470], [1090, 90], [1040, 470]]

const CSS = `
.rf-truck { offset-path: var(--path); offset-rotate: auto; offset-distance: 0%;
  animation: rf-drive var(--d) linear infinite; animation-delay: var(--s); }
@keyframes rf-drive { from { offset-distance: 0% } to { offset-distance: 100% } }
.rf-head { stroke-dasharray: 70 930; stroke-dashoffset: 1070;
  animation: rf-trail var(--d) linear infinite; animation-delay: var(--s); }
@keyframes rf-trail { from { stroke-dashoffset: 1070 } to { stroke-dashoffset: 70 } }
.rf-ring { transform-box: fill-box; transform-origin: center; opacity: 0;
  animation: rf-arrive var(--d) linear infinite; animation-delay: var(--s); }
@keyframes rf-arrive { 0% { transform: scale(.4); opacity: .7 } 7% { transform: scale(2.8); opacity: 0 } 100% { opacity: 0 } }
@media (prefers-reduced-motion: reduce) {
  .rf-truck, .rf-head, .rf-ring { animation: none }
  .rf-truck { offset-distance: var(--p) }
  .rf-head, .rf-ring { display: none }
}
@supports not (offset-path: path('M0 0 L1 1')) { .rf-truck, .rf-ring { display: none } }
`

type Vars = React.CSSProperties & Record<`--${string}`, string>

const timing = (t: (typeof TOURS)[number]): Vars => ({ '--d': `${t.dur}s`, '--s': `${t.delay}s` })

export function RouteField() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <style>{CSS}</style>
      <svg
        className="absolute top-0 left-1/2 h-full w-[max(100%,1100px)] -translate-x-1/2 opacity-70"
        viewBox="0 0 1200 560"
        preserveAspectRatio="xMidYMid slice"
      >
        <g fill="none" stroke="var(--line-bright)" strokeWidth="1">
          {TOURS.map((t) => (
            <path key={t.d} d={t.d} />
          ))}
        </g>
        <g fill="none" stroke="var(--blue-light)" strokeWidth="1.4" strokeLinecap="round">
          {TOURS.map((t) => (
            <path key={t.d} className="rf-head" pathLength={1000} d={t.d} style={timing(t)} />
          ))}
        </g>
        <g fill="rgb(147 197 253 / 0.55)">
          {NODES.map(([x, y]) => (
            <circle key={`${x},${y}`} cx={x} cy={y} r="2.4" />
          ))}
        </g>
        <rect x="234" y="294" width="12" height="12" rx="1.5" fill="var(--bg)" stroke="var(--blue-light)" strokeWidth="1" />
        <g fill="none" stroke="var(--blue-light)" strokeWidth="1">
          {TOURS.map((t) => (
            <circle key={t.d} className="rf-ring" cx={t.end[0]} cy={t.end[1]} r="3" style={timing(t)} />
          ))}
        </g>
        <g fill="var(--bg)" stroke="var(--blue-light)" strokeWidth="1.2">
          {TOURS.map((t) => (
            <g key={t.d} className="rf-truck" style={{ ...timing(t), '--p': `${t.park}%`, '--path': `path('${t.d}')` } as Vars}>
              <rect x="-7" y="-3.5" width="14" height="7" rx="1" />
              <rect x="4" y="-2.5" width="4" height="5" rx="0.8" />
            </g>
          ))}
        </g>
      </svg>
    </div>
  )
}
