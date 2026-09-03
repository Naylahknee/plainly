import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getFiles, getFileContent, saveFile, createFile } from '../api/github'

const SAVE_PHRASES = [
  'Saved progress',
  'Checkpoint saved',
  'Version saved',
  'Kept this version',
  'Saved a copy'
]

function randomPhrase() {
  return SAVE_PHRASES[Math.floor(Math.random() * SAVE_PHRASES.length)]
}

export default function Files({ auth }) {
  const { owner, repo } = useParams()
  const navigate = useNavigate()

  const [files, setFiles] = useState([])
  const [filesLoading, setFilesLoading] = useState(true)
  const [filesError, setFilesError] = useState(null)

  const [activeFile, setActiveFile] = useState(null)
  const [content, setContent] = useState('')
  const [savedContent, setSavedContent] = useState('')
  const [fileSha, setFileSha] = useState(null)
  const [fileLoading, setFileLoading] = useState(false)
  const [fileError, setFileError] = useState(null)

  const [saving, setSaving] = useState(false)
  const [saveToast, setSaveToast] = useState(null)
  const toastTimer = useRef(null)

  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [showNewFile, setShowNewFile] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [newFileError, setNewFileError] = useState(null)
  const [newFileSaving, setNewFileSaving] = useState(false)

  useEffect(() => {
    loadFiles()
  }, [owner, repo])

  async function loadFiles() {
    setFilesLoading(true)
    setFilesError(null)
    try {
      const result = await getFiles(auth.token, owner, repo)
      setFiles(result)
    } catch (e) {
      setFilesError(e.message)
    } finally {
      setFilesLoading(false)
    }
  }

  async function openFile(file) {
    if (activeFile?.path === file.path) { setSidebarOpen(false); return }
    setSidebarOpen(false)
    setActiveFile(file)
    setFileLoading(true)
    setFileError(null)
    setSaveToast(null)
    try {
      const { content: text, sha } = await getFileContent(auth.token, owner, repo, file.path)
      setContent(text)
      setSavedContent(text)
      setFileSha(sha)
    } catch (e) {
      setFileError(e.message)
    } finally {
      setFileLoading(false)
    }
  }

  function showToast(type, message) {
    clearTimeout(toastTimer.current)
    setSaveToast({ type, message })
    toastTimer.current = setTimeout(() => setSaveToast(null), 4000)
  }

  async function handleSave() {
    if (!activeFile || saving || !isDirty) return
    setSaving(true)
    try {
      const result = await saveFile(
        auth.token, owner, repo, activeFile.path,
        content, fileSha, randomPhrase()
      )
      setFileSha(result.content.sha)
      setSavedContent(content)
      showToast('success', 'Saved')
    } catch (e) {
      showToast('error', e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateFile(e) {
    e.preventDefault()
    let name = newFileName.trim()
    if (!name) return
    if (!name.includes('.')) name += '.txt'
    setNewFileSaving(true)
    setNewFileError(null)
    try {
      await createFile(auth.token, owner, repo, name)
      setShowNewFile(false)
      setNewFileName('')
      await loadFiles()
      const updated = await getFiles(auth.token, owner, repo)
      setFiles(updated)
      const created = updated.find(f => f.name === name)
      if (created) openFile(created)
    } catch (e) {
      setNewFileError(e.message)
      setNewFileSaving(false)
    }
  }

  const isDirty = content !== savedContent

  return (
    <div className="files-page">
      <header className="topbar">
        <button className="back-btn" onClick={() => navigate('/')}>
          <span aria-hidden="true">←</span> Projects
        </button>
        <div className="topbar-title">{repo.replace(/-/g, ' ')}</div>
        <div className="topbar-actions">
          <button
            className="topbar-files-btn btn-ghost"
            onClick={() => setSidebarOpen(true)}
            aria-label="Show files"
          >
            Files
          </button>
          {activeFile && (
            <>
              <button
                className="btn-ghost"
                onClick={() => navigate(`/p/${owner}/${repo}/h/${encodeURIComponent(activeFile.path)}`)}
              >
                History
              </button>
              <button
                className="btn-primary"
                onClick={handleSave}
                disabled={saving || !isDirty}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </>
          )}
        </div>
      </header>

      {saveToast && (
        <div className={`toast toast-${saveToast.type}`} role="status">
          {saveToast.message}
        </div>
      )}

      <div className="files-layout">
        {sidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
        )}
        <aside className={`file-sidebar${sidebarOpen ? ' is-open' : ''}`}>
          <div className="sidebar-head">
            <span className="sidebar-label">Files</span>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <button className="sidebar-new-btn" onClick={() => { setNewFileName(''); setNewFileError(null); setShowNewFile(true) }}>
                + New file
              </button>
              <button
                className="sidebar-close-btn sidebar-new-btn"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {filesLoading && <p className="sidebar-state">Loading…</p>}
          {!filesLoading && filesError && <p className="sidebar-state sidebar-error">{filesError}</p>}
          {!filesLoading && !filesError && files.length === 0 && (
            <p className="sidebar-state">No text files yet. Create one to get started.</p>
          )}
          {!filesLoading && !filesError && files.length > 0 && (
            <ul className="file-list">
              {files.map(file => (
                <li key={file.sha}>
                  <button
                    className={`file-item${activeFile?.path === file.path ? ' active' : ''}`}
                    onClick={() => openFile(file)}
                  >
                    {file.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <main className="editor-area">
          {!activeFile && !filesLoading && (
            <div className="editor-placeholder">
              {files.length === 0
                ? 'Create a new file to get started.'
                : 'Pick a file from the list to open it.'}
            </div>
          )}

          {activeFile && fileLoading && (
            <div className="editor-placeholder">Opening file…</div>
          )}

          {activeFile && fileError && (
            <div className="editor-placeholder error-text">{fileError}</div>
          )}

          {activeFile && !fileLoading && !fileError && (
            <textarea
              className="editor"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="This file is blank. Start typing, then make a save point when you want to keep your progress."
              aria-label={`Editing ${activeFile.name}`}
            />
          )}
        </main>
      </div>

      {showNewFile && (
        <div className="modal-overlay" onClick={() => !newFileSaving && setShowNewFile(false)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <h2>Name your file</h2>
            <p className="modal-hint">End with .txt for plain text or .md for Markdown.</p>
            <form onSubmit={handleCreateFile}>
              <input
                autoFocus
                className="text-input"
                placeholder="e.g. chapter-1.txt, notes.md"
                value={newFileName}
                onChange={e => setNewFileName(e.target.value)}
                disabled={newFileSaving}
              />
              {newFileError && <p className="error-text">{newFileError}</p>}
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowNewFile(false)}
                  disabled={newFileSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={newFileSaving || !newFileName.trim()}
                >
                  {newFileSaving ? 'Creating…' : 'Create file'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
