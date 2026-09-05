/**
 * NewProject.jsx — /new (max-width 680px)
 *
 * Yourkly's project-creation bridge. The user starts with the mental model they
 * already have — "where is my project?" — and only sees GitHub mechanics when
 * those mechanics are actually useful. New projects are still real GitHub
 * repositories owned by the signed-in user.
 */

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createRepo, updateRepoSettings } from '../api/github'
import { ownerOf } from '../utils/useProject'

const SOURCE_OPTIONS = [
  { id: 'lovable', label: 'Lovable' },
  { id: 'replit', label: 'Replit' },
  { id: 'bolt', label: 'Bolt' },
  { id: 'cursor', label: 'Cursor' },
  { id: 'computer', label: 'On my computer' },
  { id: 'other', label: 'Somewhere else' },
  { id: 'new', label: "I'm starting something new" },
  { id: 'github', label: 'Already on GitHub' },
]

const SOURCE_HELP = {
  lovable: 'Publish or connect the project to your GitHub account from Lovable first. Then come back to Yourkly and it will appear in My Projects.',
  replit: 'Connect or export the project to your GitHub account from Replit first. Then come back to Yourkly and it will appear in My Projects.',
  bolt: 'Connect or export the project to your GitHub account from Bolt first. Then come back to Yourkly and it will appear in My Projects.',
  cursor: 'Push the project to your GitHub account from Cursor first. Then come back to Yourkly and it will appear in My Projects.',
  computer: 'Yourkly does not upload a local folder directly yet. Put the project in your GitHub account first, then return here and open it from My Projects.',
  other: 'If the tool can publish or connect to GitHub, send the project to your GitHub account first. Then return to Yourkly and open it from My Projects.',
}

export default function NewProject({ auth }) {
  const { token, user } = auth
  const owner = user?.login
  const navigate = useNavigate()

  const [source, setSource]       = useState(null)
  const [name, setName]           = useState('')
  const [description, setDesc]    = useState('')
  const [isPrivate, setPrivate]   = useState(true)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState(null)
  const [created, setCreated]     = useState(null)

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
          setError('The project was created, but Yourkly could not make it public. You can change that later in Who Can See It.')
        })
      }
      setCreated(repo)
    } catch (err) {
      setError(err.message || 'Could not create the project. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (created) {
    const createdOwner = ownerOf(created, owner)
    return (
      <div className="screen-padded newproject-screen">
        <Link to="/projects" className="back-link">← My Projects</Link>
        <h1 className="newproject-title">Your project is ready.</h1>
        <p className="newproject-intro">
          Your project's files and history live in your GitHub account. Yourkly helps you understand what's happening with them.
        </p>

        <div className="newproject-created">
          <span className="newproject-tick" aria-hidden="true">✓</span>
          <span>{name.trim()} was created in your GitHub account.</span>
        </div>

        <div className="newproject-empty">
          <div className="newproject-empty-title">There's nothing in here yet</div>
          <p className="newproject-empty-body">
            That's normal for a new project. You can describe what you want to build or add files you already have.
          </p>
          <div className="newproject-empty-actions">
            <Link to={`/p/${createdOwner}/${created.name}/new-update`} className="pl-btn-primary">
              Describe what you want to build
            </Link>
            <Link to={`/p/${createdOwner}/${created.name}/files`} className="pl-btn">Add files</Link>
            {created.html_url && (
              <a href={created.html_url} className="pl-btn" target="_blank" rel="noopener noreferrer">View in GitHub</a>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!source) {
    return (
      <div className="screen-padded newproject-screen">
        <Link to="/projects" className="back-link">← My Projects</Link>
        <h1 className="newproject-title">Add a project</h1>
        <p className="newproject-intro">
          Where is your project right now? Choose the answer that sounds most like your situation.
        </p>

        <div className="newproject-card">
          <div>
            <div className="newproject-label">Where is your project right now?</div>
            <div className="newproject-hint">You do not need to know what a repository is.</div>
          </div>
          <div className="newproject-choices">
            {SOURCE_OPTIONS.map(option => (
              <button
                key={option.id}
                type="button"
                className="ai-tool"
                onClick={() => setSource(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (source === 'github') {
    return (
      <div className="screen-padded newproject-screen">
        <button type="button" className="back-link" onClick={() => setSource(null)}>← Back</button>
        <h1 className="newproject-title">Already on GitHub</h1>
        <p className="newproject-intro">
          Yourkly already checks the GitHub account you connected. If Yourkly can access the project, it will be available in My Projects.
        </p>
        <div className="newproject-card">
          <p className="newproject-empty-body">
            If you have many GitHub projects, you can choose which ones appear in Yourkly without moving or copying anything.
          </p>
          <div className="newproject-actions">
            <button type="button" className="pl-btn-primary" onClick={() => navigate('/projects')}>Go to My Projects</button>
            <button type="button" className="pl-btn" onClick={() => navigate('/projects/choose')}>Choose which appear</button>
          </div>
        </div>
      </div>
    )
  }

  if (source !== 'new') {
    const option = SOURCE_OPTIONS.find(item => item.id === source)
    return (
      <div className="screen-padded newproject-screen">
        <button type="button" className="back-link" onClick={() => setSource(null)}>← Back</button>
        <h1 className="newproject-title">Bring in your {option?.label || 'project'}</h1>
        <p className="newproject-intro">{SOURCE_HELP[source]}</p>
        <div className="newproject-card">
          <div>
            <div className="newproject-label">Why GitHub is part of this</div>
            <div className="newproject-hint">
              GitHub keeps the actual project files and version history. Yourkly reads that information and explains it in plain language. Your code stays in your GitHub account.
            </div>
          </div>
          <div className="newproject-actions">
            <button type="button" className="pl-btn-primary" onClick={() => navigate('/projects')}>I've connected it — check My Projects</button>
            <button type="button" className="pl-btn" onClick={() => setSource(null)}>Choose a different option</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="screen-padded newproject-screen">
      <button type="button" className="back-link" onClick={() => setSource(null)}>← Back</button>
      <h1 className="newproject-title">Create a new project</h1>
      <p className="newproject-intro">
        Yourkly will create the project in your GitHub account and keep GitHub's technical setup out of your way.
      </p>

      <form onSubmit={handleCreate} className="newproject-card">
        <div>
          <label className="newproject-label" htmlFor="np-name">What should it be called?</label>
          <div className="newproject-hint">Yourkly will create the matching project in your GitHub account.</div>
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
            This helps future-you and any AI understand what the project is for.
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
          <div className="newproject-label">Who should be able to see this project's files?</div>
          <div className="newproject-hint">You can change this later.</div>
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
              Anyone
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
