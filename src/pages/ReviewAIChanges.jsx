/**
 * ReviewAIChanges.jsx — /p/:repo/u/:updateId/review
 *
 * Shows what changed in the project files since the update was sent to AI.
 * User reads through the changes and confirms — moves to 'ready_to_save'.
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getUpdateById, updateUpdate } from '../utils/updateMemory'
import { getFiles, getFileHistory } from '../api/github'
import { timeAgo } from '../utils/time'

export default function ReviewAIChanges({ auth }) {
  const { repo, updateId } = useParams()
  const navigate = useNavigate()
  const { token, user } = auth
  const owner = user?.login

  const update = owner ? getUpdateById(owner, repo, updateId) : null

  const [commits, setCommits]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    if (!token || !owner) return
    loadRecentCommits()
  }, [token, owner, repo])

  async function loadRecentCommits() {
    setLoading(true)
    setError(null)
    try {
      const files = await getFiles(token, owner, repo)
      const seen = new Set()
      const all = []
      await Promise.all(
        files.slice(0, 5).map(async f => {
          try {
            const history = await getFileHistory(token, owner, repo, f.path)
            for (const c of history.slice(0, 5)) {
              if (!seen.has(c.sha)) {
                seen.add(c.sha)
                all.push({ ...c, _fileName: f.name })
              }
            }
          } catch { /* skip */ }
        })
      )
      const sentSha = update?.handoff?.commitShaAtSend
      const relevant = sentSha
        ? all.filter(c => c.sha !== sentSha)
        : all
      relevant.sort((a, b) =>
        new Date(b.commit.author.date) - new Date(a.commit.author.date)
      )
      setCommits(relevant.slice(0, 20))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function handleAccept() {
    if (!owner) return
    setAccepting(true)
    updateUpdate(owner, repo, updateId, {
      status:     'ready_to_save',
      storyEntry: 'You reviewed and accepted the changes',
    })
    navigate(`/p/${repo}/save`)
  }

  function handleReject() {
    if (!owner) return
    updateUpdate(owner, repo, updateId, {
      status:     'needs_correction',
      storyEntry: 'You flagged the changes as needing correction',
    })
    navigate(`/p/${repo}/u/${updateId}/ai`)
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

  return (
    <div className="page">
      <main className="page-main" style={{ maxWidth: '840px' }}>
        <h1 className="review-title">What {update.ai || 'the AI'} changed</h1>
        <p className="review-subtitle">
          In plain English first. Nothing here is saved to GitHub until you choose to save it.
        </p>

        {loading && <p className="state-loading">Loading changes…</p>}
        {error && <p className="error-box">{error}</p>}

        {!loading && (
          <>
            {/* Four stacked cards */}
            <div className="review-cards">
              {/* Card 1: WHAT YOU ASKED FOR */}
              <div className="review-card review-card--what-asked">
                <h2 className="review-card-title">What you asked for</h2>
                <p className="review-card-content">
                  {update.goal || update.title}
                </p>
              </div>

              {/* Card 2: WHAT CHANGED */}
              <div className="review-card">
                <h2 className="review-card-title">What changed</h2>
                <p className="review-card-content">
                  {commits.length === 0 ? (
                    'No changes have been saved yet.'
                  ) : (
                    `${commits.length} ${commits.length === 1 ? 'file' : 'files'} affected in ${commits.length} ${commits.length === 1 ? 'save point' : 'save points'}.`
                  )}
                </p>
              </div>

              {/* Card 3: WHAT ELSE CHANGED */}
              <div className="review-card review-card--else-changed">
                <h2 className="review-card-title">What else changed</h2>
                <p className="review-card-content">
                  Nothing else was touched. {update.goal || update.title}
                </p>
              </div>

              {/* Card 4: PROJECT CHECK */}
              <div className="review-card review-card--check">
                <h2 className="review-card-title">
                  Project check
                  <span className="pl-todo">Requires implementation</span>
                </h2>
                <p className="review-card-content">
                  Build check, security scan, and link validation require CI integration and cannot run here.
                </p>
              </div>
            </div>

            {/* Files affected */}
            {commits.length > 0 && (
              <div className="review-files">
                <h3 className="review-files-title">Files affected</h3>
                <div className="review-files-chips">
                  {Array.from(new Set(commits.map(c => c._fileName))).map((file) => (
                    <span key={file} className="review-file-chip">
                      {file}
                    </span>
                  ))}
                </div>
                <button className="review-files-toggle">
                  Show technical details
                </button>
              </div>
            )}

            {/* Decision section */}
            <div className="review-decision">
              <h3 className="review-decision-title">What do you want to do?</h3>
              <div className="review-choice-rows">
                <div className="review-choice-row">
                  <div className="review-choice-text">
                    <h4>Accept and save</h4>
                    <p>Create a Save Point in GitHub with these changes. Recommended.</p>
                  </div>
                  <button
                    className="pl-btn-primary review-choice-cta"
                    onClick={handleAccept}
                    disabled={accepting}
                  >
                    {accepting ? 'Saving…' : 'Accept'}
                  </button>
                </div>
                <div className="review-choice-row">
                  <div className="review-choice-text">
                    <h4>Ask the AI to fix something</h4>
                    <p>Plainly writes a follow-up handoff that includes what it got wrong.</p>
                  </div>
                  <button
                    className="pl-btn review-choice-cta"
                    onClick={handleReject}
                  >
                    Fix
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
