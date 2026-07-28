/**
 * Home.jsx — /` (max-width 1000px)
 *
 * Dashboard for signed-in users.
 * Answers three questions: where did I leave off, what happened since, what should I do next?
 *
 * Section order:
 * 1. Greeting + All Projects button + subtitle
 * 2. Dismissible explainer box (lilac background)
 * 3. CONTINUE WHERE YOU LEFT OFF — hero card with active update
 * 4. WHAT NEEDS YOUR ATTENTION — state-driven section
 * 5. Two columns: RECENT PROJECTS (left) + RECENT ACTIVITY (right)
 */

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getUpdates, getActiveUpdate, STATUS_LABEL } from '../utils/updateMemory'
import { heroFor } from '../utils/heroFor'
import { greeting } from '../utils/time'
import { getRepos } from '../api/github'
import { projectName } from '../utils/projectName'

const EXPLAINER_DISMISSED_KEY = 'plainly_home_explainer_dismissed'

export default function Home({ auth }) {
  const { user, token } = auth
  const navigate = useNavigate()
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)
  const [explainerDismissed, setExplainerDismissed] = useState(() => {
    try {
      return localStorage.getItem(EXPLAINER_DISMISSED_KEY) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (!token) return
    getRepos(token)
      .then(r => setRepos(r || []))
      .catch(() => setRepos([]))
      .finally(() => setLoading(false))
  }, [token])

  const owner = user?.login

  // Find the most recent active update across all repos
  let heroUpdate = null
  let heroRepo = null
  if (owner) {
    for (const r of repos) {
      const active = getActiveUpdate(owner, r.name)
      if (active) {
        heroUpdate = active
        heroRepo = r.name
        break
      }
    }
  }

  const hero = heroUpdate && heroRepo
    ? heroFor(heroUpdate, { filesCount: (heroUpdate.files || []).length })
    : null

  const dismissExplainer = () => {
    try {
      localStorage.setItem(EXPLAINER_DISMISSED_KEY, 'true')
      setExplainerDismissed(true)
    } catch {
      // silently fail
    }
  }

  // Count updates in progress across all repos
  const updateCount = owner
    ? repos.reduce((sum, r) => sum + (getUpdates(owner, r.name) || []).filter(u => u.status !== 'saved' && u.status !== 'paused').length, 0)
    : 0

  return (
    <div className="page">
      <main className="page-main" style={{ maxWidth: '1000px' }}>
        {/* 1. Greeting + All Projects button + subtitle */}
        <div className="home-header">
          <div>
            <h1 className="home-greeting">
              {greeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}.
            </h1>
            <p className="home-subtitle">
              Here's where you left off, what changed, and what to do next.
            </p>
          </div>
          <Link to="/projects" className="btn-ghost" style={{ whiteSpace: 'nowrap' }}>
            All projects
          </Link>
        </div>

        {/* 2. Dismissible explainer */}
        {!explainerDismissed && (
          <section className="home-explainer">
            <div>
              <p className="home-explainer-title">New here? This is what Plainly does.</p>
              <p className="home-explainer-body">
                Your work lives in GitHub. Plainly is the front door: it remembers where you stopped,
                explains what changed in normal words, and keeps a Save Point every time you save so
                you can always go back.
              </p>
            </div>
            <button
              className="home-explainer-dismiss"
              onClick={dismissExplainer}
            >
              Got it
            </button>
          </section>
        )}

        {/* 3. CONTINUE WHERE YOU LEFT OFF — hero card */}
        {heroUpdate && heroRepo && hero && (
          <section className="home-hero-card">
            <div className="home-hero-context">
              <span className="home-hero-project">{projectName(heroRepo)}</span>
              <span className="home-hero-separator">·</span>
              <span className="home-hero-label">Update</span>
              <span className={`pl-pill pl-pill--${heroUpdate.status}`}>
                {STATUS_LABEL[heroUpdate.status]}
              </span>
            </div>
            <h2 className="home-hero-title">{heroUpdate.title}</h2>
            {heroUpdate.goal && (
              <p className="home-hero-goal">{heroUpdate.goal}</p>
            )}
            <div className="home-hero-panel">
              <div className="home-hero-row">
                <span className="home-hero-row-label">Where you left off</span>
                <span className="home-hero-row-value">{hero.left}</span>
              </div>
              <div className="home-hero-row">
                <span className="home-hero-row-label">What's happened since</span>
                <span className="home-hero-row-value">{hero.since}</span>
              </div>
              <div className="home-hero-row">
                <span className="home-hero-row-label" style={{ color: 'var(--purple)', fontWeight: '600' }}>
                  What to do next
                </span>
                <span className="home-hero-row-value" style={{ fontWeight: '600' }}>
                  {hero.next}
                </span>
              </div>
            </div>
            <div className="home-hero-actions">
              <button
                className="pl-btn-primary"
                onClick={() => navigate(`/p/${heroRepo}/u/${heroUpdate.id}/${hero.route}`)}
              >
                {hero.cta}
              </button>
              <Link to={`/p/${heroRepo}`} className="pl-btn">
                Open the update
              </Link>
              {updateCount > 1 && (
                <button
                  className="home-hero-updates-link"
                  onClick={() => navigate(`/p/${heroRepo}/updates`)}
                >
                  {updateCount} updates in progress →
                </button>
              )}
            </div>
          </section>
        )}

        {/* 3b. Empty state when no active update */}
        {!loading && !heroUpdate && (
          <section className="home-hero-card home-hero-empty">
            <p className="home-hero-empty-title">You haven't started an update yet.</p>
            <p className="home-hero-empty-next">Describe what you want to change.</p>
            <button
              className="pl-btn-primary"
              onClick={() => navigate('/projects')}
            >
              Make an update
            </button>
          </section>
        )}

        {/* 4. WHAT NEEDS YOUR ATTENTION */}
        <section className="home-attention">
          <h2 className="home-attention-title">What needs your attention</h2>
          {!loading && !heroUpdate && (
            <div className="home-attention-none">
              <span style={{ color: 'var(--success)' }}>✓</span>
              <p>Nothing needs you right now. Everything is saved in GitHub.</p>
            </div>
          )}
          {/* More complex logic for attention items would go here */}
        </section>

        {/* 5. Two columns: RECENT PROJECTS + RECENT ACTIVITY */}
        <div className="home-columns">
          <div className="home-column-projects">
            <h2 className="home-section-title">Recent projects</h2>
            {repos.slice(0, 3).map(repo => (
              <Link
                key={repo.name}
                to={`/p/${repo.name}`}
                className="home-project-card"
              >
                <div className="home-project-info">
                  <p className="home-project-name">{projectName(repo.name)}</p>
                  <p className="home-project-desc">{repo.description || 'No description'}</p>
                  <p className="home-project-url">
                    <code>github.com/{owner}/{repo.name}</code>
                  </p>
                </div>
              </Link>
            ))}
            <Link to="/projects" className="home-view-all">
              View all projects →
            </Link>
          </div>
          <div className="home-column-activity">
            <h2 className="home-section-title">Recent activity</h2>
            <p className="home-activity-empty">Activity tracking coming soon.</p>
            <Link to="/activity" className="home-view-all">
              View all activity →
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
