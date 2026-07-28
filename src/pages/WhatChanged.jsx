/**
 * WhatChanged.jsx — /p/:repo/changed
 *
 * Project-level history: shows recent save points (commits) across all files.
 * Translates GitHub commit list into plain-language "what changed" entries.
 */

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getFiles, getFileHistory } from '../api/github'
import { timeAgo, formatCommitLabel } from '../utils/time'

export default function WhatChanged({ auth }) {
  const { repo } = useParams()
  const { token, user } = auth
  const owner = user?.login

  const [commits, setCommits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

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
              if (!seen.has(c.sha)) {
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
      setCommits(all.slice(0, 30))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen-padded">
      <div className="screen-header">
        <h1>What Changed</h1>
      </div>

      {loading && <p className="state-loading">Loading save points…</p>}
      {error && <p className="error-box">{error}</p>}

      {!loading && !error && commits.length === 0 && (
        <div className="empty-state">
          <p>No save points yet. Make a save in the file editor to see history here.</p>
        </div>
      )}

      {!loading && !error && commits.length > 0 && (
        <ul className="commit-list">
          {commits.map((c, i) => (
            <li key={c.sha} className="commit-item">
              <div className="commit-item-top">
                <span className="commit-message">
                  {formatCommitLabel(c.commit.message)}
                </span>
                <span className="commit-file">{c._fileName}</span>
              </div>
              <span className="commit-meta">{timeAgo(c.commit.author.date)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
