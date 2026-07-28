/**
 * Updates.jsx — /p/:repo/updates
 *
 * All updates for a project, grouped by status.
 * Repurposed from ProjectTimeline.jsx.
 */

import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getUpdates, STATUS_LABEL, STATUSES } from '../utils/updateMemory'
import { timeAgo } from '../utils/time'

function statusGroup(updates, status) {
  return updates.filter(u => u.status === status)
}

export default function Updates({ auth }) {
  const { repo } = useParams()
  const navigate = useNavigate()
  const owner = auth?.user?.login
  const projectTitle = repo.replace(/-/g, ' ')
  const updates = owner ? getUpdates(owner, repo) : []

  // Group into in-progress (not planned, not saved) vs planned vs saved
  const active   = updates.filter(u => !['planned','saved','paused'].includes(u.status))
  const planned  = updates.filter(u => u.status === 'planned')
  const done     = updates.filter(u => u.status === 'saved')
  const paused   = updates.filter(u => u.status === 'paused')

  function renderGroup(label, items) {
    if (items.length === 0) return null
    return (
      <section className="updates-group" key={label}>
        <h2 className="updates-group-heading">{label}</h2>
        <ul className="updates-list">
          {items.map(u => (
            <li key={u.id} className="update-row">
              <Link to={`/p/${repo}/u/${u.id}`} className="update-row-link">
                <span className="update-row-title">{u.title}</span>
                <div className="update-row-meta">
                  <span className={`status-pill status-pill--${u.status}`}>
                    {STATUS_LABEL[u.status]}
                  </span>
                  {u.ai && <span className="update-row-ai">{u.ai}</span>}
                  <span className="update-row-time">{timeAgo(u.lastActivityAt)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    )
  }

  return (
    <div className="screen-padded">
      <div className="screen-header">
        <h1>Updates</h1>
        <Link to={`/p/${repo}/new-update`} className="btn-primary">Make an update</Link>
      </div>

      {updates.length === 0 && (
        <div className="empty-state">
          <p>No updates yet. Describe what you want to change to get started.</p>
          <Link
            to={`/p/${repo}/new-update`}
            className="btn-primary"
            style={{ marginTop: 20, display: 'inline-flex' }}
          >
            Make an update
          </Link>
        </div>
      )}

      {renderGroup('In progress', active)}
      {renderGroup('Planned', planned)}
      {renderGroup('Paused', paused)}
      {renderGroup('Saved', done)}
    </div>
  )
}
