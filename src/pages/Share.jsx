/**
 * Share.jsx — /p/:repo/share
 *
 * Who can see this project. Shows current visibility and collaborators.
 * Editing visibility requires the GitHub API — stubbed here.
 */

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getRepoInfo, updateRepoSettings } from '../api/github'

export default function Share({ auth }) {
  const { repo } = useParams()
  const { token, user } = auth
  const owner = user?.login

  const [repoData, setRepoData] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)

  useEffect(() => {
    if (!token || !owner) return
    getRepoInfo(token, owner, repo)
      .then(r => setRepoData(r))
      .catch(e => setError(e?.message || 'Could not load project settings.'))
      .finally(() => setLoading(false))
  }, [token, owner, repo])

  async function toggleVisibility() {
    if (!repoData) return
    setSaving(true)
    setError(null)
    try {
      const newPrivate = !repoData.private
      const updated = await updateRepoSettings(token, owner, repo, { private: newPrivate })
      setRepoData(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const isPrivate = repoData?.private

  return (
    <div className="screen-padded screen-narrow">
      <div className="screen-header">
        <h1>Who Can See It</h1>
      </div>

      {loading && <p className="state-loading">Loading…</p>}
      {error && <p className="error-box">{error}</p>}

      {!loading && repoData && (
        <>
          <div className="share-status">
            <p className="share-label">Current visibility</p>
            <p className="share-value">
              {isPrivate
                ? 'Private — only you can see this project.'
                : 'Public — anyone on the internet can see this project.'}
            </p>
          </div>

          <div className="share-actions">
            <button
              className="btn-ghost"
              onClick={toggleVisibility}
              disabled={saving}
            >
              {saving
                ? 'Changing…'
                : isPrivate
                  ? 'Make public'
                  : 'Make private'}
            </button>
            {saved && (
              <span className="save-confirm">Visibility updated.</span>
            )}
          </div>

          <div className="requires-impl">
            Managing collaborators requires implementation.
          </div>
        </>
      )}
    </div>
  )
}
