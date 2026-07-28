/**
 * Home.jsx — / (max-width 1000px)
 *
 * Answers three questions the moment it opens: where did I leave off, what
 * happened since, what should I do next (HANDOFF §7.3).
 *
 * Order: greeting → explainer → CONTINUE WHERE YOU LEFT OFF → WHAT NEEDS YOUR
 * ATTENTION → recent projects + recent activity.
 *
 * The three hero sentences come from heroFor() — never computed here.
 */

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getUpdates, getActiveUpdate, STATUS_LABEL } from '../utils/updateMemory'
import { heroFor } from '../utils/heroFor'
import { greeting, timeAgo } from '../utils/time'
import { getRepos, getCommits } from '../api/github'
import { getMemory } from '../utils/projectMemory'
import { getDrafts } from '../utils/drafts'
import { activityEvents } from '../utils/activity'
import { projectName } from '../utils/projectName'
import { projectStatus } from '../utils/projectStatus'

const EXPLAINER_DISMISSED_KEY = 'plainly_home_explainer_dismissed'

export default function Home({ auth }) {
  const { user, token } = auth
  const navigate = useNavigate()
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)
  const [explainerDismissed, setExplainerDismissed] = useState(() => {
    try {
      return localStorage.getItem(EXPLAINER_DISMISSED_KEY) === 'true'
    } catch {
      return false
    }
  })

  const [commitsByRepo, setCommitsByRepo] = useState({})

  useEffect(() => {
    if (!token) return
    getRepos(token)
      .then(r => setRepos(r || []))
      .catch(() => setRepos([]))
      .finally(() => setLoading(false))
  }, [token])


  const owner = user?.login
  const firstName = user?.name?.split(' ')[0] || user?.login || ''

  // Recent Save Points for the projects on screen — this is what fills
  // "what you and your AI tools have done" before any update exists.
  useEffect(() => {
    if (!token || !owner || repos.length === 0) return
    let cancelled = false
    Promise.all(repos.slice(0, 4).map(r =>
      getCommits(token, owner, r.name, 5)
        .then(c => [r.name, c])
        .catch(() => [r.name, []])
    )).then(pairs => {
      if (!cancelled) setCommitsByRepo(Object.fromEntries(pairs))
    })
    return () => { cancelled = true }
  }, [token, owner, repos])

  // Every update across every project, newest activity first.
  const allUpdates = []
  if (owner) {
    for (const r of repos) {
      for (const u of getUpdates(owner, r.name) || []) {
        allUpdates.push({ ...u, repoName: r.name })
      }
    }
  }
  allUpdates.sort((a, b) => new Date(b.lastActivityAt || 0) - new Date(a.lastActivityAt || 0))

  // The hero is one update — the most recently active one still in flight.
  let heroUpdate = null
  let heroRepo = null
  if (owner) {
    for (const r of repos) {
      const active = getActiveUpdate(owner, r.name)
      if (active && (!heroUpdate || new Date(active.lastActivityAt || 0) > new Date(heroUpdate.lastActivityAt || 0))) {
        heroUpdate = active
        heroRepo = r.name
      }
    }
  }

  const hero = heroUpdate
    ? heroFor(heroUpdate, { filesCount: (heroUpdate.files || []).length })
    : null

  const mostRecent = owner
    ? [...repos].sort((a, b) => {
        const at = getMemory(owner, a.name).lastOpenedAt || a.updated_at || 0
        const bt = getMemory(owner, b.name).lastOpenedAt || b.updated_at || 0
        return new Date(bt) - new Date(at)
      })[0]
    : repos[0]

  const updateCount = allUpdates.filter(u => u.status !== 'saved' && u.status !== 'paused').length

  // What needs your attention: only real items. An update that has been
  // reviewed but not saved is the one thing Plainly can say for certain.
  const unsavedUpdate = allUpdates.find(u => u.status === 'ready_to_save')

  const events = activityEvents({ owner, repos, commitsByRepo })

  const dismissExplainer = () => {
    try {
      localStorage.setItem(EXPLAINER_DISMISSED_KEY, 'true')
      setExplainerDismissed(true)
    } catch { /* preference just won't persist */ }
  }

  return (
    <div className="screen-padded home-screen">
      {/* 1. Greeting */}
      <div className="home-header">
        <div>
          <h1 className="home-greeting">
            {greeting()}{firstName ? `, ${firstName}` : ''}.
          </h1>
          <p className="home-subtitle">
            Here's where you left off, what changed, and what to do next.
          </p>
        </div>
        <Link to="/projects" className="pl-btn home-all-projects">All projects</Link>
      </div>

      {/* 2. Dismissible explainer */}
      {!explainerDismissed && (
        <section className="home-explainer">
          <div>
            <p className="home-explainer-title">New here? This is what Plainly does.</p>
            <p className="home-explainer-body">
              Your work lives in GitHub. Plainly is the front door: it remembers where you stopped,
              explains what changed in normal words, and keeps a Save Point every time you save so
              you can always go back.
            </p>
          </div>
          <button className="home-explainer-dismiss" onClick={dismissExplainer}>Got it</button>
        </section>
      )}

      {/* 3. Continue where you left off */}
      <div className="section-label">Continue where you left off</div>
      {heroUpdate && hero ? (
        <section className="home-hero-card">
          <div className="home-hero-context">
            <span className="home-hero-project">{projectName(heroRepo)}</span>
            <span className="home-hero-separator">·</span>
            <span className="home-hero-label">Update</span>
            <span className={`pl-pill pl-pill--${heroUpdate.status}`}>
              {STATUS_LABEL[heroUpdate.status]}
            </span>
          </div>
          <h2 className="home-hero-title">{heroUpdate.title}</h2>
          {heroUpdate.goal && <p className="home-hero-goal">{heroUpdate.goal}</p>}

          <div className="home-hero-panel">
            <div className="home-hero-row">
              <span className="home-hero-row-label">Where you left off</span>
              <span className="home-hero-row-value">{hero.left}</span>
            </div>
            <div className="home-hero-row">
              <span className="home-hero-row-label">What's happened since</span>
              <span className="home-hero-row-value">{hero.since}</span>
            </div>
            <div className="home-hero-row">
              <span className="home-hero-row-label home-hero-row-label--next">What to do next</span>
              <span className="home-hero-row-value home-hero-row-value--next">{hero.next}</span>
            </div>
          </div>

          <div className="home-hero-actions">
            <button
              className="pl-btn-primary home-hero-cta"
              onClick={() => navigate(`/p/${heroRepo}/u/${heroUpdate.id}/${hero.route}`)}
            >
              {hero.cta}
            </button>
            <Link to={`/p/${heroRepo}/u/${heroUpdate.id}`} className="pl-btn">Open the update</Link>
            <Link to={`/p/${heroRepo}/updates`} className="pl-btn">Something else</Link>
          </div>
        </section>
      ) : (
        <section className="home-hero-card home-hero-empty">
          {mostRecent && (
            <div className="home-hero-context">
              <span className="home-hero-project">{projectName(mostRecent.name)}</span>
              <span className="home-hero-separator">·</span>
              <span className="home-hero-label">Most recent project</span>
            </div>
          )}
          <p className="home-hero-empty-title">You haven't started an update yet.</p>
          <p className="home-hero-empty-next">Describe what you want to change.</p>
          <div className="home-hero-actions">
            <Link
              to={mostRecent ? `/p/${mostRecent.name}/new-update` : '/projects'}
              className="pl-btn-primary home-hero-cta"
            >
              Make an update
            </Link>
            {mostRecent && (
              <Link to={`/p/${mostRecent.name}`} className="pl-btn">
                Open {projectName(mostRecent.name)}
              </Link>
            )}
          </div>
        </section>
      )}

      {/* 4. What needs your attention */}
      <div className="section-label">What needs your attention</div>
      {unsavedUpdate ? (
        <div className="home-attention-card">
          <div className="home-attention-text">
            <div className="home-attention-title">
              {projectName(unsavedUpdate.repoName)} has changes that aren't saved yet
            </div>
            <div className="home-attention-body">
              Edits to{' '}
              <strong>
                {(unsavedUpdate.files || []).length
                  ? unsavedUpdate.files.join(', ')
                  : 'this update'}
              </strong>{' '}
              only exist on this computer. Until you save them to GitHub, they aren't backed up
              and you can't go back to them later.
            </div>
          </div>
          <Link to={`/p/${unsavedUpdate.repoName}/save`} className="pl-btn-primary home-attention-cta">
            Review and save
          </Link>
        </div>
      ) : (
        <div className="home-attention-none">
          <span className="home-attention-tick" aria-hidden="true">✓</span>
          <span>Nothing needs you right now. Everything is saved in GitHub.</span>
        </div>
      )}

      {/* 5. Recent projects + recent activity */}
      <div className="home-columns">
        <div>
          <div className="home-column-head">
            <div className="section-label section-label--tight">Recent projects</div>
            <Link to="/projects" className="text-link">See all</Link>
          </div>
          {loading && <p className="state-loading">Getting your projects from GitHub…</p>}
          {!loading && repos.length === 0 && (
            <p className="home-empty-note">No projects yet. Start one and it shows up here.</p>
          )}
          <div className="home-project-list">
            {repos.slice(0, 4).map(repo => {
              const mem = owner ? getMemory(owner, repo.name) : {}
              const status = projectStatus(
                owner ? getUpdates(owner, repo.name) : [],
                owner ? getDrafts(owner, repo.name) : {}
              )
              const lastAction = mem.lastSaveLabel
                ? `Last Save Point: ${mem.lastSaveLabel}`
                : mem.lastOpenedAt
                  ? `Opened ${timeAgo(mem.lastOpenedAt)}`
                  : `Last touched ${timeAgo(repo.updated_at)}`
              return (
                <Link key={repo.id || repo.name} to={`/p/${repo.name}`} className="home-project-card">
                  <span className="home-project-body">
                    <span className="home-project-top">
                      <span className="home-project-name">{projectName(repo.name)}</span>
                      {status && (
                        <span className={`pl-pill pl-pill--${status.tone}`}>{status.label}</span>
                      )}
                    </span>
                    <span className="home-project-desc">
                      {repo.description || 'No description yet — you can add one in project settings.'}
                    </span>
                    <span className="home-project-action">{lastAction}</span>
                    <span className="home-project-url">github.com/{owner}/{repo.name}</span>
                  </span>
                  <span className="home-project-chevron" aria-hidden="true">›</span>
                </Link>
              )
            })}
          </div>
        </div>

        <div>
          <div className="section-label section-label--tight">Recent activity</div>
          <div className="home-activity">
            {events.length === 0 && (
              <p className="home-empty-note">
                Nothing yet. Anything you or an AI does shows up here.
              </p>
            )}
            {events.slice(0, 5).map((e, i) => (
              <div key={`${e.repo}-${e.at}-${i}`} className="home-activity-row">
                <span className="home-activity-dot" aria-hidden="true" />
                <span>
                  <span className="home-activity-what">{e.what}</span>
                  <span className="home-activity-meta">
                    {projectName(e.repo)} · {timeAgo(e.at)}
                  </span>
                </span>
              </div>
            ))}
            <Link to="/activity" className="text-link home-activity-all">See all activity</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
