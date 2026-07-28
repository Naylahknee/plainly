/**
 * Welcome.jsx — / (unauthenticated)
 *
 * Marketing / sign-in landing page for users who are not signed in.
 * Uses the same GitHub OAuth URL as SignIn.jsx.
 */

export default function Welcome() {
  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID
  const missingConfig = !clientId
  const authUrl = missingConfig
    ? null
    : `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo`

  return (
    <div className="welcome-page">
      <div className="welcome-inner">
        <div className="wordmark welcome-wordmark">plainly</div>
        <p className="welcome-tagline">GitHub in plain English.</p>
        <p className="welcome-body">
          Write, save, and manage your GitHub project without needing to know Git.
          Work with any AI tool and keep everything safe in one place.
        </p>
        {missingConfig ? (
          <p className="error-box">
            Configuration missing — set <code>VITE_GITHUB_CLIENT_ID</code> to enable sign-in.
          </p>
        ) : (
          <a href={authUrl} className="btn-primary welcome-cta">
            Continue with GitHub
          </a>
        )}
        <p className="welcome-hint">
          Free to use. Requires a GitHub account.
        </p>
      </div>
    </div>
  )
}
