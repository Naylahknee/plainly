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

  function signOut() {
    localStorage.removeItem('plainly_token')
    setToken(null)
    setUser(null)
  }

  return { token, user, loading, signIn, signOut }
}
