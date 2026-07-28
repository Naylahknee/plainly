import { useState, useEffect } from 'react'
import { getUser } from '../api/github'

export function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem('plainly_token'))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(!!localStorage.getItem('plainly_token'))

  useEffect(() => {
    if (!token) { setLoading(false); return }
    getUser(token)
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('plainly_token')
        setToken(null)
      })
      .finally(() => setLoading(false))
  }, [token])

  function signIn(newToken) {
    localStorage.setItem('plainly_token', newToken)
    setToken(newToken)
  }

  /**
   * Signs out here, then disconnects Plainly from GitHub.
   *
   * The stored token goes first, before anything can fail: close the tab
   * mid-request and you are still signed out next time. Nobody gets stuck
   * signed in because a network call didn't land.
   *
   * React state is cleared *after* the request, deliberately. Clearing it
   * first unmounts the screen that called this — Protected bounces to "/" the
   * moment the token goes — and the caller's navigate() then fires from a dead
   * component, updating the URL without re-rendering. The failure message
   * never appeared. Clearing afterwards puts the state change in the same tick
   * as the caller's navigate, so React renders both together.
   *
   * Drafts (plainly_drafts_*) are deliberately left alone. They are the one
   * store that holds work GitHub doesn't have yet.
   */
  async function signOut() {
    const current = token
    localStorage.removeItem('plainly_token')

    let revoked = true
    if (current) {
      try {
        const r = await fetch('/api/oauth/revoke', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: current }),
          // A hanging request must not leave someone staring at "Signing out…".
          signal: AbortSignal.timeout(8000),
        })
        revoked = r.ok
      } catch {
        revoked = false
      }
    }

    setToken(null)
    setUser(null)
    return { revoked }
  }

  return { token, user, loading, signIn, signOut }
}
