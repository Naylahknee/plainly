/**
 * Home.jsx — /
 *
 * Dashboard for signed-in users.
 * Shows greeting, the active update hero across all projects, and quick links.
 */

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getUpdates, getActiveUpdate, STATUS_LABEL } from '../utils/updateMemory'
import { getMemory } from '../utils/projectMemory'
import { heroFor, projectNextAction } from '../utils/heroFor'
import { greeting } from '../utils/time'
import { getRepos } from '../api/github'

export default function Home({ auth }) {
  const { user, token } = auth
  const navigate = useNavigate()
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    getRepos(token)
      .then(r => setRepos(r || []))
      .catch(() => setRepos([]))
      .finally(() => setLoading(false))
  }, [token])

  const owner = user?.login

  // Collect the most recent active update across all loaded repos
  let heroUpdate = null
  let heroRepo = null
  if (owner) {
    for (const r of repos) {
      const active = getActiveUpdate(owner, r.name)
      if (active) { heroUpdate = active; heroRepo = r.name; break }
    }
  }

  const hero = heroUpdate
    ? heroFor(heroUpdate, { filesCount: (heroUpdate.files || []).length })
    : null

  return (
    <div className="screen-home">
      <h1 className="screen-home-greeting">
        {greeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}.
      </h1>

      {/* Active update hero */}
      {heroUpdate && heroRepo && hero && (
        <section className="hero-card">
          <p className="hero-card-repo">{heroRepo.replace(/-/g, ' ')}</p>
          <h2 className="hero-card-title">{heroUpdate.title}</h2>
          <div className="hero-card-rows">
            <div className="hero-row">
              <span className="hero-label">Where you left off</span>
              <span className="hero-value">{hero.left}</span>
            </div>
            <div className="hero-row">
              <span className="hero-label">Since then</span>
              <span className="hero-value">{hero.since}</span>
            </div>
            <div className="hero-row">
              <span className="hero-label">Next step</span>
              <span className="hero-value">{hero.next}</span>
            </div>
          </div>
          <div className="hero-cta-row">
            <button
              className="btn-primary"
              onClick={() => navigate(`/p/${heroRepo}/u/${heroUpdate.id}/${hero.route}`)}
            >
              {hero.cta}
            </button>
            <Link to={`/p/${heroRepo}`} className="btn-ghost">Go to project</Link>
          </div>
        </section>
      )}

      {/* No active work */}
      {!loading && !heroUpdate && (
        <section className="hero-card hero-card--empty">
          <p className="hero-empty-text">
            You don't have any updates in progress. Open a project to start one.
          </p>
          <Link to="/projects" className="btn-primary">My Projects</Link>
        </section>
      )}

      {loading && (
        <p className="state-loading">Loading your projects…</p>
      )}

      {/* Quick links */}
      <nav className="home-quick-links" aria-label="Quick links">
        <Link to="/projects" className="quick-link">My Projects</Link>
        <Link to="/new" className="quick-link">New Project</Link>
        <Link to="/activity" className="quick-link">Recent Activity</Link>
        <Link to="/help" className="quick-link">Help</Link>
      </nav>
    </div>
  )
}
