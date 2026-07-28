/**
 * ProjectHome.jsx — /p/:repo
 *
 * The landing screen for a project.
 * Shows: project name/description, the active update hero, and recommended next action.
 */

import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getRepoInfo } from '../api/github'
import { getActiveUpdate, getUpdates, STATUS_LABEL } from '../utils/updateMemory'
import { heroFor, projectNextAction } from '../utils/heroFor'
import { timeAgo } from '../utils/time'

export default function ProjectHome({ auth }) {
  const { repo } = useParams()
  const navigate = useNavigate()
  const { token, user } = auth
  const owner = user?.login

  const [repoData, setRepoData]   = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  useEffect(() => {
    if (!token || !owner) return
    setLoading(true)
    getRepoInfo(token, owner, repo)
      .then(r => setRepoData(r))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [token, owner, repo])

  const projectTitle = repo.replace(/-/g, ' ')
  const activeUpdate = owner ? getActiveUpdate(owner, repo) : null
  const allUpdates   = owner ? getUpdates(owner, repo) : []

  const hero = activeUpdate
    ? heroFor(activeUpdate, { filesCount: (activeUpdate.files || []).length })
    : null

  const recommendation = projectNextAction({ activeUpdate })

  if (loading) {
    return (
      <div className="screen-padded">
        <p className="state-loading">Loading project…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="screen-padded">
        <p className="error-box">{error}</p>
      </div>
    )
  }

  return (
    <div className="screen-padded">
      {/* Project identity */}
      <div className="project-home-header">
        <h1 className="project-home-title">{projectTitle}</h1>
        {repoData?.description && (
          <p className="project-home-desc">{repoData.description}</p>
        )}
      </div>

      {/* Recommended next action */}
      <section className="recommendation-bar">
        <p className="recommendation-text">{recommendation.text}</p>
        {activeUpdate ? (
          <button
            className="btn-primary recommendation-cta"
            onClick={() => navigate(`/p/${repo}/u/${activeUpdate.id}/${recommendation.route}`)}
          >
            {recommendation.cta}
          </button>
        ) : (
          <Link
            to={`/p/${repo}/${recommendation.route}`}
            className="btn-primary recommendation-cta"
          >
            {recommendation.cta}
          </Link>
        )}
      </section>

      {/* Active update hero */}
      {activeUpdate && hero && (
        <section className="hero-card">
          <div className="hero-card-top">
            <span className={`status-pill status-pill--${activeUpdate.status}`}>
              {STATUS_LABEL[activeUpdate.status]}
            </span>
            <span className="hero-card-update-title">{activeUpdate.title}</span>
          </div>
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
              onClick={() => navigate(`/p/${repo}/u/${activeUpdate.id}/${hero.route}`)}
            >
              {hero.cta}
            </button>
            <Link to={`/p/${repo}/updates`} className="btn-ghost">All updates</Link>
          </div>
        </section>
      )}

      {/* No active update */}
      {!activeUpdate && (
        <section className="hero-card hero-card--empty">
          <p className="hero-empty-text">
            No updates in progress. Start one to begin making changes.
          </p>
          <Link to={`/p/${repo}/new-update`} className="btn-primary">Make an update</Link>
        </section>
      )}

      {/* Recent updates list */}
      {allUpdates.length > 0 && (
        <section className="project-updates-summary">
          <div className="section-header">
            <h2>Updates</h2>
            <Link to={`/p/${repo}/updates`} className="btn-ghost">See all</Link>
          </div>
          <ul className="updates-list">
            {allUpdates.slice(0, 4).map(u => (
              <li key={u.id} className="update-row">
                <Link to={`/p/${repo}/u/${u.id}`} className="update-row-link">
                  <span className="update-row-title">{u.title}</span>
                  <div className="update-row-meta">
                    <span className={`status-pill status-pill--${u.status}`}>
                      {STATUS_LABEL[u.status]}
                    </span>
                    <span className="update-row-time">{timeAgo(u.lastActivityAt)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
