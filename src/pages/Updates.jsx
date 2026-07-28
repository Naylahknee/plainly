/**
 * Updates.jsx — /p/:repo/updates (max-width 860px)
 *
 * List of all updates for a project.
 * Shows: title + status pill / goal / metadata (AI, files, time) / next step
 */

import { useParams, Link } from 'react-router-dom'
import { getUpdates, STATUS_LABEL } from '../utils/updateMemory'
import { heroFor } from '../utils/heroFor'
import { timeAgo } from '../utils/time'

export default function Updates({ auth }) {
  const { repo } = useParams()
  const owner = auth?.user?.login
  const updates = owner ? getUpdates(owner, repo) : []
  const inProgressCount = updates.filter(u => u.status !== 'saved' && u.status !== 'paused').length

  return (
    <div className="page">
      <main className="page-main" style={{ maxWidth: '860px' }}>
        {/* Intro section */}
        <div className="updates-intro">
          <p className="updates-intro-text">
            An update is one thing you want to change, described in your words. Plainly keeps track
            of what it touched, which AI worked on it, and whether it's saved.{' '}
            <strong>{inProgressCount} updates in progress.</strong>
          </p>
        </div>

        {/* Header */}
        <div className="updates-header">
          <h1>Updates</h1>
          <Link to={`/p/${repo}/new-update`} className="pl-btn-primary">
            Make an update
          </Link>
        </div>

        {/* Empty state */}
        {updates.length === 0 && (
          <div className="updates-empty">
            <p>No updates yet. Describe what you want to change to get started.</p>
            <Link to={`/p/${repo}/new-update`} className="pl-btn-primary">
              Make an update
            </Link>
          </div>
        )}

        {/* Updates list */}
        {updates.length > 0 && (
          <div className="updates-list">
            {updates.map(u => {
              const hero = heroFor(u, { filesCount: (u.files || []).length })
              return (
                <Link key={u.id} to={`/p/${repo}/u/${u.id}`} className="updates-row">
                  <div className="updates-row-main">
                    <div className="updates-row-header">
                      <h2 className="updates-row-title">{u.title}</h2>
                      <span className={`pl-pill pl-pill--${u.status}`}>
                        {STATUS_LABEL[u.status]}
                      </span>
                    </div>
                    {u.goal && <p className="updates-row-goal">{u.goal}</p>}
                    <p className="updates-row-meta">
                      {u.ai && <>Worked on with <strong>{u.ai}</strong> · </>}
                      {(u.files || []).length === 1 ? '1 file' : `${(u.files || []).length} files`}
                      {' '}· Last activity {timeAgo(u.lastActivityAt)}
                    </p>
                  </div>
                  <div className="updates-row-next">
                    <p className="updates-row-next-label">Next step</p>
                    <p className="updates-row-next-text">{hero.next}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
