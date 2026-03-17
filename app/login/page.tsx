'use client'
import { signIn } from 'next-auth/react'

const MARQUEE_IMAGES = [
  '/images/aman1.png',
  '/images/aman2.jpeg',
  '/images/aman3.jpg',
  '/images/aman4.jpg',
  '/images/aman5.jpg',
]

function Marquee({ reverse = false }) {
  return (
    <div className="marquee-wrapper">
      <div className={`marquee-track ${reverse ? 'reverse' : ''}`}>
        {[...MARQUEE_IMAGES, ...MARQUEE_IMAGES, ...MARQUEE_IMAGES].map((img, i) => (
          <span key={i} className="marquee-item">
             <img src={img} alt="" width={80} height={80} style={{ objectFit: 'cover', borderRadius: '4px' }} />
          </span>
        ))}
      </div>

      <style jsx>{`
        .marquee-wrapper {
          width: 100%;
          overflow: hidden;
          background: var(--pink-mid);
          border-top: 2px solid var(--pink-dark);
          border-bottom: 2px solid var(--pink-dark);
          padding: 8px 0;
          white-space: nowrap;
        }

        .marquee-track {
          display: inline-block;
          animation: scroll-left 20s linear infinite;
        }

        .marquee-track.reverse {
          animation: scroll-right 20s linear infinite;
        }

        .marquee-item {
          display: inline-block;
          font-size: 22px;
          margin: 0 16px;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.15));
        }

        @keyframes scroll-left {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }

        @keyframes scroll-right {
          0%   { transform: translateX(-33.33%); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="login-root">
      <Marquee />

      <div className="login-card kawaii-panel">
        <p style={{ fontSize: '40px', margin: '0 0 8px' }}>✿</p>
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

      <Marquee reverse />

      <style jsx>{`
        .login-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0;
          background-color: var(--pink-light);
          background-image: radial-gradient(circle, var(--pink-mid) 1px, transparent 1px);
          background-size: 20px 20px;
        }

        .login-card {
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