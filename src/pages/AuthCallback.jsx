import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AuthCallback({ onSignIn }) {
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const error = params.get('error')

    if (error || !code) {
      navigate('/?auth_error=' + (error || 'no_code'), { replace: true })
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
