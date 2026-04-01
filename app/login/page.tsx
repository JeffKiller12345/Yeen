'use client'
import { signIn } from 'next-auth/react'
import { useEffect, useState } from 'react'

const POSTERS = [
  '/images/poster1.JPG',
  '/images/poster2.JPG',
  '/images/poster4.JPG',
  '/images/poster3.JPG',
  '/images/poster5.JPG',
  '/images/poster6.JPG',
  '/images/poster7.JPG',
  '/images/poster8.JPG',
  '/images/poster9.JPG',
]
const POSTER_TILES = Array.from({ length: 18 }, (_, i) => POSTERS[i % POSTERS.length])

export default function LoginPage() {
  const [cols, setCols] = useState(4)

  useEffect(() => {
    const update = () => setCols(window.innerWidth < 600 ? 3 : 4)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return (
    <div className="login-root">
      <div
        className="poster-grid"
        aria-hidden="true"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {POSTER_TILES.map((src, i) => (
          <div key={i} className="poster-tile">
            <div
              className="poster-inner"
              style={{ '--rotation': `${(i % 2 === 0 ? 1 : -1) * (1 + (i % 4))}deg` } as React.CSSProperties}
            >
              <img src={src} alt="" draggable={false} />
            </div>
          </div>
        ))}
      </div>

      <div className="poster-overlay" aria-hidden="true" />

      <div className="login-card kawaii-panel">
        <p style={{ fontSize: '40px', margin: '0 0 8px' }}></p>
        <p className="pixel-label" style={{ marginBottom: '8px' }}>YEEN</p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#888', marginBottom: '24px' }}>
          sign in to start studying ♡
        </p>
        <button
          className="btn-kawaii"
          style={{ width: '100%', fontSize: '9px', padding: '12px' }}
          onClick={() => signIn('google', { callbackUrl: '/' })}
        >
          ▶ SIGN IN WITH GOOGLE
        </button>
      </div>

      <style jsx>{`
        .login-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          background-color: var(--pink-light);
        }
        .poster-grid {
          position: absolute;
          inset: 0;
          display: grid;
          grid-auto-rows: auto;
          align-content: start;
          gap: 6px;
          padding: 6px;
          z-index: 0;
        }
        .poster-tile {
          aspect-ratio: 2 / 3;
          border-radius: 6px;
          overflow: hidden;
        }
        .poster-inner {
          width: 105%;
          height: 105%;
          margin: -2.5%;
          transform: rotate(var(--rotation));
          box-shadow: 0 4px 16px rgba(0,0,0,0.25);
        }
        .poster-tile img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          user-select: none;
          pointer-events: none;
        }
        .poster-overlay {
          position: absolute;
          inset: 0;
          backdrop-filter: blur(1px);
          background: rgba(255, 230, 240, 0.45);
          z-index: 1;
        }
        .login-card {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 360px;
          margin: 32px 16px;
          text-align: center;
          padding: 40px 32px;
        }
      `}</style>
    </div>
  )
}
