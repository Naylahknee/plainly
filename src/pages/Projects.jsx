/**
 * Projects.jsx — /projects (max-width 900px)
 *
 * My Projects. Every project is a real GitHub repository on the account.
 *
 * The nav lives in AppShell — this page must never render one of its own.
 *
 * Nothing here is invented: the status pill (see utils/projectStatus) only
 * appears when stored updates say something true about the project, and the
 * meta line only prints the parts that exist (HANDOFF §0).
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getRepos } from '../api/github'
import { timeAgo } from '../utils/time'
import { getMemory, setMemory } from '../utils/projectMemory'
import { getUpdates } from '../utils/updateMemory'
import { projectName } from '../utils/projectName'
import { projectStatus } from '../utils/projectStatus'
import { ownerOf } from '../utils/useProject'

export default function Projects({ auth }) {
  const owner = auth.user?.login
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getRepos(auth.token)
      .then(r => setRepos(r || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [auth.token])

  // Remember which project was opened last — this is what feeds "where you left off".
  function rememberOpen(repoName) {
    if (owner) setMemory(owner, repoName, { lastOpenedAt: new Date().toISOString() })
  }

  return (
    <div className="screen-padded projects-screen">
      <div className="projects-header">
        <h1 className="projects-title">My Projects</h1>
        <Link to="/new" className="pl-btn-primary projects-new">Start a new project</Link>
      </div>
      <p className="projects-subtitle">
        Every project here is a real GitHub repository on your account.
      </p>

      {loading && <p className="state-loading">Getting your projects from GitHub…</p>}

      {!loading && error && <p className="error-box">{error}</p>}

      {!loading && !error && repos.length === 0 && (
        <div className="projects-empty">
          <p className="projects-empty-title">There are no projects in your GitHub account yet.</p>
          <p className="projects-empty-body">
            A project is one place for everything that belongs together — an app, a book,
            a client job.
          </p>
          <Link to="/new" className="pl-btn-primary">Start a new project</Link>
        </div>
      )}

      {!loading && !error && repos.length > 0 && (
        <div className="projects-list">
          {repos.map(repo => {
            const mem = owner ? getMemory(owner, repo.name) : {}
            const status = projectStatus(owner ? getUpdates(owner, repo.name) : [])

            const meta = []
            if (mem.lastSaveLabel) meta.push(`Last Save Point: ${mem.lastSaveLabel}`)
            meta.push(mem.lastOpenedAt
              ? `Opened ${timeAgo(mem.lastOpenedAt)}`
              : `Last touched ${timeAgo(repo.updated_at)}`)

            return (
              <Link
                key={repo.id || repo.name}
                to={`/p/${ownerOf(repo, owner)}/${repo.name}`}
                className="projects-card"
                onClick={() => rememberOpen(repo.name)}
              >
                <span className="projects-card-body">
                  <span className="projects-card-top">
                    <span className="projects-card-name">{projectName(repo.name)}</span>
                    {status && (
                      <span className={`pl-pill pl-pill--${status.tone}`}>{status.label}</span>
                    )}
                  </span>
                  {repo.description && (
                    <span className="projects-card-desc">{repo.description}</span>
                  )}
                  <span className="projects-card-meta">{meta.join(' · ')}</span>
                  <span className="projects-card-url">github.com/{owner}/{repo.name}</span>
                </span>
                <span className="projects-card-open">Open project</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
