/**
 * AppShell.jsx
 *
 * App-level layout: 248px sticky left sidebar + scrollable content area.
 * Every signed-in route renders inside this shell.
 *
 * Sidebar sections:
 *   - Wordmark + tagline
 *   - Global nav: Home · My Projects · Recent Activity · Account · Help
 *   - Help topics (only when inside /help): the six Help sections
 *   - Project nav (only when inside /p/:repo): Project Home · Updates ·
 *     Make an Update · Project Files · What Changed · Save Points ·
 *     Separate Versions · Who Can See It · Continue with AI · Settings
 *   - Footer: avatar + GitHub login + connection status
 *
 * This is the only navigation in the app. No page renders one of its own.
 */

import { NavLink, useParams, useLocation, Link } from 'react-router-dom'
import { getActiveUpdate } from '../utils/updateMemory'
import { projectName } from '../utils/projectName'
import { aiRouteFor } from '../utils/aiRoute'
import { SECTIONS as HELP_SECTIONS } from '../help/content'

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
  const { owner, repo } = useParams()
  const { pathname } = useLocation()
  // If the :repo param is present, we're inside a project
  const inProject = Boolean(owner && repo)
  // Help opens its own topic list, the same way a project opens its own nav.
  const inHelp = pathname === '/help' || pathname.startsWith('/help/')

  const user = auth?.user
  const avatarUrl = user?.avatar_url
  const login = user?.login

  const activeUpdate = inProject ? getActiveUpdate(owner, repo) : null

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

        {/* Help topics — only while you're in Help */}
        {inHelp && (
          <div className="shell-nav-group">
            <p className="shell-nav-heading">Help topics</p>
            {HELP_SECTIONS.map(s => (
              <NavItem key={s.path} to={s.path} end={s.path === '/help'} label={s.label} />
            ))}
          </div>
        )}

        {/* Project nav — only when inside /p/:repo */}
        {inProject && (
          <div className="shell-nav-group">
            <p className="shell-nav-heading">
              {projectName(repo)}
              {/* Whose it is, but only when that isn't obvious. */}
              {owner !== login && <span className="shell-nav-owner">{owner}</span>}
            </p>
            <NavItem to={`/p/${owner}/${repo}`}          end   label="Project Home" />
            <NavItem to={`/p/${owner}/${repo}/updates`}        label="Updates" />
            <NavItem to={`/p/${owner}/${repo}/new-update`}     label="Make an Update" />
            <NavItem to={`/p/${owner}/${repo}/files`}          label="Project Files" />
            <NavItem to={`/p/${owner}/${repo}/changed`}        label="What Changed" />
            <NavItem to={`/p/${owner}/${repo}/points`}         label="Save Points" />
            <NavItem to={`/p/${owner}/${repo}/versions`}       label="Separate Versions" />
            <NavItem to={`/p/${owner}/${repo}/share`}          label="Who Can See It" />
            {/* Opens the handoff for the update in progress, or for the project
                itself when there isn't one yet. Same helper as Project Home. */}
            <NavItem to={aiRouteFor(owner, repo, activeUpdate)} label="Continue with AI" />
            <NavItem to={`/p/${owner}/${repo}/settings`}       label="Settings" />
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
            <span className="shell-footer-status">GitHub connected</span>
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
