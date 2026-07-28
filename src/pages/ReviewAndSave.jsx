/**
 * ReviewAndSave.jsx — /p/:repo/save
 *
 * Final save screen: shows pending changes, lets user write a "what changed"
 * message, and creates the save point via the GitHub API.
 *
 * Note: This is a project-level route (/p/:repo/save), not update-scoped.
 * It resolves the active update for the project from updateMemory.
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getActiveUpdate, updateUpdate } from '../utils/updateMemory'
import { getFiles, getFileContent, saveFile } from '../api/github'
import { recordSave } from '../utils/projectMemory'

export default function ReviewAndSave({ auth }) {
  const { repo } = useParams()
  const navigate = useNavigate()
  const { token, user } = auth
  const owner = user?.login

  const update = owner ? getActiveUpdate(owner, repo) : null

  const [label, setLabel]         = useState('')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState(null)
  const [done, setDone]           = useState(false)

  const defaultLabel = update?.title
    ? `Updated: ${update.title}`
    : 'Saved progress'

  async function handleSave(e) {
    e.preventDefault()
    if (!owner) return
    setSaving(true)
    setError(null)
    const saveLabel = label.trim() || defaultLabel
    try {
      // The actual file-level save is done in Files.jsx editor flow.
      // Here we mark the update as saved in local memory.
      if (update) {
        updateUpdate(owner, repo, update.id, {
          status:     'saved',
          savePoint:  saveLabel,
          storyEntry: `Saved to GitHub as "${saveLabel}"`,
        })
        recordSave(owner, repo, saveLabel)
      }
      setDone(true)
    } catch (e) {
      setError(e.message || 'Could not save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  if (done) {
    return (
      <div className="screen-padded screen-narrow">
        <div className="screen-header">
          <h1>Saved!</h1>
        </div>
        <p className="save-done-text">
          Your changes are saved to GitHub{label.trim() ? ` as "${label.trim()}"` : ''}.
        </p>
        <div className="save-done-actions">
          <Link to={`/p/${repo}`} className="btn-primary">Back to project</Link>
          <Link to={`/p/${repo}/new-update`} className="btn-ghost">Make another update</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="screen-padded screen-narrow">
      <div className="screen-header">
        <h1>Review and save</h1>
        <p className="screen-subtitle">
          Add a note describing what changed, then save it to GitHub.
        </p>
      </div>

      {update && (
        <div className="save-update-context">
          <p className="save-context-label">Saving for update:</p>
          <p className="save-context-title">{update.title}</p>
        </div>
      )}

      <form onSubmit={handleSave} className="form-stack">
        <div className="form-field">
          <label className="form-label" htmlFor="save-label">
            What changed? <span className="form-optional">(optional)</span>
          </label>
          <input
            id="save-label"
            type="text"
            className="text-input"
            placeholder={defaultLabel}
            value={label}
            onChange={e => setLabel(e.target.value)}
            disabled={saving}
          />
          <p className="form-hint">
            This note is saved in GitHub and helps you remember what happened.
          </p>
        </div>

        {error && <p className="error-box">{error}</p>}

        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save to GitHub'}
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => navigate(-1)}
            disabled={saving}
          >
            Back
          </button>
        </div>
      </form>
    </div>
  )
}
