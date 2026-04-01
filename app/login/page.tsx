'use client'
import { signIn } from 'next-auth/react'

// 🎨 Add your poster image URLs here
const POSTERS = [
  '/images/poster1.jpg',
  '/images/poster2.jpg',
  '/images/poster3.jpg',
  '/images/poster4.jpg',
  '/images/poster5.jpg',
  '/images/poster6.jpg',
  '/images/poster7.jpg',
  '/images/poster8.jpg',
  '/images/poster9.jpg',
  '/images/poster10.jpg',
]

export default function LoginPage() {
  return (
    <div className="login-root">

      {/* ── Poster collage background ── */}
      <div className="poster-grid" aria-hidden="true">
        {POSTERS.map((src, i) => (
          <div
            key={i}
            className="poster-tile"
            style={{ '--rotation': `${(i % 2 === 0 ? 1 : -1) * (1 + (i % 4))}deg` }}
          >
            <img src={src} alt="" draggable={false} />
          </div>
        ))}
      </div>

      {/* ── Frosted overlay so posters don't overpower the card ── */}
      <div className="poster-overlay" aria-hidden="true" />

      <div className="login-card kawaii-panel">
        <p style={{ fontSize: '40px', margin: '0 0 8px' }}></p>
        <p className="pixel-label" style={{ marginBottom: '8px' }}>YEEN</p>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '12px',
          color: '#888',
          marginBottom: '24px'
        }}>
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
        /* ── Root ── */
        .login-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;          /* needed so children can be absolute */
          overflow: hidden;
          background-color: var(--pink-light);
        }

        /* ── Poster grid ── */
        .poster-grid {
          position: absolute;
          inset: -40px;                /* bleed past the edges so corners are filled */
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          padding: 12px;
          z-index: 0;
        }

        .poster-tile {
          border-radius: 6px;
          overflow: hidden;
          transform: rotate(var(--rotation));
          box-shadow: 0 4px 16px rgba(0,0,0,0.25);
          transition: transform 0.3s ease;
        }

        .poster-tile img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          user-select: none;
          pointer-events: none;
        }

        /* ── Frosted overlay ── */
        .poster-overlay {
          position: absolute;
          inset: 0;
          backdrop-filter: blur(3px);
          background: rgba(255, 230, 240, 0.45); /* tint with your --pink-light */
          z-index: 1;
        }

        /* ── Login card sits above both layers ── */
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
