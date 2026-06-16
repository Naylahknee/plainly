import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getFileHistory, getFileAtCommit, getFileContent, saveFile } from '../api/github'
import { timeAgo, formatCommitLabel, isUserLabel } from '../utils/time'

export default function History({ auth }) {
  const { repo, '*': encodedPath } = useParams()
  const navigate = useNavigate()
  const owner = auth.user?.login
  const filePath = decodeURIComponent(encodedPath)
  const fileName = filePath.split('/').pop()

  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [restoring, setRestoring] = useState(null)
  const [restoreError, setRestoreError] = useState(null)
  const [justRestored, setJustRestored] = useState(null)

  useEffect(() => {
    if (!owner) return
    loadHistory()
  }, [owner, repo, filePath])

  async function loadHistory() {
    setLoading(true)
    setError(null)
    try {
      const result = await getFileHistory(auth.token, owner, repo, filePath)
      setHistory(result)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleRestore(commit) {
    setRestoring(commit.sha)
    setRestoreError(null)
    try {
      const oldContent = await getFileAtCommit(auth.token, owner, repo, filePath, commit.sha)
      const { sha: currentSha } = await getFileContent(auth.token, owner, repo, filePath)
      const date = new Date(commit.commit.author.date).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric'
      })
      await saveFile(
        auth.token, owner, repo, filePath,
        oldContent, currentSha,
        `Restored version from ${date}`
      )
      setJustRestored(commit.sha)
      await loadHistory()
    } catch (e) {
      setRestoreError(e.message)
    } finally {
      setRestoring(null)
    }
  }

  const mostRecentDate = history.length > 0 ? history[0].commit.author.date : null

  return (
    <div className="page">
      <header className="topbar">
        <button className="back-btn" onClick={() => navigate(`/p/${repo}`)}>
          <span aria-hidden="true">←</span> {repo.replace(/-/g, ' ')}
        </button>
        <div className="topbar-title">History: {fileName}</div>
        <div className="topbar-actions">
          <Link to="/help" className="btn-ghost topbar-help-link">Help</Link>
        </div>
      </header>

      <main className="page-main">
        {loading && <p className="state-loading">Loading history…</p>}

        {!loading && error && <p className="error-box">{error}</p>}

        {restoreError && <p className="error-box">{restoreError}</p>}

        {!loading && !error && history.length === 0 && (
          <div className="empty-state">
            <p>
              No save points yet. Every time you make a save point, we'll keep a copy here
              so you can always go back.
            </p>
          </div>
        )}

        {!loading && !error && history.length > 0 && (
          <>
            <div className="history-banner">
              This file has {history.length} save {history.length === 1 ? 'point' : 'points'}.
              The most recent was {timeAgo(mostRecentDate)}.
            </div>

            <div className="timeline">
              {history.map((commit, i) => {
                const isRestored = justRestored === commit.sha
                const isRestoring = restoring === commit.sha
                const label = formatCommitLabel(commit.commit.message)
                const userTyped = isUserLabel(commit.commit.message)
                return (
                  <div
                    key={commit.sha}
                    className={`timeline-entry${isRestored ? ' is-restored' : ''}`}
                  >
                    <div className="timeline-rail">
                      <div className="timeline-dot" />
                      {i < history.length - 1 && <div className="timeline-line" />}
                    </div>
                    <div className="timeline-body">
                      <p className="timeline-message">
                        {userTyped
                          ? <span className="timeline-user-label">"{label}"</span>
                          : label}
                      </p>
                      <p className="timeline-meta">
                        {commit.commit.author.name} &middot; {timeAgo(commit.commit.author.date)}
                      </p>
                      {isRestored ? (
                        <span className="restored-badge">Restored ✓</span>
                      ) : (
                        <button
                          className="restore-btn"
                          onClick={() => handleRestore(commit)}
                          disabled={!!restoring}
                        >
                          {isRestoring ? 'Restoring…' : 'Go back to this version'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
