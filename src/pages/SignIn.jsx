import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

export default function SignIn() {
  const location = useLocation()
  const [error, setError] = useState(null)

  useEffect(() => {
    const p = new URLSearchParams(location.search)
    if (p.get('auth_error')) setError('Something went wrong signing in. Please try again.')
  }, [location.search])

  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo`

  return (
    <div className="signin-page">
      <div className="signin-card">
        <div className="wordmark">plainly</div>
        <h1 className="signin-tagline">Version control in plain words.</h1>
        <p className="signin-sub">
          Keep your writing safe. Go back to any version. No tech jargon required.
        </p>
        {error && <p className="error-box">{error}</p>}
        <a href={authUrl} className="btn-primary signin-btn">
          Get started
        </a>
      </div>
    </div>
  )
}
