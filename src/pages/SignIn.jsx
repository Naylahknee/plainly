import { useEffect, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'

export default function SignIn() {
  const location = useLocation()
  const [error, setError] = useState(null)

  useEffect(() => {
    const p = new URLSearchParams(location.search)
    if (p.get('auth_error')) setError('Something went wrong signing in. Please try again.')
  }, [location.search])

  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID
  const missingConfig = !clientId
  const authUrl = missingConfig
    ? null
    : `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo`

  return (
    <div className="signin-page">
      <div className="signin-card">
        <div className="wordmark">plainly</div>
        <h1 className="signin-tagline">Version control in plain words.</h1>
        <p className="signin-sub">
          Keep your writing safe. Go back to any version. No tech jargon required.
        </p>

        <ul className="signin-features">
          <li>Every version of your work is kept safe</li>
          <li>Go back to any save point, any time</li>
          <li>Works with files you already have</li>
        </ul>

        {error && <p className="error-box">{error}</p>}

        {missingConfig ? (
          <p className="error-box">
            Local configuration is missing. Copy <code>.env.example</code> to{' '}
            <code>.env</code> and set <code>VITE_GITHUB_CLIENT_ID</code> to your
            GitHub OAuth App client ID, then restart the dev server.
          </p>
        ) : (
          <a href={authUrl} className="btn-primary signin-btn">
            Get started
          </a>
        )}

        <Link to="/help" className="signin-help-link">How it works →</Link>
      </div>
    </div>
  )
}
