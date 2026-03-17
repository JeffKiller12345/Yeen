'use client'
import { signIn } from 'next-auth/react'

export default function LoginPage() {
  return (
    <div className="kawaii-root">
      <div className="kawaii-main" style={{ maxWidth: '400px', margin: '80px auto', textAlign: 'center' }}>
        <p style={{ fontSize: '32px' }}>✿</p>
        <p className="pixel-label" style={{ marginBottom: '24px' }}>MEDQUIZ LOGIN</p>
        <button className="btn-kawaii" onClick={() => signIn('google', { callbackUrl: '/' })}>
          Sign in with Google
        </button>
      </div>
    </div>
  )
}