/**
 * ProjectHome.jsx — /p/:repo (max-width 880px)
 *
 * Project-level dashboard. Shows project info, active update hero, and recommended action.
 * Same layout as Home but scoped to one project.
 */

import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getRepoInfo } from '../api/github'
import { getActiveUpdate, getUpdates, STATUS_LABEL } from '../utils/updateMemory'
import { heroFor, projectNextAction } from '../utils/heroFor'
import { timeAgo } from '../utils/time'
import { projectName } from '../utils/projectName'

export default function ProjectHome({ auth }) {
  const { repo } = useParams()
  const navigate = useNavigate()
  const { token, user } = auth
  const owner = user?.login

  const [repoData, setRepoData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!token || !owner) return
    setLoading(true)
    getRepoInfo(token, owner, repo)
      .then(r => setRepoData(r))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [token, owner, repo])

  const projectTitle = projectName(repo)
  const activeUpdate = owner ? getActiveUpdate(owner, repo) : null
  const allUpdates = owner ? getUpdates(owner, repo) : []
  const inProgressCount = allUpdates.filter(u => u.status !== 'saved' && u.status !== 'paused').length

  const hero = activeUpdate
    ? heroFor(activeUpdate, { filesCount: (activeUpdate.files || []).length })
    : null

  const recommendation = projectNextAction({ activeUpdate })

  if (loading) {
    return (
      <div className="page">
        <main className="page-main" style={{ maxWidth: '880px' }}>
          <p className="state-loading">Loading project…</p>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page">
        <main className="page-main" style={{ maxWidth: '880px' }}>
          <p className="error-box">{error}</p>
        </main>
      </div>
    )
  }

  return (
    <div className="page">
      <main className="page-main" style={{ maxWidth: '880px' }}>
        {/* Project header */}
        <div className="project-home-header">
          <h1 className="project-home-title">{projectTitle}</h1>
          {repoData?.description && (
            <p className="project-home-desc">{repoData.description}</p>
          )}
        </div>

        {/* Recommended next action */}
        <section className="project-recommendation">
          <p className="project-recommendation-text">{recommendation.text}</p>
          {activeUpdate ? (
            <button
              className="pl-btn-primary"
              onClick={() => navigate(`/p/${repo}/u/${activeUpdate.id}/${recommendation.route}`)}
            >
              {recommendation.cta}
            </button>
          ) : (
            <Link
              to={`/p/${repo}/${recommendation.route}`}
              className="pl-btn-primary"
            >
              {recommendation.cta}
            </Link>
          )}
        </section>

        {/* Active update hero */}
        {activeUpdate && hero && (
          <section className="project-hero-card">
            <div className="project-hero-context">
              <span className="project-hero-project">{projectTitle}</span>
              <span className="project-hero-separator">·</span>
              <span className="project-hero-label">Update</span>
              <span className={`pl-pill pl-pill--${activeUpdate.status}`}>
                {STATUS_LABEL[activeUpdate.status]}
              </span>
            </div>
            <h2 className="project-hero-title">{activeUpdate.title}</h2>
            {activeUpdate.goal && (
              <p className="project-hero-goal">{activeUpdate.goal}</p>
            )}
            <div className="project-hero-panel">
              <div className="project-hero-row">
                <span className="project-hero-row-label">Where you left off</span>
                <span className="project-hero-row-value">{hero.left}</span>
              </div>
              <div className="project-hero-row">
                <span className="project-hero-row-label">What's happened since</span>
                <span className="project-hero-row-value">{hero.since}</span>
              </div>
              <div className="project-hero-row">
                <span className="project-hero-row-label" style={{ color: 'var(--purple)', fontWeight: '600' }}>
                  What to do next
                </span>
                <span className="project-hero-row-value" style={{ fontWeight: '600' }}>
                  {hero.next}
                </span>
              </div>
            </div>
            <div className="project-hero-actions">
              <button
                className="pl-btn-primary"
                onClick={() => navigate(`/p/${repo}/u/${activeUpdate.id}/${hero.route}`)}
              >
                {hero.cta}
              </button>
              <Link to={`/p/${repo}/updates`} className="pl-btn">
                Open the update
              </Link>
              {inProgressCount > 1 && (
                <button
                  className="project-hero-updates-link"
                  onClick={() => navigate(`/p/${repo}/updates`)}
                >
                  {inProgressCount} updates in progress →
                </button>
              )}
            </div>
          </section>
        )}

        {/* Empty state */}
        {!activeUpdate && (
          <section className="project-hero-card project-hero-empty">
            <p className="project-hero-empty-title">You haven't started an update yet.</p>
            <p className="project-hero-empty-next">Describe what you want to change.</p>
            <Link to={`/p/${repo}/new-update`} className="pl-btn-primary">
              Make an update
            </Link>
          </section>
        )}

        {/* Recent updates list */}
        {allUpdates.length > 0 && (
          <section className="project-updates-section">
            <div className="project-updates-header">
              <h2>Updates</h2>
              <Link to={`/p/${repo}/updates`} className="pl-btn">See all</Link>
            </div>
            <div className="project-updates-list">
              {allUpdates.slice(0, 4).map(u => (
                <Link
                  key={u.id}
                  to={`/p/${repo}/u/${u.id}`}
                  className="project-update-row"
                >
                  <div className="project-update-info">
                    <p className="project-update-title">{u.title}</p>
                    {u.goal && <p className="project-update-goal">{u.goal}</p>}
                  </div>
                  <div className="project-update-meta">
                    <span className={`pl-pill pl-pill--${u.status}`}>
                      {STATUS_LABEL[u.status]}
                    </span>
                    <span className="project-update-time">{timeAgo(u.lastActivityAt)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
