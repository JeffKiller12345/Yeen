'use client'
import KawaiiLayout from '@/components/KawaiiLayout'

export default function Loading() {
  return (
    <KawaiiLayout>
      <div className="loading-wrapper">
        <div className="loading-dots">
          <span>✿</span>
          <span>✿</span>
          <span>✿</span>
        </div>
        <p className="pixel-label" style={{ textAlign: 'center', marginTop: '16px' }}>
          LOADING...
        </p>
      </div>

      <style jsx>{`
        .loading-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 60px 0;
        }

        .loading-dots {
          display: flex;
          gap: 12px;
        }

        .loading-dots span {
          font-size: 24px;
          color: var(--pink-mid);
          animation: bounce 0.8s ease-in-out infinite;
        }

        .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
        .loading-dots span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes bounce {
          0%, 100% { transform: translateY(0);    opacity: 0.4; }
          50%       { transform: translateY(-8px); opacity: 1;   }
        }
      `}</style>
    </KawaiiLayout>
  )
}