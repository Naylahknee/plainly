import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { diffLines } from 'diff'
import { getFileHistory, getFileAtCommit, getFileContent, saveFile } from '../api/github'
import { timeAgo, formatCommitLabel, isUserLabel } from '../utils/time'
import { projectName } from '../utils/projectName'

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

  const [comparingCommit, setComparingCommit] = useState(null)
  const [diffParts, setDiffParts] = useState(null)
  const [diffStats, setDiffStats] = useState(null)
  const [diffLoading, setDiffLoading] = useState(false)

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
      setComparingCommit(null)
      setDiffParts(null)
      await loadHistory()
    } catch (e) {
      setRestoreError(e.message)
    } finally {
      setRestoring(null)
    }
  }

  async function handleCompare(commit) {
    if (comparingCommit === commit.sha) {
      setComparingCommit(null)
      setDiffParts(null)
      setDiffStats(null)
      return
    }
    setComparingCommit(commit.sha)
    setDiffLoading(true)
    setDiffParts(null)
    setDiffStats(null)
    try {
      const [oldContent, { content: currentContent }] = await Promise.all([
        getFileAtCommit(auth.token, owner, repo, filePath, commit.sha),
        getFileContent(auth.token, owner, repo, filePath)
      ])
      const parts = diffLines(oldContent, currentContent)
      const added = parts.filter(p => p.added).reduce((n, p) => n + (p.count || 0), 0)
      const removed = parts.filter(p => p.removed).reduce((n, p) => n + (p.count || 0), 0)
      setDiffParts(parts)
      setDiffStats({ added, removed })
    } catch {
      setComparingCommit(null)
    } finally {
      setDiffLoading(false)
    }
  }

  const mostRecentDate = history.length > 0 ? history[0].commit.author.date : null

  return (
    <div className="page">
      <header className="topbar">
        <button className="back-btn" onClick={() => navigate(`/p/${repo}`)}>
          <span aria-hidden="true">←</span> {projectName(repo)}
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
                const isComparing = comparingCommit === commit.sha
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
                        <div className="timeline-actions">
                          <button
                            className="restore-btn"
                            onClick={() => handleRestore(commit)}
                            disabled={!!restoring}
                          >
                            {isRestoring ? 'Restoring…' : 'Go back to this version'}
                          </button>
                          <button
                            className={`compare-btn${isComparing ? ' active' : ''}`}
                            onClick={() => handleCompare(commit)}
                            disabled={!!restoring}
                          >
                            {isComparing && diffLoading
                              ? 'Loading…'
                              : isComparing
                              ? 'Hide diff'
                              : 'Compare with now'}
                          </button>
                        </div>
                      )}

                      {isComparing && diffParts && (
                        <div className="diff-panel">
                          <div className="diff-stats">
                            {diffStats.added === 0 && diffStats.removed === 0
                              ? 'No changes since this version.'
                              : <>
                                  {diffStats.added > 0 && (
                                    <span className="diff-stat-added">
                                      +{diffStats.added} {diffStats.added === 1 ? 'line' : 'lines'} added
                                    </span>
                                  )}
                                  {diffStats.added > 0 && diffStats.removed > 0 && (
                                    <span className="diff-stat-sep"> · </span>
                                  )}
                                  {diffStats.removed > 0 && (
                                    <span className="diff-stat-removed">
                                      −{diffStats.removed} {diffStats.removed === 1 ? 'line' : 'lines'} removed
                                    </span>
                                  )}
                                </>
                            }
                          </div>
                          <div className="diff-lines">
                            {diffParts.map((part, idx) => {
                              const lines = part.value.split('\n')
                              const trimmed = lines[lines.length - 1] === ''
                                ? lines.slice(0, -1)
                                : lines
                              return trimmed.map((line, j) => (
                                <div
                                  key={`${idx}-${j}`}
                                  className={`diff-line ${
                                    part.added
                                      ? 'diff-line-added'
                                      : part.removed
                                      ? 'diff-line-removed'
                                      : 'diff-line-unchanged'
                                  }`}
                                >
                                  {line || ' '}
                                </div>
                              ))
                            })}
                          </div>
                        </div>
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
