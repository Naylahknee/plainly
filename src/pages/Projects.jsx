import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { getRepos, createRepo } from '../api/github'
import { timeAgo, greeting } from '../utils/time'

export default function Projects({ auth }) {
  const navigate = useNavigate()
  const location = useLocation()
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
      navigate(`/p/${repo.name}`)
    } catch (e) {
      setCreateError(e.message)
      setCreating(false)
    }
  }

  const firstName = auth.user?.name?.split(' ')[0] || auth.user?.login || ''

  return (
    <div className="projects-page">
      <nav className="app-nav">
        <Link to="/" className="app-nav-logo">plainly</Link>
        <div className="app-nav-links">
          <Link
            to="/"
            className={`app-nav-link${location.pathname === '/' ? ' active' : ''}`}
          >
            Projects
          </Link>
          <Link
            to="/help"
            className={`app-nav-link${location.pathname === '/help' ? ' active' : ''}`}
          >
            Help
          </Link>
        </div>
        <div className="app-nav-footer">
          {auth.user?.avatar_url && (
            <img
              className="app-nav-avatar"
              src={auth.user.avatar_url}
              alt={auth.user.login}
            />
          )}
          <span className="app-nav-username">{auth.user?.login}</span>
          <button className="app-nav-signout" onClick={auth.signOut}>Sign out</button>
        </div>
      </nav>

      <div className="app-main">
        <div className="page-main">
          {!loading && !error && (
            <div className="dashboard-header">
              <div className="dashboard-greeting">
                {greeting()}{firstName ? `, ${firstName}` : ''}.
              </div>
              <button className="btn-primary" onClick={openModal}>New project</button>
            </div>
          )}

          {loading && <p className="state-loading">Loading your projects…</p>}

          {!loading && error && <p className="error-box">{error}</p>}

          {!loading && !error && repos.length === 0 && (
            <div className="empty-state empty-state-dashboard">
              <div className="empty-icon">📁</div>
              <h2 className="empty-heading">Start your first project</h2>
              <p className="empty-body">
                A project is a place to keep all your files for one thing —
                a book, a business, a class. Make your first one and we'll keep
                every version safe.
              </p>
              <button className="btn-primary" onClick={openModal}>Create a project</button>
            </div>
          )}

          {!loading && !error && repos.length > 0 && (
            <ul className="project-list">
              {repos.map(repo => (
                <li key={repo.id}>
                  <button
                    className="project-card"
                    onClick={() => navigate(`/p/${repo.name}`)}
                  >
                    <div className="project-card-main">
                      <span className="project-name">{repo.name.replace(/-/g, ' ')}</span>
                      {repo.description && (
                        <span className="project-card-desc">{repo.description}</span>
                      )}
                    </div>
                    <div className="project-card-meta">
                      <span className="project-time">Last touched {timeAgo(repo.updated_at)}</span>
                      <span className="project-card-arrow" aria-hidden="true">›</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

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
