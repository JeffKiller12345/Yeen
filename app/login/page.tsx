'use client'
import { signIn } from 'next-auth/react'

export default function LoginPage() {
  return (
    <div className="login-root">
      {/* Marquee calls removed from here */}
      
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

      {/* Marquee calls removed from here */}

      <style jsx>{`
        .login-root {
          /* min-height: 100vh ensures the card stays centered on the screen */
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
