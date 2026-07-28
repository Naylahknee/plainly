/**
 * ProjectFiles.jsx — /p/:repo/files (max-width 860px)
 *
 * The real files in the project, folders included (HANDOFF §7.14).
 *
 * The old file list filtered folders out and kept only text files, which is
 * why the project never looked like the project. This uses getContents(),
 * which filters nothing, and a folder opens with a labelled button rather than
 * a bare chevron.
 */

import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getContents } from '../api/github'
import { getDrafts } from '../utils/drafts'
import { projectName } from '../utils/projectName'
import { timeAgo } from '../utils/time'

/* Plain-language notes sit beside the real name, never replacing it. */
const NOTES = {
  'readme.md':     'Project overview — the first thing anyone reads',
  'package.json':  'Project setup and tools',
  'design.md':     'Design instructions',
  'agents.md':     'Instructions for AI coding tools',
  'src':           'Main application code',
  'public':        'Images and public files',
  'index.html':    'The page your project opens on',
  '.gitignore':    'Files GitHub should ignore',
}

/* Folders that deserve a warning get one. */
const WARNINGS = {
  public: 'Anything in here is visible to anyone who opens your project online.',
}

function noteFor(entry) {
  return NOTES[entry.name.toLowerCase()] || (entry.type === 'dir' ? 'A folder in your project' : null)
}

export default function ProjectFiles({ auth }) {
  const { repo } = useParams()
  const { token, user } = auth
  const owner = user?.login

  const [entries, setEntries] = useState([])
  const [open, setOpen]       = useState({})     // path -> children | 'loading'
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    if (!token || !owner) return
    getContents(token, owner, repo)
      .then(setEntries)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [token, owner, repo])

  const drafts = owner ? getDrafts(owner, repo) : {}

  async function toggleFolder(entry) {
    if (open[entry.path]) {
      setOpen(prev => {
        const next = { ...prev }
        delete next[entry.path]
        return next
      })
      return
    }
    setOpen(prev => ({ ...prev, [entry.path]: 'loading' }))
    try {
      const children = await getContents(token, owner, repo, entry.path)
      setOpen(prev => ({ ...prev, [entry.path]: children }))
    } catch {
      setOpen(prev => ({ ...prev, [entry.path]: [] }))
    }
  }

  return (
    <div className="screen-padded files-screen">
      <Link to={`/p/${repo}`} className="back-link">← {projectName(repo)}</Link>
      <h1 className="files-title">Project files</h1>
      <p className="files-intro">
        These are the real files in your GitHub project. Names stay exactly as they are — the
        grey line under each one explains what it's for.
      </p>

      <div className="files-legend">
        <span className="files-legend-item">
          <span className="files-glyph files-glyph--folder" aria-hidden="true" />
          Folder — holds other files
        </span>
        <span className="files-legend-item">
          <span className="files-glyph files-glyph--file" aria-hidden="true" />
          File — you can open and edit it
        </span>
      </div>

      {loading && <p className="state-loading">Getting your files from GitHub…</p>}
      {error && <p className="error-box">{error}</p>}
      {!loading && !error && entries.length === 0 && (
        <p className="files-empty">There's nothing in this project yet.</p>
      )}

      <div className="files-list">
        {entries.map(entry => {
          const isFolder = entry.type === 'dir'
          const note = noteFor(entry)
          const children = open[entry.path]
          const isOpen = Boolean(children)
          const hasDraft = Boolean(drafts[entry.path])

          return (
            <div key={entry.path} className={`files-row-wrap${isFolder ? ' is-folder' : ''}`}>
              <div className="files-row">
                <span
                  className={`files-glyph ${isFolder ? 'files-glyph--folder' : 'files-glyph--file'}`}
                  aria-hidden="true"
                />
                <div className="files-row-text">
                  <div className="files-row-top">
                    <span className="files-name">{entry.name}</span>
                    {isFolder ? (
                      <span className="files-pill">
                        Folder{Array.isArray(children) ? ` · ${children.length} items inside` : ''}
                      </span>
                    ) : (
                      <span className={`files-pill${hasDraft ? ' files-pill--unsaved' : ''}`}>
                        {hasDraft ? 'Changes not saved' : 'Saved'}
                      </span>
                    )}
                  </div>
                  {note && <div className="files-note">{note}</div>}
                  {hasDraft && (
                    <div className="files-note files-note--unsaved">
                      Edited {timeAgo(drafts[entry.path].at)} — not in GitHub yet.
                    </div>
                  )}
                </div>

                {isFolder ? (
                  <button className="pl-btn files-action" onClick={() => toggleFolder(entry)}>
                    {isOpen ? "Hide what's inside" : "Show what's inside"}
                  </button>
                ) : (
                  <>
                    <Link to={`/p/${repo}/f/${entry.path}`} className="pl-btn files-action">Open</Link>
                    <Link to={`/p/${repo}/changed`} className="pl-btn files-action">History</Link>
                  </>
                )}
              </div>

              {isOpen && (
                <div className="files-children">
                  {WARNINGS[entry.name.toLowerCase()] && (
                    <div className="files-warning">{WARNINGS[entry.name.toLowerCase()]}</div>
                  )}
                  {children === 'loading' && <p className="state-loading">Opening…</p>}
                  {Array.isArray(children) && children.length === 0 && (
                    <p className="files-note">This folder is empty.</p>
                  )}
                  {Array.isArray(children) && children.map(kid => (
                    <div key={kid.path} className="files-child">
                      <span
                        className={`files-glyph ${kid.type === 'dir' ? 'files-glyph--folder' : 'files-glyph--file'}`}
                        aria-hidden="true"
                      />
                      <div className="files-row-text">
                        <div className="files-name files-name--child">{kid.name}</div>
                        {noteFor(kid) && <div className="files-note">{noteFor(kid)}</div>}
                      </div>
                      {kid.type === 'dir'
                        ? <span className="files-child-note">Folder</span>
                        : <Link to={`/p/${repo}/f/${kid.path}`} className="pl-btn files-action">Open</Link>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
