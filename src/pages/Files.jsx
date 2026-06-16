import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { marked } from 'marked'
import { getFiles, getFileContent, saveFile, createFile } from '../api/github'

marked.setOptions({ breaks: true, gfm: true })

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
  const { repo } = useParams()
  const navigate = useNavigate()
  const owner = auth.user?.login

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
  const [savingMode, setSavingMode] = useState(false)
  const [saveLabel, setSaveLabel] = useState('')
  const [saveToast, setSaveToast] = useState(null)
  const toastTimer = useRef(null)

  const [preview, setPreview] = useState(false)

  const [showNewFile, setShowNewFile] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [newFileError, setNewFileError] = useState(null)
  const [newFileSaving, setNewFileSaving] = useState(false)

  useEffect(() => {
    if (!owner) return
    loadFiles()
  }, [owner, repo])

  // Cmd/Ctrl+S keyboard shortcut
  useEffect(() => {
    function onKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (isDirty && !saving && !savingMode) {
          setSaveLabel('')
          setSavingMode(true)
        }
      }
      if (e.key === 'Escape' && savingMode) {
        setSavingMode(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isDirty, saving, savingMode])

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
    if (activeFile?.path === file.path) return
    setActiveFile(file)
    setFileLoading(true)
    setFileError(null)
    setSaveToast(null)
    setSavingMode(false)
    setPreview(false)
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

  async function confirmSave(e) {
    e.preventDefault()
    if (!activeFile || saving) return
    setSaving(true)
    setSavingMode(false)
    const message = saveLabel.trim() || randomPhrase()
    try {
      const result = await saveFile(
        auth.token, owner, repo, activeFile.path,
        content, fileSha, message
      )
      setFileSha(result.content.sha)
      setSavedContent(content)
      showToast('success', `Saved: ${message}`)
    } catch (e) {
      showToast('error', e.message)
    } finally {
      setSaving(false)
      setSaveLabel('')
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
      const updated = await getFiles(auth.token, owner, repo)
      setFiles(updated)
      const created = updated.find(f => f.name === name)
      if (created) openFile(created)
    } catch (e) {
      setNewFileError(e.message)
      setNewFileSaving(false)
    }
  }

  function openNewFile() {
    setNewFileName('')
    setNewFileError(null)
    setShowNewFile(true)
  }

  const isDirty = content !== savedContent
  const isMarkdown = activeFile?.name.toLowerCase().endsWith('.md')
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0

  return (
    <div className="files-page">
      <header className="topbar">
        <button className="back-btn" onClick={() => navigate('/')}>
          <span aria-hidden="true">←</span> Projects
        </button>
        <div className="topbar-title">{repo.replace(/-/g, ' ')}</div>
        <div className="topbar-actions">
          {activeFile && (
            <>
              <button
                className="btn-ghost"
                onClick={() => navigate(`/p/${repo}/h/${encodeURIComponent(activeFile.path)}`)}
              >
                History
              </button>

              {savingMode ? (
                <form className="save-inline" onSubmit={confirmSave}>
                  <input
                    autoFocus
                    className="save-label-input"
                    placeholder="What changed? (optional)"
                    value={saveLabel}
                    onChange={e => setSaveLabel(e.target.value)}
                  />
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setSavingMode(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <button
                  className="btn-primary"
                  onClick={() => { setSaveLabel(''); setSavingMode(true) }}
                  disabled={saving || !isDirty}
                >
                  {saving ? 'Saving…' : 'Save point'}
                </button>
              )}
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
        <aside className="file-sidebar">
          <div className="sidebar-head">
            <span className="sidebar-label">Files</span>
            <button className="sidebar-new-btn" onClick={openNewFile}>
              + New file
            </button>
          </div>

          {filesLoading && <p className="sidebar-state">Loading…</p>}
          {!filesLoading && filesError && <p className="sidebar-state sidebar-error">{filesError}</p>}
          {!filesLoading && !filesError && files.length === 0 && (
            <div className="sidebar-empty-state">
              <p>No files yet.</p>
              <button className="btn-primary sidebar-empty-btn" onClick={openNewFile}>
                + Create your first file
              </button>
            </div>
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
            <div className="editor-welcome">
              <p className="welcome-title">
                {files.length === 0 ? 'Create a file to get started.' : 'Pick a file to open it.'}
              </p>
              <p className="welcome-sub">
                {files.length === 0
                  ? 'Every version you save is kept forever — you can always go back.'
                  : 'Every save point is kept forever. You can always go back.'}
              </p>
            </div>
          )}

          {activeFile && fileLoading && (
            <div className="editor-welcome"><p className="welcome-title">Opening file…</p></div>
          )}

          {activeFile && fileError && (
            <div className="editor-welcome"><p className="error-text">{fileError}</p></div>
          )}

          {activeFile && !fileLoading && !fileError && (
            <>
              {isMarkdown && (
                <div className="editor-toolbar">
                  <button
                    className={`toolbar-btn${preview ? ' active' : ''}`}
                    onClick={() => setPreview(p => !p)}
                  >
                    {preview ? 'Edit' : 'Preview'}
                  </button>
                </div>
              )}

              {preview ? (
                <div
                  className="markdown-preview"
                  dangerouslySetInnerHTML={{ __html: marked.parse(content || '') }}
                />
              ) : (
                <textarea
                  className="editor"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="This file is blank. Start typing, then make a save point when you want to keep your progress."
                  aria-label={`Editing ${activeFile.name}`}
                />
              )}

              {!preview && (
                <div className="editor-footer">
                  <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
                  <span>{content.length} {content.length === 1 ? 'character' : 'characters'}</span>
                  {isDirty && <span className="footer-unsaved">Unsaved changes · Cmd+S to save</span>}
                </div>
              )}
            </>
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
