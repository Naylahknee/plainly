/**
 * Welcome.jsx — / (signed out)  (max-width 940px)
 *
 * The signed-out landing page introduces what Yourkly does through an
 * animated product preview, then gives people one clear path into GitHub
 * sign-in.
 *
 * It also starts the OAuth flow, and it is where people land when something
 * about that flow didn't work — so every failure gets a sentence saying what
 * happened and what to do, never a silent bounce.
 */

import { useEffect, useState } from 'react'
import BrandWordmark from '../components/BrandWordmark'
import storkUrl from '../assets/brand/yourkly-stork.png'

export default function Welcome() {
  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID
  const missingConfig = !clientId

  const [signingIn, setSigningIn] = useState(false)
  const [startFailed, setStartFailed] = useState(false)
  const [previewScene, setPreviewScene] = useState(0)

  useEffect(() => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
      setPreviewScene(2)
      return undefined
    }

    const steps = [
      [1, 2300], [2, 4600], [0, 7200], [1, 9500], [2, 11800],
    ]
    const timers = steps.map(([scene, delay]) => setTimeout(() => setPreviewScene(scene), delay))
    return () => timers.forEach(clearTimeout)
  }, [])

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
      <div className="landing-shell">
        <header className="landing-header">
          <BrandWordmark className="brand-wordmark--landing" />
          {!missingConfig && (
            <button type="button" className="landing-signin" onClick={startSignIn} disabled={signingIn}>
              {signingIn ? 'Opening GitHub…' : 'Sign in'}
            </button>
          )}
        </header>

        <main>
          <section className="landing-hero">
            <div className="landing-hero-copy">
              <h1>Know exactly what to do next in your GitHub project.</h1>
              <p>
                Yourkly reads the GitHub account you already have and tells you where you left
                off, what changed, and what to do next.
              </p>

              {authError === 'state_mismatch' ? (
                <p className="error-box welcome-error">
                  Yourkly couldn't confirm that sign-in started here, so it stopped. Nothing was
                  lost — press the button below to start again.
                </p>
              ) : authError ? (
                <p className="error-box welcome-error">Sign-in didn't finish. Nothing was lost — please try again.</p>
              ) : null}

              {startFailed && <p className="error-box welcome-error">Yourkly could not start the secure sign-in check. Please try again.</p>}

              {disconnectFailed && (
                <p className="error-box welcome-error">
                  You're signed out on this computer, but Yourkly couldn't reach GitHub to disconnect. You can remove
                  the connection in <a href="https://github.com/settings/applications" target="_blank" rel="noopener noreferrer">GitHub settings</a>.
                </p>
              )}

              {missingConfig ? (
                <p className="error-box">Configuration missing — set <code>VITE_GITHUB_CLIENT_ID</code> to enable sign-in.</p>
              ) : (
                <div className="landing-cta-stack">
                  <button type="button" onClick={startSignIn} className="landing-cta" disabled={signingIn}>
                    {signingIn ? 'Opening GitHub…' : 'Continue with GitHub'}
                  </button>
                  <span>No new password. Your GitHub account is your login.</span>
                </div>
              )}
            </div>

            <div className="landing-product-wrap">
              <img className="landing-stork" src={storkUrl} alt="" aria-hidden="true" />
              <div className={`landing-product-preview landing-product-preview--scene-${previewScene}`} aria-label="Yourkly project preview">
                <div className="landing-product-head">
                  <span className="landing-product-icon">y</span>
                  <span><strong>Yourkly</strong><small>Updated 2 hours ago</small></span>
                </div>
                <div className="landing-product-scenes">
                  <div className="landing-product-scene landing-product-scene--0">
                    <span className="landing-product-label">Where you left off</span>
                    <div className="landing-task-card">
                      <div><strong>Improve the landing page</strong><em>In progress</em></div>
                      <p>You were working on the welcome screen.</p>
                    </div>
                  </div>
                  <div className="landing-product-scene landing-product-scene--1">
                    <span className="landing-product-label">What changed</span>
                    <div className="landing-change-row"><b>✓</b> Updated the welcome screen</div>
                    <div className="landing-change-row landing-change-row--second"><b>✓</b> Added a share image</div>
                  </div>
                  <div className="landing-product-scene landing-product-scene--2">
                    <span className="landing-product-label">What to do next</span>
                    <div className="landing-task-card landing-task-card--next">
                      <strong>Review the landing-page update, then continue in Lovable.</strong>
                      <span className="landing-preview-action">Continue in Lovable <i aria-hidden="true">→</i></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="landing-trust">Your files stay in GitHub. Yourkly doesn’t copy your projects.</section>

          <section className="landing-steps">
            <h2>Three steps, then you’re working.</h2>
            <div className="landing-step-grid">
              <article><span>01</span><h3>Connect GitHub</h3><p>One click. No new account, nothing to move.</p></article>
              <article><span>02</span><h3>Yourkly explains your project</h3><p>Where you left off, what changed, and what to do next — in plain words.</p></article>
              <article><span>03</span><h3>Continue anywhere</h3><p>Pick up the work in Yourkly, Lovable, ChatGPT, or Cursor.</p></article>
            </div>
          </section>
        </main>

        <footer className="landing-footer">
          <span>© 2026 Yourkly</span>
          <a href="https://github.com/Naylahknee/plainly/issues/new" target="_blank" rel="noopener noreferrer">Support</a>
        </footer>
      </div>
    </div>
  )
}
