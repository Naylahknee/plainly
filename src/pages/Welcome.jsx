/**
 * Welcome.jsx — / (signed out)  (max-width 940px)
 *
 * This screen exists because the old sign-in never said what the product is
 * for. Two columns: what Plainly does on the left, the word-for-word
 * translation table on the right. Do not shorten it (HANDOFF §7.1).
 *
 * It also starts the OAuth flow, and it is where people land when something
 * about that flow didn't work — so every failure gets a sentence saying what
 * happened and what to do, never a silent bounce.
 */

import { useState } from 'react'
import BrandWordmark from '../components/BrandWordmark'

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

  const [signingIn, setSigningIn] = useState(false)
  const [startFailed, setStartFailed] = useState(false)

  async function startSignIn() {
    if (missingConfig || signingIn) return
    setSigningIn(true)
    setStartFailed(false)
    try {
      const response = await fetch('/api/oauth/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await response.json()
      if (!response.ok || !data.authorizeUrl) throw new Error('could_not_start')
      window.location.assign(data.authorizeUrl)
    } catch {
      setStartFailed(true)
      setSigningIn(false)
    }
  }

  // GitHub sends people back here with ?auth_error when sign-in doesn't finish.
  const params = new URLSearchParams(window.location.search)
  const authError = params.get('auth_error')
  const disconnectFailed = params.get('disconnect_failed') === '1'

  return (
    <div className="welcome-page">
      <div className="welcome-grid">
        <div>
          <div className="welcome-wordmark"><BrandWordmark className="brand-wordmark--welcome" /></div>
          <h1 className="welcome-title">Your work, made clear.</h1>
          <p className="welcome-lead">
            Yourkly sits on top of the GitHub account you already have and does one job:
            tell you where you left off, what changed, and what to do next — without the jargon.
          </p>
          <p className="welcome-note">
            Your files stay in your real GitHub repositories. Nothing is copied anywhere else.
          </p>

          {authError === 'state_mismatch' ? (
            <p className="error-box welcome-error">
              Yourkly couldn't confirm that sign-in started here, so it stopped. Nothing was
              lost — press the button below to start again.
            </p>
          ) : authError ? (
            <p className="error-box welcome-error">
              Sign-in didn't finish. Nothing was lost — please try again.
            </p>
          ) : null}

          {startFailed && (
            <p className="error-box welcome-error">
              Yourkly could not start the secure sign-in check. Please try again.
            </p>
          )}

          {disconnectFailed && (
            <p className="error-box welcome-error">
              You're signed out on this computer, but Yourkly couldn't reach GitHub to
              disconnect. GitHub may still list Yourkly as connected — you can remove it at{' '}
              <a href="https://github.com/settings/applications" target="_blank" rel="noopener noreferrer">
                github.com/settings/applications
              </a>.
            </p>
          )}

          {missingConfig ? (
            <p className="error-box">
              Configuration missing — set <code>VITE_GITHUB_CLIENT_ID</code> to enable sign-in.
            </p>
          ) : (
            <div className="welcome-cta-stack">
              <button type="button" onClick={startSignIn} className="welcome-cta" disabled={signingIn}>
                {signingIn ? 'Opening GitHub…' : 'Sign in with GitHub'}
              </button>
              <span className="welcome-hint">
                No new password. Your GitHub account is your login.
              </span>
            </div>
          )}
        </div>

        <div className="welcome-card">
          <div className="welcome-card-label">What Yourkly calls things</div>
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
