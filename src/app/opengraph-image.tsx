import { ImageResponse } from 'next/og'

// The card that appears when a link to this site is pasted into LinkedIn,
// Slack, WhatsApp or a message. Without one, a shared link renders as a bare
// URL — which for a site whose distribution plan is outreach is a click lost
// on every share.
//
// Generated rather than designed in a file, so it cannot drift from the site's
// own palette, and inherited by every route that does not override it.

export const runtime = 'edge'
export const alt = 'Analytics Ascent — analytics and optimisation for operations'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const BG = '#070b16'
const CARD = '#0c1424'
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
          position: 'relative',
        }}
      >
        {/* the ascending mark, same geometry as the site logo */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 0 }}>
          <div style={{ width: 64, height: 32, background: TEXT }} />
          <div style={{ width: 64, height: 32, background: TEXT, marginLeft: -11, marginBottom: 32 }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 68,
              lineHeight: 1.1,
              color: TEXT,
              letterSpacing: -1.5,
              display: 'flex',
              maxWidth: 940,
            }}
          >
            The answer is usually already in your data.
          </div>
          <div style={{ fontSize: 30, color: DIM, marginTop: 28, display: 'flex', maxWidth: 900 }}>
            Part matching, route optimisation, inventory, bidding and financial
            modelling — with the working shown.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: `2px solid ${LINE}`,
            paddingTop: 28,
          }}
        >
          <div style={{ fontSize: 28, color: TEXT, display: 'flex' }}>analyticascent.com</div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              background: CARD,
              border: `1px solid ${LINE}`,
              borderRadius: 999,
              padding: '12px 24px',
            }}
          >
            <div style={{ width: 10, height: 10, borderRadius: 999, background: BLUE }} />
            <div style={{ fontSize: 24, color: DIM, display: 'flex' }}>
              Four tools you can run right now
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  )
}
