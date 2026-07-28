/**
 * Activity.jsx — /activity
 *
 * Cross-project activity feed: recent updates and save points across all projects.
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getRepos } from '../api/github'
import { getUpdates, STATUS_LABEL } from '../utils/updateMemory'
import { timeAgo } from '../utils/time'
import { projectName } from '../utils/projectName'

export default function Activity({ auth }) {
  const { user, token } = auth
  const owner = user?.login
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    getRepos(token)
      .then(r => setRepos(r || []))
      .catch(() => setRepos([]))
      .finally(() => setLoading(false))
  }, [token])

  // Gather all updates across all repos, sorted newest first
  const allUpdates = []
  if (owner) {
    for (const r of repos) {
      const updates = getUpdates(owner, r.name)
      for (const u of updates) {
        allUpdates.push({ ...u, repoName: r.name })
      }
    }
  }
  allUpdates.sort((a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt))

  return (
    <div className="screen-padded">
      <div className="screen-header">
        <h1>Recent Activity</h1>
      </div>

      {loading && <p className="state-loading">Loading activity…</p>}

      {!loading && allUpdates.length === 0 && (
        <div className="empty-state">
          <p>No activity yet. Start an update on one of your projects.</p>
          <Link to="/projects" className="btn-primary" style={{ marginTop: 20, display: 'inline-flex' }}>
            My Projects
          </Link>
        </div>
      )}

      {!loading && allUpdates.length > 0 && (
        <ul className="activity-list">
          {allUpdates.map(u => (
            <li key={u.id} className="activity-item">
              <Link to={`/p/${u.repoName}/u/${u.id}`} className="activity-item-link">
                <div className="activity-item-top">
                  <span className="activity-item-title">{u.title}</span>
                  <span className={`status-pill status-pill--${u.status}`}>
                    {STATUS_LABEL[u.status] || u.status}
                  </span>
                </div>
                <div className="activity-item-meta">
                  {projectName(u.repoName)} &middot; {timeAgo(u.lastActivityAt)}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
