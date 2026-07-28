/**
 * NewUpdate.jsx — /p/:repo/new-update
 *
 * Form to describe a new update. Creates an update record in 'planned' state,
 * then navigates to the update workspace.
 */

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { createUpdate } from '../utils/updateMemory'

export default function NewUpdate({ auth }) {
  const { repo } = useParams()
  const navigate = useNavigate()
  const owner = auth?.user?.login

  const [title, setTitle]   = useState('')
  const [goal, setGoal]     = useState('')
  const [saving, setSaving] = useState(false)

  function handleCreate(e) {
    e.preventDefault()
    if (!title.trim() || !owner) return
    setSaving(true)
    const update = createUpdate(owner, repo, title.trim(), goal.trim() || null)
    navigate(`/p/${repo}/u/${update.id}`, { replace: true })
  }

  return (
    <div className="screen-padded screen-narrow">
      <div className="screen-header">
        <h1>Make an update</h1>
        <p className="screen-subtitle">
          Describe what you want to change. You'll choose how to do it next.
        </p>
      </div>

      <form onSubmit={handleCreate} className="form-stack">
        <div className="form-field">
          <label className="form-label" htmlFor="update-title">
            What do you want to change?
          </label>
          <input
            id="update-title"
            type="text"
            className="text-input"
            placeholder="e.g. Add a contact page"
            value={title}
            onChange={e => setTitle(e.target.value)}
            disabled={saving}
            autoFocus
            required
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="update-goal">
            Why? <span className="form-optional">(optional)</span>
          </label>
          <textarea
            id="update-goal"
            className="text-input"
            placeholder="e.g. So visitors can reach me directly"
            value={goal}
            onChange={e => setGoal(e.target.value)}
            disabled={saving}
            rows={3}
          />
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={saving || !title.trim()}
          >
            {saving ? 'Starting…' : 'Start this update'}
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => navigate(`/p/${repo}`)}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
