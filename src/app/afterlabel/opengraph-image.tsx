import { ImageResponse } from 'next/og'

// Social card for /afterlabel. Same palette and sizing as the site-wide card in
// src/app/opengraph-image.tsx; blue is the only accent.

export const runtime = 'edge'
export const alt = 'Afterlabel: see what UPS really charged you, order by order'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const BG = '#070b16'
const LINE = '#1e2c47'
const TEXT = '#e8edf7'
const DIM = '#93a3bf'
const BLUE = '#3b82f6'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: BG,
          padding: 72,
        }}
      >
        <div style={{ fontSize: 28, color: DIM, letterSpacing: 1, display: 'flex' }}>Analytics Ascent</div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ width: 96, height: 6, background: BLUE, marginBottom: 40, display: 'flex' }} />
          <div
            style={{
              fontSize: 72,
              lineHeight: 1.1,
              color: TEXT,
              letterSpacing: -1.5,
              display: 'flex',
              maxWidth: 1000,
            }}
          >
            See what UPS really charged you, order by order.
          </div>
          <div style={{ fontSize: 32, color: DIM, marginTop: 32, display: 'flex', maxWidth: 940 }}>
            Free invoice checker. Runs in your browser, nothing uploaded.
          </div>
        </div>

      </div>
    ),
    size,
  )
}
