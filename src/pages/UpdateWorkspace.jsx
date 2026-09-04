/**
 * UpdateWorkspace.jsx — /p/:repo/u/:updateId (max-width 880px)
 *
 * Main workspace for a single update.
 * Shows: back link, context, title/goal, lifecycle indicator, hero fields,
 * details cards, story, and footer actions.
 */

import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getUpdateById, updateUpdate, deleteUpdate, STATUS_LABEL, STATUSES } from '../utils/updateMemory'
import { heroFor } from '../utils/heroFor'
import { timeAgo } from '../utils/time'
import { projectName } from '../utils/projectName'

const LIFECYCLE = ['planned', 'ready_for_ai', 'sent_to_ai', 'changes_detected', 'waiting_for_review', 'ready_to_save', 'saved']

export default function UpdateWorkspace({ auth }) {
  const { owner, repo, updateId } = useParams()
  const navigate = useNavigate()

  const update = owner ? getUpdateById(owner, repo, updateId) : null
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (!update) {
    return (
      <div className="screen-padded workspace-screen">
        <p className="error-box">This update could not be found.</p>
        <Link to={`/p/${owner}/${repo}/updates`} className="pl-btn">Back to updates</Link>
      </div>
    )
  }

  const hero = heroFor(update, { filesCount: (update.files || []).length })
  const currentStatusIndex = LIFECYCLE.indexOf(update.status)

  function handleDelete() {
    if (!owner) return
    setDeleting(true)
    deleteUpdate(owner, repo, updateId)
    navigate(`/p/${owner}/${repo}/updates`, { replace: true })
  }

  function handlePause() {
    if (owner) {
      updateUpdate(owner, repo, updateId, {
        status: 'paused',
        storyEntry: 'You paused this update',
      })
    }
  }

  return (
    <div className="screen-padded workspace-screen">
      <div>
        {/* Back link */}
        <Link to={`/p/${owner}/${repo}/updates`} className="update-workspace-back">
          ← All updates
        </Link>

        {/* Context line */}
        <div className="update-workspace-context">
          <span>{projectName(repo)}</span>
          <span>·</span>
          <span>Update</span>
          <span className={`pl-pill pl-pill--${update.status}`}>
            {STATUS_LABEL[update.status]}
          </span>
        </div>

        {/* Title and goal */}
        <h1 className="update-workspace-title">{update.title}</h1>
        {update.goal && (
          <p className="update-workspace-goal">{update.goal}</p>
        )}

        {/* Lifecycle indicator */}
        <div className="update-lifecycle">
          <p className="update-lifecycle-label">Where this update is up to</p>
          <div className="update-lifecycle-steps">
            {LIFECYCLE.map((status, i) => {
              const isDone = i < currentStatusIndex
              const isCurrent = i === currentStatusIndex
              const isFuture = i > currentStatusIndex
              return (
                <div key={status} className="update-lifecycle-step">
                  <div className={`update-lifecycle-dot ${isDone ? 'done' : isCurrent ? 'current' : 'future'}`} />
                  <p className={`update-lifecycle-step-label ${isCurrent ? 'current' : ''}`}>
                    {STATUS_LABEL[status]}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recommended next step */}
        <section className="update-recommendation">
          <div>
            <p className="update-recommendation-label">Recommended next step</p>
            <p className="update-recommendation-text">{hero.next}</p>
          </div>
          <button
            className="pl-btn-primary"
            onClick={() => navigate(`/p/${owner}/${repo}/u/${updateId}/${hero.route}`)}
          >
            {hero.cta}
          </button>
        </section>

        {/* Two cards: Details + Files */}
        <div className="update-cards">
          <section className="update-card">
            <h2 className="update-card-title">Details</h2>
            <div className="update-card-content">
              <div className="update-card-row">
                <span className="update-card-label">AI used</span>
                <span className="update-card-value">{update.ai || '—'}</span>
              </div>
              <div className="update-card-row">
                <span className="update-card-label">Files affected</span>
                <span className="update-card-value">
                  {(update.files || []).length === 1 ? '1 file' : `${(update.files || []).length} files`}
                </span>
              </div>
              <div className="update-card-row">
                <span className="update-card-label">Last activity</span>
                <span className="update-card-value">{timeAgo(update.lastActivityAt)}</span>
              </div>
            </div>
          </section>

          <section className="update-card">
            <h2 className="update-card-title">Files in this update</h2>
            <div className="update-card-content">
              {(update.files || []).length === 0 ? (
                <p className="update-card-empty">No files yet</p>
              ) : (
                <ul className="update-files-list">
                  {(update.files || []).map((file, i) => (
                    <li key={i}>
                      <Link to={`/p/${owner}/${repo}/f/${file}`} className="update-file-item">
                        <code>{file}</code>
                        <span className="update-file-open">Open</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        {/* Story / History */}
        <section className="update-story">
          <h2 className="update-story-title">
            The story of this update
            {(!update.story || update.story.length === 0) && (
              <span className="pl-todo">Requires implementation</span>
            )}
          </h2>
          {update.story && update.story.length > 0 ? (
            <div className="update-story-list">
              {[...update.story].reverse().map((entry, i) => (
                <div key={i} className="update-story-entry">
                  <span className="update-story-dot">·</span>
                  <span className="update-story-text">{entry.what}</span>
                  <span className="update-story-time">{timeAgo(entry.at)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="update-story-empty">No activity recorded yet.</p>
          )}
        </section>

        {/* Footer actions */}
        <div className="update-workspace-footer">
          <Link to={`/p/${owner}/${repo}/u/${updateId}/ai`} className="pl-btn-primary">
            Continue in…
          </Link>
          <Link to={`/p/${owner}/${repo}/u/${updateId}/review`} className="pl-btn">
            Review the changes
          </Link>
          {update.status !== 'saved' && update.status !== 'paused' && (
            <button
              className="pl-btn"
              onClick={handlePause}
            >
              Pause this update
            </button>
          )}
          <button
            className="pl-btn"
            onClick={() => setConfirmDelete(true)}
          >
            Delete
          </button>
        </div>

        {/* Delete confirmation */}
        {confirmDelete && (
          <div className="update-delete-confirm">
            <p>Delete <strong>{update.title}</strong>? This cannot be undone.</p>
            <div className="update-delete-actions">
              <button
                className="pl-btn-primary"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Yes, delete it'}
              </button>
              <button
                className="pl-btn"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
