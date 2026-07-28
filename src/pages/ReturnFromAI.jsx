/**
 * ReturnFromAI.jsx — /p/:repo/u/:updateId/return (max-width 860px)
 *
 * Screen shown when the user returns after sending work to an AI.
 * Compares the current GitHub HEAD against commitShaAtSend.
 * Five possible branches:
 *   1. Changes detected (files changed > 0)
 *   2. Nothing yet (no new commits)
 *   3. Already saved externally (external commits)
 *   4. GitHub is newer than local (not implemented here)
 *   5. Can't check (network error)
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getUpdateById, updateUpdate } from '../utils/updateMemory'
import { getCurrentHeadSha, compareCommits } from '../api/github'

export default function ReturnFromAI({ auth }) {
  const { repo, updateId } = useParams()
  const navigate = useNavigate()
  const { token, user } = auth
  const owner = user?.login

  const update = owner ? getUpdateById(owner, repo, updateId) : null

  const [checking, setChecking] = useState(false)
  const [checked, setChecked] = useState(false)
  const [branch, setBranch] = useState(null) // 'changes' | 'nothing' | 'external' | 'error'
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  async function checkForChanges() {
    if (!token || !owner) return
    setChecking(true)
    setError(null)
    try {
      const sentSha = update?.handoff?.commitShaAtSend
      if (!sentSha) {
        setBranch('unknown')
        setChecked(true)
        setChecking(false)
        return
      }

      // Get current HEAD
      const currentSha = await getCurrentHeadSha(token, owner, repo)

      if (currentSha === sentSha) {
        // Branch 2: Nothing yet
        setBranch('nothing')
        setData({ currentSha })
        setChecked(true)
        setChecking(false)
        return
      }

      // Compare commits
      const comparison = await compareCommits(token, owner, repo, sentSha, currentSha)

      if (comparison.filesChanged === 0) {
        // No files changed
        setBranch('nothing')
      } else if (comparison.filesChanged > 0) {
        // Branch 1: Changes detected
        setBranch('changes')
        setData({ filesChanged: comparison.filesChanged, commits: comparison.commits })

        // Auto-advance status
        if (update?.status !== 'changes_detected') {
          updateUpdate(owner, repo, updateId, {
            status: 'changes_detected',
            storyEntry: 'Changes detected in GitHub',
          })
        }
      }
    } catch (e) {
      // Branch 5: Can't check (network error)
      setBranch('error')
      setError('Could not check GitHub. Check your connection and try again.')
    } finally {
      setChecking(false)
      setChecked(true)
    }
  }

  useEffect(() => {
    // Auto-check on mount if update has a handoff
    if (update?.handoff?.commitShaAtSend && !checked && !checking) {
      checkForChanges()
    }
  }, [update?.handoff?.commitShaAtSend, checked, checking])

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
    <div className="page">
      <main className="page-main" style={{ maxWidth: '860px' }}>
        <h1 className="return-title">You continued this update with {ai}.</h1>
        <p className="return-subtitle">
          Plainly checked GitHub to see what happened while you were away.
        </p>

      {/* Auto-checking on load */}
      {checking && (
        <p className="state-loading">Checking GitHub for changes…</p>
      )}

      {/* Branch 1: Changes detected */}
      {checked && branch === 'changes' && (
        <section className="return-section return-section--found">
          <div className="return-result return-result--yes">
            <p className="return-result-title">
              {data?.filesChanged} {data?.filesChanged === 1 ? 'file' : 'files'} changed after your handoff
            </p>
            <p className="return-result-body">
              {ai} made changes to your project. Read through them before saving.
            </p>
          </div>
          <div className="return-actions">
            <button
              className="pl-btn-primary"
              onClick={() => navigate(`/p/${repo}/u/${updateId}/review`)}
            >
              Review changes
            </button>
            <Link to={`/p/${repo}/u/${updateId}`} className="pl-btn">
              Back to update
            </Link>
          </div>
        </section>
      )}

      {/* Branch 2: Nothing yet */}
      {checked && branch === 'nothing' && (
        <section className="return-section">
          <div className="return-result return-result--no">
            <p className="return-result-title">Nothing has changed yet</p>
            <p className="return-result-body">
              Your project in GitHub looks exactly as it did before the handoff. That usually means {ai} hasn't saved
              its work yet — or it made changes somewhere Plainly can't see, like on your own computer.
            </p>
          </div>
          <div className="return-actions">
            <button className="pl-btn" onClick={checkForChanges}>
              Check again
            </button>
            <Link to={`/p/${repo}/u/${updateId}/ai`} className="pl-btn">
              Send the handoff again
            </Link>
          </div>
        </section>
      )}

      {/* Branch 5: Can't check (error) */}
      {checked && branch === 'error' && (
        <section className="return-section">
          <div className="return-result">
            <p className="return-result-title">Plainly can't check GitHub right now</p>
            <p className="return-result-body">
              This is a connection problem, not a problem with your work. Nothing has been lost, and nothing will be
              saved until you say so.
            </p>
          </div>
          {error && <p className="error-box" style={{ marginBottom: 12 }}>{error}</p>}
          <div className="return-actions">
            <button className="pl-btn" onClick={checkForChanges}>
              Try again
            </button>
            <Link to={`/p/${repo}/u/${updateId}`} className="pl-btn">
              Back to update
            </Link>
          </div>
        </section>
      )}

      {/* Not checked yet (no handoff) */}
      {!checked && !checking && !update?.handoff?.commitShaAtSend && (
        <section className="return-section">
          <p className="return-result-body">
            No previous handoff found. Start a new handoff to send your work to {ai}.
          </p>
          <Link to={`/p/${repo}/u/${updateId}/ai`} className="pl-btn-primary">
            Continue with {ai}
          </Link>
        </section>
      )}
      </main>
    </div>
  )
}
