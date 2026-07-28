/**
 * ReviewAIChanges.jsx — /p/:repo/u/:updateId/review
 *
 * Shows what changed in the project files since the update was sent to AI.
 * User reads through the changes and confirms — moves to 'ready_to_save'.
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getUpdateById, updateUpdate } from '../utils/updateMemory'
import { getFiles, getFileHistory } from '../api/github'
import { timeAgo } from '../utils/time'

export default function ReviewAIChanges({ auth }) {
  const { repo, updateId } = useParams()
  const navigate = useNavigate()
  const { token, user } = auth
  const owner = user?.login

  const update = owner ? getUpdateById(owner, repo, updateId) : null

  const [commits, setCommits]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    if (!token || !owner) return
    loadRecentCommits()
  }, [token, owner, repo])

  async function loadRecentCommits() {
    setLoading(true)
    setError(null)
    try {
      const files = await getFiles(token, owner, repo)
      const seen = new Set()
      const all = []
      await Promise.all(
        files.slice(0, 5).map(async f => {
          try {
            const history = await getFileHistory(token, owner, repo, f.path)
            for (const c of history.slice(0, 5)) {
              if (!seen.has(c.sha)) {
                seen.add(c.sha)
                all.push({ ...c, _fileName: f.name })
              }
            }
          } catch { /* skip */ }
        })
      )
      const sentSha = update?.handoff?.commitShaAtSend
      const relevant = sentSha
        ? all.filter(c => c.sha !== sentSha)
        : all
      relevant.sort((a, b) =>
        new Date(b.commit.author.date) - new Date(a.commit.author.date)
      )
      setCommits(relevant.slice(0, 20))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function handleAccept() {
    if (!owner) return
    setAccepting(true)
    updateUpdate(owner, repo, updateId, {
      status:     'ready_to_save',
      storyEntry: 'You reviewed and accepted the changes',
    })
    navigate(`/p/${repo}/save`)
  }

  function handleReject() {
    if (!owner) return
    updateUpdate(owner, repo, updateId, {
      status:     'needs_correction',
      storyEntry: 'You flagged the changes as needing correction',
    })
    navigate(`/p/${repo}/u/${updateId}/ai`)
  }

  if (!update) {
    return (
      <div className="screen-padded">
        <p className="error-box">Update not found.</p>
        <Link to={`/p/${repo}/updates`} className="btn-ghost" style={{ marginTop: 16, display: 'inline-flex' }}>
          Back to updates
        </Link>
      </div>
    )
  }

  return (
    <div className="screen-padded">
      <div className="screen-header">
        <h1>Review the changes</h1>
        <p className="screen-subtitle">
          These save points arrived since you sent this update to {update.ai || 'the AI'}.
          Read them before saving.
        </p>
      </div>

      {loading && <p className="state-loading">Loading changes…</p>}
      {error && <p className="error-box">{error}</p>}

      {!loading && !error && commits.length === 0 && (
        <div className="empty-state">
          <p>No save points found since you sent this update. Come back after the AI saves its work.</p>
        </div>
      )}

      {!loading && commits.length > 0 && (
        <section className="review-commits">
          <ul className="commit-list">
            {commits.map((c, i) => (
              <li key={c.sha} className="commit-item">
                <div className="commit-item-top">
                  <span className="commit-message">{c.commit.message || 'Save point'}</span>
                  <span className="commit-file">{c._fileName}</span>
                </div>
                <span className="commit-meta">
                  {timeAgo(c.commit.author.date)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!loading && (
        <section className="review-actions">
          <p className="review-question">Are these changes correct?</p>
          <div className="review-action-btns">
            <button
              className="btn-primary"
              onClick={handleAccept}
              disabled={accepting}
            >
              {accepting ? 'Accepting…' : 'Yes — review and save'}
            </button>
            <button className="btn-ghost" onClick={handleReject}>
              Something is wrong — ask AI to fix it
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
