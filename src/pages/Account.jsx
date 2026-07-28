/**
 * Account.jsx — /account
 *
 * Shows current GitHub account, connection status, and sign-out.
 */

import { useNavigate } from 'react-router-dom'

export default function Account({ auth }) {
  const { user, signOut } = auth
  const navigate = useNavigate()

  function handleSignOut() {
    signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="screen-padded">
      <div className="screen-header">
        <h1>Account</h1>
      </div>

      {user && (
        <div className="account-card">
          <div className="account-identity">
            {user.avatar_url && (
              <img
                src={user.avatar_url}
                alt={`${user.login}'s avatar`}
                className="account-avatar"
                width={64}
                height={64}
              />
            )}
            <div className="account-details">
              {user.name && <p className="account-name">{user.name}</p>}
              <p className="account-login">@{user.login}</p>
              {user.email && <p className="account-email">{user.email}</p>}
            </div>
          </div>

          <div className="account-status">
            <span className="shell-status-dot" aria-hidden="true" />
            <span>Connected to GitHub</span>
          </div>
        </div>
      )}

      <div className="account-actions">
        <button className="btn-ghost" onClick={handleSignOut}>
          Sign out
        </button>
      </div>
    </div>
  )
}
