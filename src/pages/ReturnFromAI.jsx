/**
 * ReturnFromAI.jsx — /p/:repo/u/:updateId/return
 *
 * Screen shown when the user returns after sending work to an AI.
 * Compares the current GitHub HEAD against commitShaAtSend.
 * Branches into "changes detected" or "nothing yet" state.
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getUpdateById, updateUpdate, STATUS_LABEL } from '../utils/updateMemory'
import { getFileHistory } from '../api/github'

export default function ReturnFromAI({ auth }) {
  const { repo, updateId } = useParams()
  const navigate = useNavigate()
  const { token, user } = auth
  const owner = user?.login

  const update = owner ? getUpdateById(owner, repo, updateId) : null

  const [checking, setChecking]       = useState(false)
  const [checked, setChecked]         = useState(false)
  const [changesFound, setChanges]    = useState(null) // null | true | false
  const [error, setError]             = useState(null)

  async function checkForChanges() {
    if (!token || !owner) return
    setChecking(true)
    setError(null)
    try {
      // Fetch recent commits across the root of the repo
      const commits = await getFileHistory(token, owner, repo, '').catch(() => null)
      const latestSha = commits?.[0]?.sha || null
      const sentSha   = update?.handoff?.commitShaAtSend || null

      let changed = false
      if (latestSha && sentSha && latestSha !== sentSha) {
        changed = true
      } else if (latestSha && !sentSha) {
        // We didn't record a sha at send — can't prove change, show manual path
        changed = null
      } else if (latestSha && sentSha && latestSha === sentSha) {
        changed = false
      }

      setChanges(changed)

      if (changed === true) {
        // Advance status
        updateUpdate(owner, repo, updateId, {
          status:     'changes_detected',
          storyEntry: 'Changes detected in GitHub',
        })
      }
    } catch (e) {
      setError('Could not check for changes. Check your connection and try again.')
    } finally {
      setChecking(false)
      setChecked(true)
    }
  }

  if (!update) {
    return (
      <div className="screen-padded">
        <p className="error-box">Update not found.</p>
        <Link to={`/p/${repo}/updates`} className="btn-ghost" style={{ marginTop: 16, display: 'inline-flex' }}>
          Back to updates
        </Link>
      </div>
    )
  }

  const ai = update.ai || 'the AI'

  return (
    <div className="screen-padded screen-narrow">
      <div className="screen-header">
        <h1>Back from {ai}?</h1>
        <p className="screen-subtitle">
          Check whether {ai} saved any changes to your project in GitHub.
        </p>
      </div>

      {/* Not checked yet */}
      {!checked && !checking && (
        <section className="return-section">
          <p className="return-body">
            If {ai} made changes to your project files, they'll show up in GitHub.
            Click below to check whether anything new arrived.
          </p>
          <button className="btn-primary" onClick={checkForChanges}>
            Check for changes
          </button>
        </section>
      )}

      {checking && <p className="state-loading">Checking GitHub for changes…</p>}

      {error && (
        <div className="return-section">
          <p className="error-box">{error}</p>
          <button className="btn-ghost" onClick={checkForChanges} style={{ marginTop: 12 }}>
            Try again
          </button>
        </div>
      )}

      {/* Changes detected */}
      {checked && changesFound === true && (
        <section className="return-section return-section--found">
          <div className="return-result return-result--yes">
            <p className="return-result-title">Changes found!</p>
            <p className="return-result-body">
              {ai} made changes to your project. Read through them before saving.
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={() => navigate(`/p/${repo}/u/${updateId}/review`)}
          >
            Review the changes
          </button>
        </section>
      )}

      {/* Nothing changed */}
      {checked && changesFound === false && (
        <section className="return-section return-section--none">
          <div className="return-result return-result--no">
            <p className="return-result-title">Nothing changed yet.</p>
            <p className="return-result-body">
              GitHub looks the same as when you sent it. {ai} may not have finished — come back after it's done.
            </p>
          </div>
          <div className="return-actions">
            <button className="btn-ghost" onClick={checkForChanges}>
              Check again
            </button>
            <Link to={`/p/${repo}/u/${updateId}/ai`} className="btn-ghost">
              Resend to AI
            </Link>
            <Link to={`/p/${repo}`} className="btn-ghost">
              Back to project
            </Link>
          </div>
        </section>
      )}

      {/* Unknown — couldn't compare (no sha at send) */}
      {checked && changesFound === null && (
        <section className="return-section">
          <div className="return-result return-result--unknown">
            <p className="return-result-title">Can't tell automatically.</p>
            <p className="return-result-body">
              Plainly didn't record the state before it was sent, so it can't compare.
              Look at your project files and decide whether anything changed.
            </p>
          </div>
          <div className="return-actions">
            <button
              className="btn-primary"
              onClick={() => {
                updateUpdate(owner, repo, updateId, {
                  status:     'changes_detected',
                  storyEntry: 'User confirmed changes were made',
                })
                navigate(`/p/${repo}/u/${updateId}/review`)
              }}
            >
              Yes, there are changes — review them
            </button>
            <Link to={`/p/${repo}/u/${updateId}`} className="btn-ghost">
              No changes yet
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
