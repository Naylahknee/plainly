/**
 * NewProject.jsx — /new (max-width 680px)
 *
 * Name it, say what it's for, choose who can see it (HANDOFF §7.18).
 *
 * "What it's for" is not decoration — it shows on the dashboard and goes into
 * every AI handoff, which is why it gets equal billing with the name.
 *
 * After creating, the empty-project state explains that empty is normal and
 * offers two real first moves.
 */

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createRepo, updateRepoSettings } from '../api/github'

export default function NewProject({ auth }) {
  const { token, user } = auth
  const owner = user?.login
  const navigate = useNavigate()

  const [name, setName]         = useState('')
  const [description, setDesc]  = useState('')
  const [isPrivate, setPrivate] = useState(true)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState(null)
  const [created, setCreated]   = useState(null)

  const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  async function handleCreate(e) {
    e.preventDefault()
    if (!slug) return
    setSaving(true)
    setError(null)
    try {
      const repo = await createRepo(token, slug, description.trim())
      // createRepo makes a private repository; only open it up if asked.
      if (!isPrivate && owner) {
        await updateRepoSettings(token, owner, repo.name, { private: false }).catch(() => {
          setError('The project was created, but Plainly could not make it public. You can change that in Who Can See It.')
        })
      }
      setCreated(repo)
    } catch (err) {
      setError(err.message || 'Could not create the project. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  /* ── Created, and empty — which is normal (§7.18) ─────────────────────── */
  if (created) {
    return (
      <div className="screen-padded newproject-screen">
        <Link to="/projects" className="back-link">← My Projects</Link>
        <h1 className="newproject-title">{name.trim()}</h1>
        <p className="newproject-intro">
          {description.trim() || 'No description yet — you can add one in project settings.'}
        </p>

        <div className="newproject-created">
          <span className="newproject-tick" aria-hidden="true">✓</span>
          <span>Created in GitHub. It's empty right now — that's normal.</span>
        </div>

        <div className="newproject-empty">
          <div className="newproject-empty-title">There's nothing in here yet</div>
          <p className="newproject-empty-body">
            Two good first moves: write down what you want to build, or add the files you already
            have. Either way Plainly keeps every version from here on.
          </p>
          <div className="newproject-empty-actions">
            <Link to={`/p/${ownerOf(created, owner)}/${created.name}/new-update`} className="pl-btn-primary">
              Describe what you want to build
            </Link>
            <Link to={`/p/${ownerOf(created, owner)}/${created.name}/files`} className="pl-btn">Add files</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="screen-padded newproject-screen">
      <Link to="/projects" className="back-link">← My Projects</Link>
      <h1 className="newproject-title">Start a new project</h1>
      <p className="newproject-intro">
        A project is one place for everything that belongs together — an app, a book, a class.
        Plainly creates it as a real GitHub repository on your account.
      </p>

      <form onSubmit={handleCreate} className="newproject-card">
        <div>
          <label className="newproject-label" htmlFor="np-name">What should it be called?</label>
          <div className="newproject-hint">You can rename it later.</div>
          <input
            id="np-name"
            className="newproject-input"
            placeholder="e.g. Kolmari, My novel, Client work"
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={saving}
            autoFocus
          />
        </div>

        <div>
          <label className="newproject-label" htmlFor="np-desc">In one sentence, what is it for?</label>
          <div className="newproject-hint">
            This shows on your dashboard and goes into every AI handoff, so future-you and any AI
            know what this is.
          </div>
          <input
            id="np-desc"
            className="newproject-input"
            placeholder="e.g. The plain-English front door to my GitHub projects"
            value={description}
            onChange={e => setDesc(e.target.value)}
            disabled={saving}
          />
        </div>

        <div>
          <div className="newproject-label">Who can see it?</div>
          <div className="newproject-hint">
            Private means only you. You can change this in project settings later.
          </div>
          <div className="newproject-choices">
            <button
              type="button"
              className={`ai-tool${isPrivate ? ' ai-tool--on' : ''}`}
              onClick={() => setPrivate(true)}
            >
              Only me
            </button>
            <button
              type="button"
              className={`ai-tool${!isPrivate ? ' ai-tool--on' : ''}`}
              onClick={() => setPrivate(false)}
            >
              Anyone with the link
            </button>
          </div>
        </div>

        {error && <p className="error-box">{error}</p>}

        <div className="newproject-actions">
          <button type="submit" className="pl-btn-primary" disabled={saving || !slug}>
            {saving ? 'Creating…' : 'Create project'}
          </button>
          <button type="button" className="pl-btn" onClick={() => navigate('/projects')} disabled={saving}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
