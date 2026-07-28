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

export default function AuthCallback({ onSignIn }) {
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const error = params.get('error')
    const returnedState = params.get('state')

    // One use only: read it, then clear it whatever happens next. A replayed
    // callback URL has to fail the second time.
    let expectedState = null
    try {
      expectedState = sessionStorage.getItem('plainly_oauth_state')
      sessionStorage.removeItem('plainly_oauth_state')
    } catch { /* storage blocked — treated as no match below */ }

    if (error || !code) {
      navigate('/?auth_error=' + (error || 'no_code'), { replace: true })
      return
    }

    // Checked before the exchange, never after: without this, anyone can hand
    // someone a callback link and sign them into an account they didn't pick.
    if (!expectedState || returnedState !== expectedState) {
      navigate('/?auth_error=state_mismatch', { replace: true })
      return
    }

    fetch('/api/oauth/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        onSignIn(data.token)
        navigate('/', { replace: true })
      })
      .catch(() => navigate('/?auth_error=exchange_failed', { replace: true }))
  }, [])

  return (
    <div className="loading-screen">
      <div className="wordmark">plainly</div>
      <p className="loading-text">Signing you in…</p>
    </div>
  )
}
