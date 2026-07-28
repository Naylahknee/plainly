/**
 * SavePoints.jsx — /p/:repo/points
 *
 * Lists all named save points for this project (i.e., commits with user-authored
 * messages). Links through to History for per-file history and restore.
 */

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getFiles, getFileHistory } from '../api/github'
import { timeAgo, isUserLabel } from '../utils/time'

export default function SavePoints({ auth }) {
  const { repo } = useParams()
  const { token, user } = auth
  const owner = user?.login

  const [savePoints, setSavePoints] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  useEffect(() => {
    if (!token || !owner) return
    load()
  }, [token, owner, repo])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const files = await getFiles(token, owner, repo)
      const seen = new Set()
      const all = []
      await Promise.all(
        files.map(async f => {
          try {
            const history = await getFileHistory(token, owner, repo, f.path)
            for (const c of history) {
              if (!seen.has(c.sha) && isUserLabel(c.commit.message)) {
                seen.add(c.sha)
                all.push({ ...c, _fileName: f.name })
              }
            }
          } catch { /* skip */ }
        })
      )
      all.sort((a, b) =>
        new Date(b.commit.author.date) - new Date(a.commit.author.date)
      )
      setSavePoints(all)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen-padded">
      <div className="screen-header">
        <h1>Save Points</h1>
        <p className="screen-subtitle">
          These are the moments you saved with a custom note. You can go back to any of them.
        </p>
      </div>

      {loading && <p className="state-loading">Loading save points…</p>}
      {error && <p className="error-box">{error}</p>}

      {!loading && !error && savePoints.length === 0 && (
        <div className="empty-state">
          <p>No named save points yet. Next time you save, add a note to describe what changed.</p>
          <Link to={`/p/${repo}/files`} className="btn-primary" style={{ marginTop: 20, display: 'inline-flex' }}>
            Open project files
          </Link>
        </div>
      )}

      {!loading && !error && savePoints.length > 0 && (
        <ul className="commit-list">
          {savePoints.map(sp => (
            <li key={sp.sha} className="commit-item commit-item--savepoint">
              <div className="commit-item-top">
                <span className="commit-message">{sp.commit.message}</span>
                <span className="commit-file">{sp._fileName}</span>
              </div>
              <div className="commit-item-bottom">
                <span className="commit-meta">{timeAgo(sp.commit.author.date)}</span>
                <Link
                  to={`/p/${repo}/h/${sp._fileName}`}
                  className="commit-link"
                >
                  See history for this file
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
