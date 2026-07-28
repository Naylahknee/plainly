/**
 * AppShell.jsx
 *
 * App-level layout: 248px sticky left sidebar + scrollable content area.
 * Every signed-in route renders inside this shell.
 *
 * Sidebar sections:
 *   - Wordmark + tagline
 *   - Global nav: Home · My Projects · Recent Activity · Account · Help
 *   - Project nav (only when inside /p/:repo): Project Home · Updates ·
 *     Make an Update · Project Files · What Changed · Save Points ·
 *     Separate Versions · Who Can See It · Settings
 *   - Footer: avatar + GitHub login + connection dot
 */

import { NavLink, useParams, Link } from 'react-router-dom'

function NavItem({ to, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        isActive ? 'shell-nav-item shell-nav-item--active' : 'shell-nav-item'
      }
    >
      {label}
    </NavLink>
  )
}

export default function AppShell({ auth, children }) {
  const { repo } = useParams()
  // If the :repo param is present, we're inside a project
  const inProject = Boolean(repo)

  const user = auth?.user
  const avatarUrl = user?.avatar_url
  const login = user?.login

  return (
    <div className="shell">
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <nav className="shell-sidebar" aria-label="Main navigation">
        {/* Wordmark */}
        <Link to="/" className="shell-wordmark" aria-label="Plainly home">
          <span className="wordmark">plainly</span>
          <span className="shell-tagline">GitHub in plain English</span>
        </Link>

        {/* Global nav */}
        <div className="shell-nav-group">
          <NavItem to="/" end label="Home" />
          <NavItem to="/projects" label="My Projects" />
          <NavItem to="/activity" label="Recent Activity" />
          <NavItem to="/account" label="Account" />
          <NavItem to="/help" label="Help" />
        </div>

        {/* Project nav — only when inside /p/:repo */}
        {inProject && repo && (
          <div className="shell-nav-group">
            <p className="shell-nav-heading">
              {repo.replace(/-/g, ' ')}
            </p>
            <NavItem to={`/p/${repo}`}          end   label="Project Home" />
            <NavItem to={`/p/${repo}/updates`}        label="Updates" />
            <NavItem to={`/p/${repo}/new-update`}     label="Make an Update" />
            <NavItem to={`/p/${repo}/files`}          label="Project Files" />
            <NavItem to={`/p/${repo}/changed`}        label="What Changed" />
            <NavItem to={`/p/${repo}/points`}         label="Save Points" />
            <NavItem to={`/p/${repo}/versions`}       label="Separate Versions" />
            <NavItem to={`/p/${repo}/share`}          label="Who Can See It" />
            <NavItem to={`/p/${repo}/settings`}       label="Settings" />
          </div>
        )}

        {/* Sidebar footer */}
        <div className="shell-footer">
          {avatarUrl && (
            <img
              src={avatarUrl}
              alt={login ? `${login}'s avatar` : 'Your avatar'}
              className="shell-avatar"
              width={32}
              height={32}
            />
          )}
          <div className="shell-footer-text">
            {login && <span className="shell-footer-login">{login}</span>}
            <span className="shell-footer-status">
              <span className="shell-status-dot" aria-hidden="true" />
              Connected
            </span>
          </div>
        </div>
      </nav>

      {/* ── Content area ──────────────────────────────────────────────── */}
      <main className="shell-content">
        {children}
      </main>
    </div>
  )
}
