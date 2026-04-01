'use client'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
  title?: string
  subtitle?: string
}

export default function KawaiiLayout({ children, title, subtitle }: Props) {
  return (
    <div className="kawaii-root">
      {/* Dot-grid background handled by body CSS */}

      {/* Decorative side posters — only visible on very wide screens */}
      <div className="side-deco side-deco-left" aria-hidden>
        <img
          src="https://placehold.co/110x160/fce4ec/c2185b?text=STUDY%0ATIME"
          alt=""
          className="deco-poster"
        />
        <img
          src="https://placehold.co/110x110/e8f5e9/2e7d32?text=YOU%0AGOT%0ATHIS"
          alt=""
          className="deco-sticker"
        />
      </div>

      <div className="side-deco side-deco-right" aria-hidden>
        <img
          src="https://placehold.co/110x150/fce4ec/c2185b?text=KEEP%0AGOING"
          alt=""
          className="deco-poster"
        />
        <img
          src="https://placehold.co/110x110/fff9c4/f57f17?text=GOOD%0ALUCK"
          alt=""
          className="deco-sticker"
        />
      </div>

      {/* Site header banner */}
      <header className="kawaii-header">
        <div className="header-inner">
          <div className="site-title">
            <span className="pixel-text">✿ Yeen ✿</span>
          </div>
          <nav className="header-nav">
            <a href="/" className="nav-link pixel-text-sm">HOME</a>
            <span className="nav-dot">★</span>
            <a href="/" className="nav-link pixel-text-sm">RESET PROGRESS</a>
          </nav>
        </div>
        {/* Pixel bow decoration */}
        <div className="header-bow" aria-hidden>
          <BowSVG />
        </div>
      </header>

      {/* Main content frame */}
      <main className="kawaii-main">
        {/* Decorative star corners */}
        <span className="corner corner-tl" aria-hidden>✦</span>
        <span className="corner corner-tr" aria-hidden>✦</span>
        <span className="corner corner-bl" aria-hidden>✦</span>
        <span className="corner corner-br" aria-hidden>✦</span>

        {/* Optional page title */}
        {title && (
          <div className="page-title-block">
            <h1 className="page-title pixel-text">{title}</h1>
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
            <div className="title-divider" aria-hidden>
              {'♡ · '.repeat(12)}
            </div>
          </div>
        )}

        {children}
      </main>

      {/* Footer */}
      <footer className="kawaii-footer">
        <span className="pixel-text-sm">© 2026 Yeen · made with love</span>
      </footer>

      <style jsx>{`
        .kawaii-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0 16px 48px;
        }

        /* ── Side decoration posters ── */
        .side-deco {
          position: fixed;
          top: 140px;
          display: none;
          flex-direction: column;
          gap: 16px;
          z-index: 0;
        }

        @media (min-width: 1200px) {
          .side-deco { display: flex; }
        }

        .side-deco-left  { left: 16px; }
        .side-deco-right { right: 16px; }

        .deco-poster, .deco-sticker {
          display: block;
          border: 3px solid var(--pink-mid);
          box-shadow: 4px 4px 0 var(--pink-mid);
          max-width: 110px;
        }

        .kawaii-header {
          width: 100%;
          max-width: 900px;
          position: relative;
          margin-bottom: 8px;
        }

        .header-inner {
          background: white;
          border: 3px solid var(--pink-mid);
          border-top: none;
          padding: 12px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 4px 4px 0 var(--pink-mid);
        }

        .site-title { display: flex; align-items: center; gap: 8px; }

        .header-nav {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nav-link {
          color: var(--pink-dark);
          text-decoration: none;
          font-size: 7px;
        }
        .nav-link:hover { text-decoration: underline; }

        .nav-dot { color: var(--green-mid); font-size: 10px; }

        .header-bow {
          position: absolute;
          top: -18px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
        }

        .kawaii-main {
          width: 100%;
          max-width: 900px;
          background: white;
          border: 3px solid var(--pink-mid);
          box-shadow: 6px 6px 0 var(--pink-mid);
          padding: 32px 28px;
          position: relative;
          /* Dashed inner border */
          outline: 2px dashed var(--green-mid);
          outline-offset: -8px;
        }

        .corner {
          position: absolute;
          color: var(--pink-mid);
          font-size: 16px;
          line-height: 1;
        }
        .corner-tl { top: 4px; left: 4px; }
        .corner-tr { top: 4px; right: 4px; }
        .corner-bl { bottom: 4px; left: 4px; }
        .corner-br { bottom: 4px; right: 4px; }

        .page-title-block {
          text-align: center;
          margin-bottom: 24px;
        }

        .page-title {
          font-size: 13px;
          color: var(--pink-dark);
          margin: 0 0 6px;
          letter-spacing: 0.15em;
        }

        .page-subtitle {
          font-family: var(--font-body);
          font-size: 13px;
          color: #888;
          margin: 0 0 12px;
        }

        .title-divider {
          font-size: 10px;
          color: var(--pink-mid);
          letter-spacing: 0.1em;
          white-space: nowrap;
          overflow: hidden;
        }

        .kawaii-footer {
          margin-top: 24px;
          color: var(--pink-dark);
          opacity: 0.6;
        }

        .pixel-text    { font-family: var(--font-pixel); font-size: 11px; color: var(--pink-dark); }
        .pixel-text-sm { font-family: var(--font-pixel); font-size: 7px;  color: var(--pink-dark); }
      `}</style>
    </div>
  )
}

function BowSVG() {
  return (
    <svg width="60" height="30" viewBox="0 0 60 30" fill="none">
      {/* Left loop */}
      <ellipse cx="18" cy="15" rx="16" ry="10" fill="#f48fb1" stroke="#c2185b" strokeWidth="1.5"/>
      {/* Right loop */}
      <ellipse cx="42" cy="15" rx="16" ry="10" fill="#f48fb1" stroke="#c2185b" strokeWidth="1.5"/>
      {/* Knot */}
      <ellipse cx="30" cy="15" rx="6" ry="6" fill="#e91e8c" stroke="#c2185b" strokeWidth="1.5"/>
      {/* Highlight on loops */}
      <ellipse cx="14" cy="11" rx="5" ry="3" fill="white" opacity="0.3"/>
      <ellipse cx="46" cy="11" rx="5" ry="3" fill="white" opacity="0.3"/>
    </svg>
  )
}