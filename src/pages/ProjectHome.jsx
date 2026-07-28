/**
 * ProjectHome.jsx — /p/:repo (max-width 880px)
 *
 * Where a project opens. Status row, the update you're in the middle of, then
 * everything else you might want to do (HANDOFF §7.3, screen "Project Home").
 *
 * The four sentences about the current update come from heroFor() — the same
 * function Home and the update workspace call, so the three screens can never
 * contradict each other (§6).
 */

import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getRepoInfo } from '../api/github'
import { getActiveUpdate, getUpdates, STATUS_LABEL } from '../utils/updateMemory'
import { heroFor } from '../utils/heroFor'
import { timeAgo } from '../utils/time'
import { projectName } from '../utils/projectName'
import { useShowGithubWords } from '../utils/settings'
import { aiRouteFor } from '../utils/aiRoute'

export default function ProjectHome({ auth }) {
  const { repo } = useParams()
  const navigate = useNavigate()
  const { token, user } = auth
  const owner = user?.login
  const [showWords] = useShowGithubWords()

  const [repoData, setRepoData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!token || !owner) return
    setLoading(true)
    getRepoInfo(token, owner, repo)
      .then(r => setRepoData(r))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [token, owner, repo])

  const projectTitle = projectName(repo)
  const activeUpdate = owner ? getActiveUpdate(owner, repo) : null
  const allUpdates = owner ? getUpdates(owner, repo) : []
  const inProgressCount = allUpdates.filter(u => u.status !== 'saved' && u.status !== 'paused').length

  const hero = activeUpdate
    ? heroFor(activeUpdate, { filesCount: (activeUpdate.files || []).length })
    : null

  // "Changes not saved yet" is only true when an update has been reviewed and
  // is waiting to be saved. Anything else and Plainly says nothing.
  const unsaved = allUpdates.some(u => u.status === 'ready_to_save')

  // Continue with AI opens for the update in progress, or for the project
  // itself when there isn't one. Shared with the sidebar so the two can't
  // disagree about where the same words lead.
  const aiRoute = aiRouteFor(repo, activeUpdate)

  const ACTIONS = [
    { title: 'Make an update',            body: "Describe what you want to change. You don't need to know which file controls it.", cta: 'Describe an update', to: `/p/${repo}/new-update` },
    { title: 'Continue with AI',          body: 'Hand this project to Claude, ChatGPT, Bob, Codex or another AI — with all the context it needs.', cta: 'Continue with AI', to: aiRoute },
    { title: 'Review what changed',       body: 'See recent Save Points and understand what each one changed.', cta: 'View changes', to: `/p/${repo}/changed` },
    { title: 'Browse project files',      body: 'Open and edit the files stored in this GitHub project.', cta: 'Browse files', to: `/p/${repo}/files` },
    { title: 'Restore an earlier version', body: 'Go back to a previous Save Point. Nothing newer is deleted.', cta: 'View Save Points', to: `/p/${repo}/points` },
  ]

  if (loading) {
    return (
      <div className="screen-padded project-screen">
        <p className="state-loading">Getting this project from GitHub…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="screen-padded project-screen">
        <p className="error-box">{error}</p>
      </div>
    )
  }

  return (
    <div className="screen-padded project-screen">
      <Link to="/" className="back-link">← Home</Link>

      <h1 className="project-title">{projectTitle}</h1>
      {repoData?.description && <p className="project-desc">{repoData.description}</p>}

      {/* Status row — every value here comes from GitHub or stored memory. */}
      <div className="project-status">
        <a
          className="project-status-url"
          href={repoData?.html_url || `https://github.com/${owner}/${repo}`}
          target="_blank"
          rel="noreferrer"
        >
          github.com/{owner}/{repo}
        </a>
        <span className="project-status-sep" aria-hidden="true">|</span>
        <span className="project-status-ok">GitHub connected</span>
        <span className="project-status-sep" aria-hidden="true">|</span>
        <span>
          Main version
          {showWords && repoData?.default_branch && (
            <span className="project-status-github"> ({repoData.default_branch})</span>
          )}
        </span>
        {repoData?.pushed_at && (
          <>
            <span className="project-status-sep" aria-hidden="true">|</span>
            <span>Last Save Point {timeAgo(repoData.pushed_at)}</span>
          </>
        )}
        <span className="project-status-sep" aria-hidden="true">|</span>
        {unsaved
          ? <span className="project-status-unsaved">Changes not saved yet</span>
          : <span className="project-status-ok">Everything saved</span>}
      </div>

      {/* Current update */}
      {activeUpdate && hero ? (
        <>
          <div className="section-label">Current update</div>
          <section className="project-update-card">
            <div className="project-update-head">
              <h2 className="project-update-name">{activeUpdate.title}</h2>
              <span className={`pl-pill pl-pill--${activeUpdate.status}`}>
                {STATUS_LABEL[activeUpdate.status]}
              </span>
            </div>
            {activeUpdate.goal && <p className="project-update-goal">{activeUpdate.goal}</p>}

            <div className="project-update-facts">
              {activeUpdate.ai && (
                <span>Worked on with <strong>{activeUpdate.ai}</strong></span>
              )}
              <span>
                {(activeUpdate.files || []).length === 1
                  ? '1 file affected'
                  : `${(activeUpdate.files || []).length} files affected`}
              </span>
              {activeUpdate.lastActivityAt && (
                <span>Last activity {timeAgo(activeUpdate.lastActivityAt)}</span>
              )}
            </div>

            <div className="project-update-actions">
              <button
                className="pl-btn-primary"
                onClick={() => navigate(`/p/${repo}/u/${activeUpdate.id}/${hero.route}`)}
              >
                {hero.cta}
              </button>
              <Link to={`/p/${repo}/u/${activeUpdate.id}`} className="pl-btn">
                Open the update
              </Link>
              {inProgressCount > 1 && (
                <Link to={`/p/${repo}/updates`} className="text-link">
                  {inProgressCount} updates in progress →
                </Link>
              )}
            </div>
          </section>
        </>
      ) : (
        <section className="project-update-card project-update-card--empty">
          <p className="project-update-empty-title">You haven't started an update yet.</p>
          <p className="project-update-empty-next">Describe what you want to change.</p>
          <Link to={`/p/${repo}/new-update`} className="pl-btn-primary">Make an update</Link>
        </section>
      )}

      {/* Everything else */}
      <h2 className="project-else-title">Or do something else</h2>
      <p className="project-else-sub">Pick one. You can always come back here.</p>
      <div className="project-actions">
        {ACTIONS.map(a => (
          <Link key={a.title} to={a.to} className="project-action">
            <span className="project-action-text">
              <span className="project-action-title">{a.title}</span>
              <span className="project-action-body">{a.body}</span>
            </span>
            <span className="project-action-cta">{a.cta}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
