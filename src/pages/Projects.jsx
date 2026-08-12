import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRepos, createRepo } from '../api/github'
import { timeAgo } from '../utils/time'

export default function Projects({ auth }) {
  const navigate = useNavigate()
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [createError, setCreateError] = useState(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    getRepos(auth.token)
      .then(setRepos)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  function openModal() {
    setNewName('')
    setCreateError(null)
    setShowModal(true)
  }

  async function handleCreate(e) {
    e.preventDefault()
    const name = newName.trim().replace(/\s+/g, '-')
    if (!name) return
    setCreating(true)
    setCreateError(null)
    try {
      const repo = await createRepo(auth.token, name)
      setShowModal(false)
      navigate(`/p/${auth.user.login}/${repo.name}`)
    } catch (e) {
      setCreateError(e.message)
      setCreating(false)
    }
  }

  const userLogin = auth.user?.login

  // Group repos: mine, org (by org name), collab (other users' repos)
  const myRepos = repos.filter(r => r.owner.login === userLogin)
  const orgMap = {}
  const collabRepos = []
  repos.forEach(r => {
    if (r.owner.login === userLogin) return
    if (r.owner.type === 'Organization') {
      if (!orgMap[r.owner.login]) orgMap[r.owner.login] = []
      orgMap[r.owner.login].push(r)
    } else {
      collabRepos.push(r)
    }
  })
  const orgNames = Object.keys(orgMap).sort()

  return (
    <div className="page">
      <header className="topbar">
        <div className="wordmark">plainly</div>
        <button className="btn-ghost" onClick={auth.signOut}>Sign out</button>
      </header>

      <main className="page-main">
        {loading && <p className="state-loading">Loading your projects…</p>}
        {!loading && error && <p className="error-box">{error}</p>}

        {!loading && !error && (
          <>
            {/* Personal projects */}
            <div className="project-group">
              <div className="section-header">
                <h1>Your projects</h1>
                <button className="btn-primary" onClick={openModal}>New project</button>
              </div>

              {myRepos.length === 0 ? (
                <div className="empty-state">
                  <p>
                    No projects yet. A project is just a place to keep files that belong together.
                    Make your first one.
                  </p>
                </div>
              ) : (
                <ul className="project-list">
                  {myRepos.map(repo => (
                    <li key={repo.id}>
                      <button
                        className="project-row"
                        onClick={() => navigate(`/p/${repo.owner.login}/${repo.name}`)}
                      >
                        <span className="project-name">{repo.name.replace(/-/g, ' ')}</span>
                        <span className="project-time">Last touched {timeAgo(repo.updated_at)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Organization repos, one section per org */}
            {orgNames.map(orgName => (
              <div key={orgName} className="project-group">
                <div className="section-header project-group-header">
                  <h2 className="project-group-title">
                    <span className="project-group-badge">org</span>
                    {orgName}
                  </h2>
                </div>
                <ul className="project-list">
                  {orgMap[orgName].map(repo => (
                    <li key={repo.id}>
                      <button
                        className="project-row"
                        onClick={() => navigate(`/p/${repo.owner.login}/${repo.name}`)}
                      >
                        <span className="project-name">{repo.name.replace(/-/g, ' ')}</span>
                        <span className="project-time">Last touched {timeAgo(repo.updated_at)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Collaborator repos (another user's repo) */}
            {collabRepos.length > 0 && (
              <div className="project-group">
                <div className="section-header project-group-header">
                  <h2 className="project-group-title">
                    <span className="project-group-badge">shared</span>
                    Collaborations
                  </h2>
                </div>
                <ul className="project-list">
                  {collabRepos.map(repo => (
                    <li key={repo.id}>
                      <button
                        className="project-row"
                        onClick={() => navigate(`/p/${repo.owner.login}/${repo.name}`)}
                      >
                        <div className="project-row-main">
                          <span className="project-name">{repo.name.replace(/-/g, ' ')}</span>
                          <span className="project-owner">by {repo.owner.login}</span>
                        </div>
                        <span className="project-time">Last touched {timeAgo(repo.updated_at)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={() => !creating && setShowModal(false)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <h2>Name your project</h2>
            <p className="modal-hint">You can rename it later.</p>
            <form onSubmit={handleCreate}>
              <input
                autoFocus
                className="text-input"
                placeholder="e.g. My novel, Work notes"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                disabled={creating}
              />
              {createError && <p className="error-text">{createError}</p>}
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowModal(false)}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={creating || !newName.trim()}
                >
                  {creating ? 'Creating…' : 'Create project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
