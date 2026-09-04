/**
 * AuthCallback.jsx — /auth/callback
 *
 * Where GitHub sends people back after they allow access. Verifies the round
 * trip started here, then trades the one-time code for a token through
 * /api/oauth/exchange — the only part of sign-in that needs the client secret,
 * which is why it runs on the server.
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import BrandWordmark from '../components/BrandWordmark'

export default function AuthCallback({ onSignIn }) {
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const error = params.get('error')
    const returnedState = params.get('state')

    if (error || !code) {
      navigate('/?auth_error=' + (error || 'no_code'), { replace: true })
      return
    }

    if (!returnedState) {
      navigate('/?auth_error=state_mismatch', { replace: true })
      return
    }

    fetch('/api/oauth/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, state: returnedState })
    })
      .then(r => {
        if (!r.ok) throw new Error('exchange_failed')
        onSignIn()
      })
      .catch(() => navigate('/?auth_error=exchange_failed', { replace: true }))
  }, [])

  return (
    <div className="loading-screen">
      <BrandWordmark className="brand-wordmark--loading" />
      <p className="loading-text">Signing you in…</p>
    </div>
  )
}
