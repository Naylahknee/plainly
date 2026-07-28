/**
 * Settings.jsx — /p/:repo/settings
 *
 * Project settings: name, description, danger zone (delete).
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getRepoInfo, updateRepoSettings, deleteRepo } from '../api/github'

export default function Settings({ auth }) {
  const { repo } = useParams()
  const navigate = useNavigate()
  const { token, user } = auth
  const owner = user?.login

  const [repoData, setRepoData]       = useState(null)
  const [name, setName]               = useState('')
  const [description, setDesc]        = useState('')
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)
  const [error, setError]             = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting]       = useState(false)

  useEffect(() => {
    if (!token || !owner) return
    getRepoInfo(token, owner, repo)
      .then(r => {
        setRepoData(r)
        setName(r?.name?.replace(/-/g, ' ') || '')
        setDesc(r?.description || '')
      })
      .catch(e => setError(e?.message || 'Could not load project settings.'))
      .finally(() => setLoading(false))
  }, [token, owner, repo])

  async function handleSave(e) {
    e.preventDefault()
    if (!owner) return
    setSaving(true)
    setError(null)
    try {
      const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      await updateRepoSettings(token, owner, repo, {
        name: slug || repo,
        description: description.trim(),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!owner) return
    setDeleting(true)
    try {
      await deleteRepo(token, owner, repo)
      navigate('/projects', { replace: true })
    } catch (e) {
      setError(e.message)
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  if (loading) {
    return (
      <div className="screen-padded">
        <p className="state-loading">Loading settings…</p>
      </div>
    )
  }

  return (
    <div className="screen-padded screen-narrow">
      <div className="screen-header">
        <h1>Settings</h1>
      </div>

      {error && <p className="error-box">{error}</p>}

      <form onSubmit={handleSave} className="form-stack">
        <div className="form-field">
          <label className="form-label" htmlFor="settings-name">Project name</label>
          <input
            id="settings-name"
            type="text"
            className="text-input"
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={saving}
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="settings-desc">Description</label>
          <input
            id="settings-desc"
            type="text"
            className="text-input"
            value={description}
            onChange={e => setDesc(e.target.value)}
            disabled={saving}
            placeholder="What is this project about?"
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save changes'}
          </button>
        </div>
      </form>

      {/* Danger zone */}
      <section className="settings-danger">
        <h2 className="settings-danger-heading">Danger zone</h2>
        {!confirmDelete ? (
          <button className="btn-ghost btn-danger" onClick={() => setConfirmDelete(true)}>
            Delete this project
          </button>
        ) : (
          <div className="danger-confirm">
            <p>
              Delete <strong>{repo.replace(/-/g, ' ')}</strong> permanently from GitHub?
              This cannot be undone.
            </p>
            <div className="danger-confirm-actions">
              <button
                className="btn-primary btn-destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Yes, delete it'}
              </button>
              <button className="btn-ghost" onClick={() => setConfirmDelete(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
