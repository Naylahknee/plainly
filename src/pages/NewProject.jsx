/**
 * NewProject.jsx — /new
 *
 * Create a new GitHub repository (shown to the user as "New Project").
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createRepo } from '../api/github'

export default function NewProject({ auth }) {
  const { token, user } = auth
  const navigate = useNavigate()

  const [name, setName]           = useState('')
  const [description, setDesc]    = useState('')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState(null)

  const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  async function handleCreate(e) {
    e.preventDefault()
    if (!slug) return
    setSaving(true)
    setError(null)
    try {
      const repo = await createRepo(token, slug, description.trim())
      navigate(`/p/${repo.name}`, { replace: true })
    } catch (err) {
      setError(err.message || 'Could not create the project. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="screen-padded screen-narrow">
      <div className="screen-header">
        <h1>New Project</h1>
        <p className="screen-subtitle">
          This creates a new private repository in your GitHub account.
        </p>
      </div>

      <form onSubmit={handleCreate} className="form-stack">
        <div className="form-field">
          <label className="form-label" htmlFor="proj-name">Project name</label>
          <input
            id="proj-name"
            type="text"
            className="text-input"
            placeholder="e.g. My Blog"
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={saving}
            autoFocus
            required
          />
          {slug && (
            <p className="form-hint">Saved in GitHub as: <code>{slug}</code></p>
          )}
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="proj-desc">Description <span className="form-optional">(optional)</span></label>
          <input
            id="proj-desc"
            type="text"
            className="text-input"
            placeholder="What is this project about?"
            value={description}
            onChange={e => setDesc(e.target.value)}
            disabled={saving}
          />
        </div>

        {error && <p className="error-box">{error}</p>}

        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={saving || !slug}
          >
            {saving ? 'Creating…' : 'Create project'}
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => navigate(-1)}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
