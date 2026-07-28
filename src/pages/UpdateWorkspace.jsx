/**
 * UpdateWorkspace.jsx — /p/:repo/u/:updateId
 *
 * Main workspace for a single update.
 * Shows the four hero fields, lifecycle indicator, and action buttons
 * for the next step in the update's lifecycle.
 */

import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getUpdateById, updateUpdate, deleteUpdate, STATUS_LABEL } from '../utils/updateMemory'
import { heroFor } from '../utils/heroFor'
import { timeAgo } from '../utils/time'

export default function UpdateWorkspace({ auth }) {
  const { repo, updateId } = useParams()
  const navigate = useNavigate()
  const owner = auth?.user?.login

  const update = owner ? getUpdateById(owner, repo, updateId) : null

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting]           = useState(false)

  if (!update) {
    return (
      <div className="screen-padded">
        <p className="error-box">This update could not be found.</p>
        <Link to={`/p/${repo}/updates`} className="btn-ghost" style={{ marginTop: 16, display: 'inline-flex' }}>
          Back to updates
        </Link>
      </div>
    )
  }

  const hero = heroFor(update, { filesCount: (update.files || []).length })
  const activity = update.lastActivityAt ? timeAgo(update.lastActivityAt) : 'recently'

  function handleDelete() {
    if (!owner) return
    setDeleting(true)
    deleteUpdate(owner, repo, updateId)
    navigate(`/p/${repo}/updates`, { replace: true })
  }

  return (
    <div className="screen-padded">
      {/* Update identity */}
      <div className="update-workspace-header">
        <div className="update-workspace-title-row">
          <h1 className="update-workspace-title">{update.title}</h1>
          <span className={`status-pill status-pill--${update.status}`}>
            {STATUS_LABEL[update.status]}
          </span>
        </div>
        {update.goal && (
          <p className="update-workspace-goal">{update.goal}</p>
        )}
      </div>

      {/* Hero fields */}
      <section className="hero-card">
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
            onClick={() => navigate(`/p/${repo}/u/${updateId}/${hero.route}`)}
          >
            {hero.cta}
          </button>
        </div>
      </section>

      {/* Story / activity log */}
      {update.story && update.story.length > 0 && (
        <section className="update-story">
          <h2 className="update-story-heading">History</h2>
          <ul className="story-list">
            {[...update.story].reverse().map((entry, i) => (
              <li key={i} className="story-entry">
                <span className="story-what">{entry.what}</span>
                <span className="story-when">{timeAgo(entry.at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Danger zone */}
      <section className="update-danger">
        {!confirmDelete ? (
          <button
            className="btn-ghost btn-danger"
            onClick={() => setConfirmDelete(true)}
          >
            Delete this update
          </button>
        ) : (
          <div className="danger-confirm">
            <p>Delete <strong>{update.title}</strong>? This cannot be undone.</p>
            <div className="danger-confirm-actions">
              <button
                className="btn-primary btn-destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Yes, delete it'}
              </button>
              <button className="btn-ghost" onClick={() => setConfirmDelete(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
