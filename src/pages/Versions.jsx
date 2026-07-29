/**
 * Versions.jsx — /p/:repo/versions (max-width 820px)
 *
 * Separate versions, explained as safe copies of the whole project
 * (HANDOFF §7.15).
 *
 * "Get latest version" checks whether GitHub has moved on since Plainly last
 * looked, and says when it checked. It never claims to be up to date without
 * having asked.
 */

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getRepoInfo, getCurrentHeadSha, getCommits } from '../api/github'
import { getMemory, setMemory } from '../utils/projectMemory'
import { timeAgo, formatCommitLabel } from '../utils/time'
import { projectName } from '../utils/projectName'

const API = 'https://api.github.com'

async function getBranches(token, owner, repo) {
  const r = await fetch(`${API}/repos/${owner}/${repo}/branches`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
  if (!r.ok) throw new Error('Could not load the versions of this project. Try refreshing.')
  const data = await r.json()
  return Array.isArray(data) ? data : []
}

export default function Versions({ auth }) {
  const { owner, repo } = useParams()
  const { token, user } = auth

  const [branches, setBranches] = useState([])
  const [repoData, setRepoData] = useState(null)
  const [latest, setLatest]     = useState(null)   // newest Save Point on the main version
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [checked, setChecked]   = useState(null)   // { at, behind }

  useEffect(() => {
    if (!token || !owner) return
    Promise.all([
      getBranches(token, owner, repo),
      getRepoInfo(token, owner, repo).catch(() => null),
      getCommits(token, owner, repo, 1).catch(() => []),
    ])
      .then(([b, info, commits]) => {
        setBranches(b)
        setRepoData(info)
        setLatest(commits[0] || null)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [token, owner, repo])

  const mainName = repoData?.default_branch || 'main'

  async function getLatest() {
    try {
      const head = await getCurrentHeadSha(token, owner, repo)
      const mem = getMemory(owner, repo)
      const behind = Boolean(mem.lastSeenCommitSha && mem.lastSeenCommitSha !== head)
      setMemory(owner, repo, { lastSeenCommitSha: head })
      setChecked({ at: new Date().toISOString(), behind })
      const commits = await getCommits(token, owner, repo, 1).catch(() => [])
      if (commits[0]) setLatest(commits[0])
    } catch {
      setError("Plainly couldn't check GitHub just now. That's a connection problem, not a problem with your work.")
    }
  }

  return (
    <div className="screen-padded versions-screen">
      <Link to={`/p/${owner}/${repo}`} className="back-link">← {projectName(repo)}</Link>
      <h1 className="versions-title">Separate versions</h1>
      <p className="versions-intro">
        A separate version is a safe copy of the whole project. You can try something risky in it
        without touching your main version — and bring it over later if you like it.
      </p>

      {loading && <p className="state-loading">Getting the versions from GitHub…</p>}
      {error && <p className="error-box">{error}</p>}

      {!loading && (
        <>
          <section className="versions-main">
            <div className="versions-main-head">
              <span className="versions-main-name">Main version</span>
              <span className="versions-main-pill">This is what you're working in</span>
            </div>
            <div className="versions-main-body">
              The real version of your project.
              {latest
                ? ` Last Save Point: ${formatCommitLabel((latest.commit?.message || '').split('\n')[0])} · ${timeAgo(latest.commit?.author?.date)}.`
                : ' No Save Points yet.'}
            </div>
            <button className="pl-btn" onClick={getLatest}>
              {checked && !checked.behind ? 'You have the latest version' : 'Get latest version'}
            </button>
            <div className="versions-note">
              {checked
                ? checked.behind
                  ? `Checked ${timeAgo(checked.at)} — GitHub had newer work, and Plainly has caught up.`
                  : `Checked ${timeAgo(checked.at)} — nothing new in GitHub since your last save.`
                : 'Checks GitHub for anything saved since you last worked here.'}
            </div>
          </section>

          {branches.filter(b => b.name !== mainName).map(b => (
            <section key={b.name} className="versions-branch">
              <div>
                <div className="versions-branch-name">{projectName(b.name)}</div>
                <div className="versions-branch-desc">
                  A safe copy of the project, kept separately from your main version.
                </div>
                <div className="versions-branch-meta">
                  In GitHub words: branch {b.name}
                </div>
              </div>
              <a
                className="pl-btn"
                href={`https://github.com/${owner}/${repo}/tree/${b.name}`}
                target="_blank"
                rel="noreferrer"
              >
                Work in this version
              </a>
            </section>
          ))}

          <section className="versions-footer">
            <div>
              <div className="versions-footer-title">Want to try something without risk?</div>
              <div className="versions-footer-body">
                Plainly copies your project into a separate version. Your main version stays
                exactly as it is.
              </div>
            </div>
            <a
              className="pl-btn"
              href={`https://github.com/${owner}/${repo}/branches`}
              target="_blank"
              rel="noreferrer"
            >
              Make a separate version
            </a>
          </section>
          <p className="versions-note">
            Making and merging separate versions still happens on GitHub — Plainly opens the
            right page rather than pretending it can do it here.
          </p>
        </>
      )}
    </div>
  )
}
