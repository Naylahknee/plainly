/**
 * Welcome.jsx — / (signed out)  (max-width 940px)
 *
 * This screen exists because the old sign-in never said what the product is
 * for. Two columns: what Plainly does on the left, the word-for-word
 * translation table on the right. Do not shorten it (HANDOFF §7.1).
 */

// Repository → Project, and the rest. The whole product in six rows.
const TRANSLATIONS = [
  ['Repository', 'Project'],
  ['Commit',     'Save Point'],
  ['Push',       'Save to GitHub'],
  ['Pull',       'Get latest version'],
  ['Branch',     'Separate version'],
  ['Diff',       'See what changed'],
]

export default function Welcome() {
  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID
  const missingConfig = !clientId
  const authUrl = missingConfig
    ? null
    : `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo`

  // GitHub sends people back here with ?auth_error when sign-in doesn't finish.
  const authError = new URLSearchParams(window.location.search).get('auth_error')

  return (
    <div className="welcome-page">
      <div className="welcome-grid">
        <div>
          <div className="welcome-wordmark">plainly</div>
          <h1 className="welcome-title">Your GitHub projects, in plain English.</h1>
          <p className="welcome-lead">
            Plainly sits on top of the GitHub account you already have and does one job:
            tell you where you left off, what changed, and what to do next — without the jargon.
          </p>
          <p className="welcome-note">
            Your files stay in your real GitHub repositories. Nothing is copied anywhere else.
          </p>

          {authError && (
            <p className="error-box welcome-error">
              Sign-in didn't finish. Nothing was lost — please try again.
            </p>
          )}

          {missingConfig ? (
            <p className="error-box">
              Configuration missing — set <code>VITE_GITHUB_CLIENT_ID</code> to enable sign-in.
            </p>
          ) : (
            <div className="welcome-cta-stack">
              <a href={authUrl} className="welcome-cta">Sign in with GitHub</a>
              <span className="welcome-hint">
                No new password. Your GitHub account is your login.
              </span>
            </div>
          )}
        </div>

        <div className="welcome-card">
          <div className="welcome-card-label">What Plainly calls things</div>
          <div className="welcome-rows">
            {TRANSLATIONS.map(([github, plain], i) => (
              <div key={github}>
                {i > 0 && <div className="welcome-rule" />}
                <div className="welcome-row">
                  <span className="welcome-row-github">{github}</span>
                  <span className="welcome-row-arrow" aria-hidden="true">→</span>
                  <span className="welcome-row-plain">{plain}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
