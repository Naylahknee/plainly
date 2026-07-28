/**
 * Versions.jsx — /p/:repo/versions
 *
 * Lists branches of this repository ("separate versions" in plain language).
 * Requires GitHub API — branches endpoint.
 */

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

const API = 'https://api.github.com'

async function getBranches(token, owner, repo) {
  const r = await fetch(
    `${API}/repos/${owner}/${repo}/branches`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  )
  if (!r.ok) throw new Error('Could not load versions. Try refreshing.')
  return r.json()
}

export default function Versions({ auth }) {
  const { repo } = useParams()
  const { token, user } = auth
  const owner = user?.login

  const [branches, setBranches] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    if (!token || !owner) return
    getBranches(token, owner, repo)
      .then(b => setBranches(b || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [token, owner, repo])

  return (
    <div className="screen-padded">
      <div className="screen-header">
        <h1>Separate Versions</h1>
        <p className="screen-subtitle">
          Separate versions let you try things without affecting the main project.
        </p>
      </div>

      {loading && <p className="state-loading">Loading versions…</p>}
      {error && <p className="error-box">{error}</p>}

      {!loading && !error && branches.length === 0 && (
        <div className="empty-state">
          <p>No separate versions yet. This project only has its main version.</p>
        </div>
      )}

      {!loading && !error && branches.length > 0 && (
        <ul className="versions-list">
          {branches.map(b => (
            <li key={b.name} className="version-item">
              <span className="version-name">{b.name}</span>
              {b.name === 'main' || b.name === 'master' ? (
                <span className="version-badge">Main</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <div className="requires-impl">
        Creating and merging separate versions requires implementation.
      </div>
    </div>
  )
}
