/**
 * WhatChanged.jsx — /p/:repo/changed (max-width 800px)
 *
 * Every Save Point, newest first, in the words it was written in
 * (HANDOFF §7.12). Never leads with a hash: GitHub's words live behind
 * "See details", or inline when the Account setting asks for them.
 */

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getCommits } from '../api/github'
import { timeAgo, formatCommitLabel } from '../utils/time'
import { projectName } from '../utils/projectName'
import { useShowGithubWords } from '../utils/settings'

export default function WhatChanged({ auth }) {
  const { repo } = useParams()
  const { token, user } = auth
  const owner = user?.login
  const [showWords] = useShowGithubWords()

  const [commits, setCommits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [open, setOpen]       = useState(null)

  useEffect(() => {
    if (!token || !owner) return
    getCommits(token, owner, repo, 30)
      .then(setCommits)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [token, owner, repo])

  return (
    <div className="screen-padded changed-screen">
      <Link to={`/p/${repo}`} className="back-link">← {projectName(repo)}</Link>
      <h1 className="changed-title">What changed</h1>
      <p className="changed-intro">
        Every Save Point in this project, newest first — written the way you wrote it, not in
        GitHub's words.
      </p>

      {loading && <p className="state-loading">Getting your Save Points from GitHub…</p>}
      {error && <p className="error-box">{error}</p>}
      {!loading && !error && commits.length === 0 && (
        <p className="changed-empty">
          No Save Points yet. The first time you save, it shows up here.
        </p>
      )}

      <div className="changed-list">
        {commits.map(c => {
          const message = c.commit?.message || ''
          const [firstLine, ...rest] = message.split('\n')
          const who = c.author?.login || c.commit?.author?.name || 'Someone'
          const when = c.commit?.author?.date
          const isOpen = open === c.sha
          return (
            <div key={c.sha} className="changed-entry">
              <div className="changed-entry-main">
                <div>
                  <div className="changed-entry-title">{formatCommitLabel(firstLine)}</div>
                  {rest.join(' ').trim() && (
                    <div className="changed-entry-summary">{rest.join(' ').trim()}</div>
                  )}
                  <div className="changed-entry-meta">
                    {who} · {when ? timeAgo(when) : 'date unknown'}
                    {showWords && <span className="changed-github"> · commit {c.sha.slice(0, 7)}</span>}
                  </div>
                </div>
                <button className="pl-btn changed-toggle" onClick={() => setOpen(isOpen ? null : c.sha)}>
                  {isOpen ? 'Hide details' : 'See details'}
                </button>
              </div>
              {isOpen && (
                <div className="changed-details">
                  <div>In GitHub words: commit {c.sha} on the main version</div>
                  {c.html_url && (
                    <div>
                      <a href={c.html_url} target="_blank" rel="noreferrer">
                        Open this Save Point on GitHub
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
