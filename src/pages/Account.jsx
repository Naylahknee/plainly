/**
 * Account.jsx — /account  (max-width 660px)
 *
 * Who you're signed in as, what Plainly is allowed to do, and the one setting
 * (HANDOFF §7.19). Sign out lives here — it is the only way out of the app,
 * and the design's sidebar has no room for it.
 *
 * Signing out revokes the GitHub authorization, so it is the disconnect this
 * screen has always claimed to offer. That makes it slower than clearing a
 * token and worth telling the user about, hence the button state and the note.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useShowGithubWords } from '../utils/settings'

export default function Account({ auth }) {
  const { user, signOut } = auth
  const navigate = useNavigate()
  const [showWords, toggleWords] = useShowGithubWords()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    const { revoked } = await signOut()
    // You're signed out either way. If GitHub still lists Plainly, the Welcome
    // screen says so and points at where to remove it.
    navigate(revoked ? '/' : '/?disconnect_failed=1', { replace: true })
  }

  return (
    <div className="screen-padded account-screen">
      <h1 className="account-title">Account</h1>

      <div className="account-card">
        <div className="account-identity">
          {user?.avatar_url
            ? <img src={user.avatar_url} alt="" className="account-avatar" width={52} height={52} />
            : <div className="account-avatar account-avatar--blank" aria-hidden="true" />}
          <div>
            <div className="account-login">{user?.login || '—'}</div>
            <div className="account-sub">Signed in with GitHub</div>
          </div>
        </div>

        <div className="account-permission">
          <div className="account-tick" aria-hidden="true">✓</div>
          <div className="account-permission-text">
            Plainly can read and save to your projects. You can disconnect any time and your
            files stay in GitHub.
          </div>
        </div>
      </div>

      <div className="account-card account-card--setting">
        <div className="account-setting-title">Show technical GitHub words</div>
        <div className="account-setting-body">
          Adds the real GitHub term in grey next to Plainly's plain-English label, so you learn
          them as you go.
        </div>
        <button className="pl-btn" onClick={toggleWords}>
          {showWords ? 'Turn off technical words' : 'Turn on technical words'}
        </button>
      </div>

      <div className="account-signout">
        <button className="pl-btn" onClick={handleSignOut} disabled={signingOut}>
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
        <span className="account-signout-note">
          This also disconnects Plainly from your GitHub account. Your files stay in GitHub,
          and anything you haven't saved yet stays on this computer. Next time you sign in,
          GitHub will ask you to allow access again.
        </span>
      </div>
    </div>
  )
}
