import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import JSZip from 'jszip'
import { timeAgo } from '../utils/time'
import {
  getFiles, getFileContent, saveFile, createFile, getRepoInfo,
  deleteFile, createFileWithContent, updateRepoSettings, deleteRepo
} from '../api/github'
import ProjectAIModal from '../components/ProjectAIModal'
import { recordFileOpen, recordSave, recordAIHandoff } from '../utils/projectMemory'
import {
  getTasks, createTask, updateTask, deleteTask, getActiveTask
} from '../utils/taskMemory'

marked.setOptions({ breaks: true, gfm: true })

const SAVE_PHRASES = [
  'Saved progress', 'Checkpoint saved', 'Version saved',
  'Kept this version', 'Saved a copy'
]
const FONT_SIZES = [14, 16, 18, 20]

function randomPhrase() {
  return SAVE_PHRASES[Math.floor(Math.random() * SAVE_PHRASES.length)]
}

const STATUS_LABELS = {
  'open': 'Open',
  'in-progress': 'In progress',
  'review': 'Review',
  'done': 'Done',
}

export default function Files({ auth }) {
  const { repo } = useParams()
  const navigate = useNavigate()
  const owner = auth.user?.login

  const [files, setFiles] = useState([])
  const [filesLoading, setFilesLoading] = useState(true)
  const [filesError, setFilesError] = useState(null)
  const [repoInfo, setRepoInfo] = useState(null)

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
  const autosaveTimer = useRef(null)
  const doSaveRef = useRef(null)
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState(null)

  const [preview, setPreview] = useState(false)

  const [showNewFile, setShowNewFile] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [newFileError, setNewFileError] = useState(null)
  const [newFileSaving, setNewFileSaving] = useState(false)

  const [focusMode, setFocusMode] = useState(false)

  const [fontSize, setFontSize] = useState(() => {
    const s = localStorage.getItem('plainly_font_size')
    return s ? parseInt(s) : 16
  })

  const [wordGoal, setWordGoal] = useState(() => {
    const s = localStorage.getItem('plainly_word_goal')
    return s ? parseInt(s) : 0
  })
  const [editingGoal, setEditingGoal] = useState(false)
  const [goalInput, setGoalInput] = useState('')
  const [goalReached, setGoalReached] = useState(false)

  const [renamingFile, setRenamingFile] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [renaming, setRenaming] = useState(false)

  const [fileToDelete, setFileToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteFileError, setDeleteFileError] = useState(null)

  const [showSettings, setShowSettings] = useState(false)
  const [settingsDesc, setSettingsDesc] = useState('')
  const [settingsPrivate, setSettingsPrivate] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsError, setSettingsError] = useState(null)
  const [deleteProjectName, setDeleteProjectName] = useState('')
  const [deletingProject, setDeletingProject] = useState(false)
  const [deleteProjectError, setDeleteProjectError] = useState(null)

  const [downloadingAll, setDownloadingAll] = useState(false)

  const [showAIModal, setShowAIModal] = useState(false)

  // ── Task panel state ──
  const [tasks, setTasks] = useState([])
  const [taskPanelOpen, setTaskPanelOpen] = useState(false)
  const [showNewTaskForm, setShowNewTaskForm] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskGoal, setNewTaskGoal] = useState('')
  const [selectedTask, setSelectedTask] = useState(null)
  const [showTaskSheet, setShowTaskSheet] = useState(false)

  const isDirty = content !== savedContent
  const isMarkdown = activeFile?.name.toLowerCase().endsWith('.md')
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0
  const projectTitle = repo.replace(/-/g, ' ')

  // Active task for summary bar
  const activeTask = owner ? getActiveTask(owner, repo) : null

  // Reload tasks from localStorage
  function refreshTasks() {
    if (owner) {
      setTasks(getTasks(owner, repo))
    }
  }

  useEffect(() => {
    if (!owner) return
    loadFiles()
    getRepoInfo(auth.token, owner, repo).then(setRepoInfo).catch(() => {})
    refreshTasks()
  }, [owner, repo])

  useEffect(() => {
    function onKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (isDirty && !saving && !savingMode) {
          setSaveLabel('')
          setSavingMode(true)
        }
      }
      if (e.key === 'Escape') {
        if (focusMode) setFocusMode(false)
        else if (savingMode) setSavingMode(false)
        else if (showTaskSheet) setShowTaskSheet(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isDirty, saving, savingMode, focusMode, showTaskSheet])

  useEffect(() => {
    if (!isDirty || !activeFile) {
      clearTimeout(autosaveTimer.current)
      return
    }
    clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(() => {
      doSaveRef.current?.('Auto-saved', false)
    }, 30000)
    return () => clearTimeout(autosaveTimer.current)
  }, [content, isDirty, activeFile?.path])

  useEffect(() => {
    if (wordGoal > 0 && wordCount >= wordGoal && !goalReached) {
      setGoalReached(true)
      showToast('success', 'Goal reached!')
    }
    if (wordCount < wordGoal * 0.9) setGoalReached(false)
  }, [wordCount, wordGoal])

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
    setLastAutoSaveTime(null)
    if (owner) recordFileOpen(owner, repo, file.name)
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

  async function doSave(message, showSuccess = true) {
    if (!activeFile || saving) return
    setSaving(true)
    setSavingMode(false)
    try {
      const result = await saveFile(auth.token, owner, repo, activeFile.path, content, fileSha, message)
      setFileSha(result.content.sha)
      setSavedContent(content)
      if (owner) recordSave(owner, repo, message)
      if (showSuccess) {
        setLastAutoSaveTime(null)
        showToast('success', `Saved: ${message}`)
      } else {
        setLastAutoSaveTime(new Date())
      }
    } catch (e) {
      showToast('error', e.message)
    } finally {
      setSaving(false)
      setSaveLabel('')
    }
  }
  doSaveRef.current = doSave

  async function confirmSave(e) {
    e.preventDefault()
    await doSave(saveLabel.trim() || randomPhrase(), true)
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

  function handleDownload() {
    if (!activeFile) return
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = activeFile.name
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleDownloadAll() {
    if (files.length === 0) return
    setDownloadingAll(true)
    try {
      const zip = new JSZip()
      const folder = zip.folder(repo)
      await Promise.all(
        files.map(async file => {
          const { content: text } = await getFileContent(auth.token, owner, repo, file.path)
          folder.file(file.name, text)
        })
      )
      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${repo}-export.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      showToast('error', 'Could not download all files. Try again.')
    } finally {
      setDownloadingAll(false)
    }
  }

  async function handleShare() {
    if (!activeFile) return
    const url = `https://github.com/${owner}/${repo}/blob/main/${encodeURIComponent(activeFile.path)}`
    try {
      await navigator.clipboard.writeText(url)
      showToast('success', 'Link copied to clipboard')
    } catch {
      showToast('error', 'Could not copy the link')
    }
  }

  function startRename(file) {
    if (file.path === activeFile?.path && isDirty) {
      showToast('error', 'Save your changes before renaming')
      return
    }
    setRenamingFile(file)
    setRenameValue(file.name)
  }

  async function handleRename(e) {
    e.preventDefault()
    let newName = renameValue.trim()
    if (!newName || newName === renamingFile.name) {
      setRenamingFile(null)
      return
    }
    const oldExt = renamingFile.name.includes('.')
      ? '.' + renamingFile.name.split('.').pop()
      : ''
    if (!newName.includes('.') && oldExt) newName += oldExt

    setRenaming(true)
    try {
      const { content: fileContent, sha: oldSha } = await getFileContent(
        auth.token, owner, repo, renamingFile.path
      )
      await createFileWithContent(
        auth.token, owner, repo, newName, fileContent, `Renamed from ${renamingFile.name}`
      )
      await deleteFile(
        auth.token, owner, repo, renamingFile.path, oldSha, `Renamed to ${newName}`
      )
      const updated = await getFiles(auth.token, owner, repo)
      setFiles(updated)
      if (activeFile?.path === renamingFile.path) {
        const newFile = updated.find(f => f.name === newName)
        if (newFile) {
          setActiveFile(newFile)
          const { sha: newSha } = await getFileContent(auth.token, owner, repo, newFile.path)
          setFileSha(newSha)
        }
      }
      setRenamingFile(null)
    } catch (err) {
      showToast('error', err.message)
    } finally {
      setRenaming(false)
    }
  }

  async function handleDeleteFile() {
    if (!fileToDelete || deleting) return
    setDeleting(true)
    setDeleteFileError(null)
    try {
      const { sha } = await getFileContent(auth.token, owner, repo, fileToDelete.path)
      await deleteFile(auth.token, owner, repo, fileToDelete.path, sha, `Deleted ${fileToDelete.name}`)
      setFiles(prev => prev.filter(f => f.path !== fileToDelete.path))
      if (activeFile?.path === fileToDelete.path) {
        setActiveFile(null)
        setContent('')
        setSavedContent('')
        setFileSha(null)
        setLastAutoSaveTime(null)
      }
      setFileToDelete(null)
    } catch (err) {
      setDeleteFileError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  function openSettings() {
    setSettingsDesc(repoInfo?.description || '')
    setSettingsPrivate(repoInfo?.private || false)
    setSettingsError(null)
    setDeleteProjectName('')
    setDeleteProjectError(null)
    setShowSettings(true)
  }

  async function handleSaveSettings(e) {
    e.preventDefault()
    setSettingsSaving(true)
    setSettingsError(null)
    try {
      const updated = await updateRepoSettings(auth.token, owner, repo, {
        description: settingsDesc,
        private: settingsPrivate
      })
      setRepoInfo(updated)
      setShowSettings(false)
    } catch (err) {
      setSettingsError(err.message)
    } finally {
      setSettingsSaving(false)
    }
  }

  async function handleDeleteProject() {
    if (deleteProjectName !== repo || deletingProject) return
    setDeletingProject(true)
    setDeleteProjectError(null)
    try {
      await deleteRepo(auth.token, owner, repo)
      navigate('/')
    } catch (err) {
      setDeleteProjectError(err.message)
      setDeletingProject(false)
    }
  }

  function changeFontSize(delta) {
    setFontSize(prev => {
      const idx = FONT_SIZES.indexOf(prev)
      const cur = idx === -1 ? 1 : idx
      const next = Math.max(0, Math.min(FONT_SIZES.length - 1, cur + delta))
      localStorage.setItem('plainly_font_size', String(FONT_SIZES[next]))
      return FONT_SIZES[next]
    })
  }

  function handleSetGoal(e) {
    e?.preventDefault()
    const val = parseInt(goalInput)
    if (!isNaN(val) && val > 0) {
      setWordGoal(val)
      localStorage.setItem('plainly_word_goal', String(val))
      setGoalReached(false)
    } else {
      setWordGoal(0)
      localStorage.removeItem('plainly_word_goal')
    }
    setEditingGoal(false)
    setGoalInput('')
  }

  // ── Task handlers ──

  function handleCreateTask(e) {
    e.preventDefault()
    const title = newTaskTitle.trim()
    if (!title || !owner) return
    createTask(owner, repo, title, newTaskGoal.trim() || null)
    setNewTaskTitle('')
    setNewTaskGoal('')
    setShowNewTaskForm(false)
    refreshTasks()
  }

  function handleUpdateTaskStatus(id, status) {
    if (!owner) return
    updateTask(owner, repo, id, { status })
    refreshTasks()
    if (selectedTask?.id === id) {
      setSelectedTask(prev => ({ ...prev, status }))
    }
  }

  function handleUpdateTaskNotes(id, notes) {
    if (!owner) return
    updateTask(owner, repo, id, { notes })
    refreshTasks()
  }

  function handleDeleteTask(id) {
    if (!owner) return
    deleteTask(owner, repo, id)
    refreshTasks()
    if (selectedTask?.id === id) {
      setSelectedTask(null)
      setShowTaskSheet(false)
    }
  }

  function openTaskDetail(task) {
    setSelectedTask(task)
    setShowTaskSheet(true)
  }

  return (
    <div className={`files-page${focusMode ? ' focus-mode' : ''}`}>
      <header className="topbar">
        <button className="back-btn" onClick={() => navigate('/')}>
          <span aria-hidden="true">←</span> Projects
        </button>
        <div className="topbar-title">{projectTitle}</div>
        <div className="topbar-actions">
          <button
            className="btn-ghost"
            onClick={() => navigate(`/p/${repo}/timeline`)}
          >
            Timeline
          </button>

          <button
            className="btn-ghost"
            onClick={() => setShowAIModal(true)}
          >
            Continue with Another AI
          </button>

          <button
            className="btn-ghost topbar-icon-btn"
            onClick={openSettings}
            title="Project settings"
          >
            ···
          </button>

          {activeFile && (
            <>
              <button
                className="btn-ghost topbar-icon-btn"
                onClick={handleShare}
                title="Copy link to file"
              >
                ↗
              </button>
              <button
                className="btn-ghost topbar-icon-btn"
                onClick={handleDownload}
                title="Download file"
              >
                ↓
              </button>
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
                  className={`btn-primary${isDirty && !saving ? ' btn-pulse' : ''}`}
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

      <div className="project-summary-bar">
        <div className="project-summary-left">
          <span className="project-summary-name">{projectTitle}</span>
          {repoInfo?.description && (
            <span className="project-summary-desc">{repoInfo.description}</span>
          )}
          {activeTask && (
            <>
              <span className="project-summary-dot">·</span>
              <span className="project-summary-task">
                <span className={`task-badge task-badge-${activeTask.status}`}>
                  {activeTask.status}
                </span>
                {activeTask.title}
              </span>
            </>
          )}
        </div>
        <div className="project-summary-right">
          {!filesLoading && (
            <span className="project-summary-stat">
              {files.length} {files.length === 1 ? 'file' : 'files'}
            </span>
          )}
          {repoInfo?.pushed_at && (
            <>
              <span className="project-summary-dot">·</span>
              <span className="project-summary-stat">Last save {timeAgo(repoInfo.pushed_at)}</span>
            </>
          )}
          {files.length > 0 && (
            <>
              <span className="project-summary-dot">·</span>
              <button
                className="summary-download-btn"
                onClick={handleDownloadAll}
                disabled={downloadingAll}
              >
                {downloadingAll ? 'Zipping…' : '↓ All files'}
              </button>
            </>
          )}
        </div>
      </div>

      {saveToast && (
        <div className={`toast toast-${saveToast.type}`} role="status">
          {saveToast.message}
        </div>
      )}

      <div className="files-layout">
        <aside className="file-sidebar">
          {/* ── Task panel ── */}
          <div className="task-panel">
            <button
              className="task-panel-toggle"
              onClick={() => setTaskPanelOpen(o => !o)}
              aria-expanded={taskPanelOpen}
            >
              <span>Tasks</span>
              {activeTask && (
                <span className={`task-badge task-badge-${activeTask.status}`}>
                  {activeTask.status}
                </span>
              )}
              <span className="task-panel-arrow" aria-hidden="true">
                {taskPanelOpen ? '▴' : '▾'}
              </span>
            </button>

            {taskPanelOpen && (
              <div className="task-panel-body">
                {tasks.length === 0 && !showNewTaskForm && (
                  <p className="task-panel-empty">No tasks yet.</p>
                )}

                {tasks.slice(0, 3).map(task => (
                  <div key={task.id} className="task-item">
                    <button
                      className="task-item-title"
                      onClick={() => openTaskDetail(task)}
                    >
                      <span className={`task-badge task-badge-${task.status}`}>
                        {task.status}
                      </span>
                      {task.title}
                    </button>
                  </div>
                ))}

                {tasks.length > 3 && (
                  <button
                    className="task-panel-view-all"
                    onClick={() => setShowTaskSheet(true)}
                  >
                    View all {tasks.length} tasks →
                  </button>
                )}

                {showNewTaskForm ? (
                  <form className="task-form" onSubmit={handleCreateTask}>
                    <input
                      autoFocus
                      className="task-form-input"
                      placeholder="Task title"
                      value={newTaskTitle}
                      onChange={e => setNewTaskTitle(e.target.value)}
                    />
                    <textarea
                      className="task-form-input task-form-goal"
                      placeholder="Goal (optional)"
                      value={newTaskGoal}
                      onChange={e => setNewTaskGoal(e.target.value)}
                      rows={2}
                    />
                    <div className="task-form-actions">
                      <button
                        type="button"
                        className="task-form-cancel"
                        onClick={() => { setShowNewTaskForm(false); setNewTaskTitle(''); setNewTaskGoal('') }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="task-form-save"
                        disabled={!newTaskTitle.trim()}
                      >
                        Add task
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    className="task-panel-new-btn"
                    onClick={() => setShowNewTaskForm(true)}
                  >
                    + New task
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── File list ── */}
          <div className="sidebar-head">
            <span className="sidebar-label">Files</span>
            <button className="sidebar-new-btn" onClick={openNewFile}>+ New file</button>
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
                <li key={file.sha} className="file-item-wrapper">
                  {renamingFile?.path === file.path ? (
                    <form onSubmit={handleRename} className="rename-form">
                      <input
                        autoFocus
                        className="rename-input"
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onKeyDown={e => e.key === 'Escape' && setRenamingFile(null)}
                        disabled={renaming}
                      />
                    </form>
                  ) : (
                    <div className="file-row">
                      <button
                        className={`file-item${activeFile?.path === file.path ? ' active' : ''}`}
                        onClick={() => openFile(file)}
                      >
                        {file.name}
                      </button>
                      <div className="file-actions">
                        <button
                          className="file-action-btn"
                          title="Rename"
                          onClick={() => startRename(file)}
                        >
                          ✎
                        </button>
                        <button
                          className="file-action-btn"
                          title="Delete"
                          onClick={() => { setDeleteFileError(null); setFileToDelete(file) }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
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
            <div className="editor-welcome">
              <p className="welcome-title">Opening file…</p>
            </div>
          )}

          {activeFile && fileError && (
            <div className="editor-welcome">
              <p className="error-text">{fileError}</p>
            </div>
          )}

          {activeFile && !fileLoading && !fileError && (
            <>
              <div className="editor-toolbar">
                {isMarkdown && (
                  <button
                    className={`toolbar-btn${preview ? ' active' : ''}`}
                    onClick={() => setPreview(p => !p)}
                  >
                    {preview ? 'Edit' : 'Preview'}
                  </button>
                )}
                <div className="toolbar-spacer" />
                <div className="font-size-controls">
                  <button
                    className="toolbar-btn"
                    onClick={() => changeFontSize(-1)}
                    title="Smaller text"
                    disabled={fontSize <= FONT_SIZES[0]}
                  >
                    A−
                  </button>
                  <button
                    className="toolbar-btn"
                    onClick={() => changeFontSize(1)}
                    title="Larger text"
                    disabled={fontSize >= FONT_SIZES[FONT_SIZES.length - 1]}
                  >
                    A+
                  </button>
                </div>
                <button
                  className={`toolbar-btn${focusMode ? ' active' : ''}`}
                  onClick={() => setFocusMode(f => !f)}
                  title={focusMode ? 'Exit focus mode (Esc)' : 'Focus mode — hide everything but the page'}
                >
                  {focusMode ? '⊡' : '⊞'}
                </button>
              </div>

              {wordGoal > 0 && !preview && (
                <div className="word-goal-bar">
                  <div
                    className="word-goal-progress"
                    style={{ width: `${Math.min(100, (wordCount / wordGoal) * 100)}%` }}
                  />
                </div>
              )}

              {preview ? (
                <div
                  className="markdown-preview"
                  style={{ fontSize: `${fontSize}px` }}
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(content || '')) }}
                />
              ) : (
                <textarea
                  className="editor"
                  style={{ fontSize: `${fontSize}px` }}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="This file is blank. Start typing, then make a save point when you want to keep your progress."
                  aria-label={`Editing ${activeFile.name}`}
                />
              )}

              {!preview && (
                <div className="editor-footer">
                  {editingGoal ? (
                    <form onSubmit={handleSetGoal} className="goal-form">
                      <input
                        autoFocus
                        type="number"
                        className="goal-input"
                        placeholder="Word goal (0 to clear)"
                        value={goalInput}
                        onChange={e => setGoalInput(e.target.value)}
                        onBlur={handleSetGoal}
                        min="0"
                      />
                    </form>
                  ) : (
                    <button
                      className="footer-stat"
                      onClick={() => { setGoalInput(wordGoal ? String(wordGoal) : ''); setEditingGoal(true) }}
                      title="Click to set a daily word goal"
                    >
                      {wordGoal > 0
                        ? `${wordCount} / ${wordGoal} words`
                        : `${wordCount} ${wordCount === 1 ? 'word' : 'words'}`}
                    </button>
                  )}
                  <span>
                    {content.length} {content.length === 1 ? 'char' : 'chars'}
                  </span>
                  {!isDirty && lastAutoSaveTime && (
                    <span className="footer-autosaved">Auto-saved {timeAgo(lastAutoSaveTime)}</span>
                  )}
                  {isDirty && <span className="footer-unsaved">Unsaved · Cmd+S to save</span>}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ── Task detail sheet ── */}
      {showTaskSheet && (
        <div
          className="modal-overlay"
          onClick={() => setShowTaskSheet(false)}
        >
          <div
            className="modal task-detail"
            role="dialog"
            aria-modal="true"
            onClick={e => e.stopPropagation()}
          >
            <h2>Tasks</h2>
            {tasks.length === 0 ? (
              <p className="task-detail-empty">No tasks yet. Use the sidebar to add one.</p>
            ) : (
              <div className="task-detail-list">
                {tasks.map(task => {
                  const isSelected = selectedTask?.id === task.id
                  return (
                    <div
                      key={task.id}
                      className={`task-detail-item${isSelected ? ' selected' : ''}`}
                    >
                      <div
                        className="task-detail-header"
                        onClick={() => setSelectedTask(isSelected ? null : task)}
                        style={{ cursor: 'pointer' }}
                      >
                        <span className={`task-badge task-badge-${task.status}`}>
                          {task.status}
                        </span>
                        <span className="task-detail-title">{task.title}</span>
                      </div>
                      {isSelected && (
                        <div className="task-detail-body">
                          {task.goal && (
                            <p className="task-detail-goal">{task.goal}</p>
                          )}
                          <label className="task-detail-label">Status</label>
                          <select
                            className="task-detail-select"
                            value={task.status}
                            onChange={e => handleUpdateTaskStatus(task.id, e.target.value)}
                          >
                            {Object.entries(STATUS_LABELS).map(([val, label]) => (
                              <option key={val} value={val}>{label}</option>
                            ))}
                          </select>
                          <label className="task-detail-label">Notes</label>
                          <textarea
                            className="task-detail-notes"
                            rows={3}
                            defaultValue={task.notes || ''}
                            placeholder="Add notes about this task…"
                            onBlur={e => handleUpdateTaskNotes(task.id, e.target.value)}
                          />
                          {task.lastAITool && (
                            <p className="task-detail-ai">
                              Last AI: {task.lastAITool}
                              {task.lastAIAt ? ` · ${timeAgo(task.lastAIAt)}` : ''}
                            </p>
                          )}
                          <button
                            className="btn-danger task-detail-delete"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            Delete task
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setShowTaskSheet(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

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

      {fileToDelete && (
        <div className="modal-overlay" onClick={() => !deleting && setFileToDelete(null)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <h2>Delete "{fileToDelete.name}"?</h2>
            <p className="modal-hint">
              This permanently deletes the file and all its history. This cannot be undone.
            </p>
            {deleteFileError && <p className="error-text">{deleteFileError}</p>}
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setFileToDelete(null)} disabled={deleting}>
                Cancel
              </button>
              <button className="btn-danger" onClick={handleDeleteFile} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete file'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div
          className="modal-overlay"
          onClick={() => !settingsSaving && !deletingProject && setShowSettings(false)}
        >
          <div
            className="modal modal-settings"
            role="dialog"
            aria-modal="true"
            onClick={e => e.stopPropagation()}
          >
            <h2>Project settings</h2>
            <form onSubmit={handleSaveSettings}>
              <label className="settings-label">Description</label>
              <textarea
                className="text-input settings-desc-input"
                placeholder="What is this project for? (optional)"
                value={settingsDesc}
                onChange={e => setSettingsDesc(e.target.value)}
                disabled={settingsSaving}
                rows={3}
              />
              <label className="settings-label settings-toggle-label">
                <input
                  type="checkbox"
                  checked={settingsPrivate}
                  onChange={e => setSettingsPrivate(e.target.checked)}
                  disabled={settingsSaving}
                />
                Private project (only you can see it on GitHub)
              </label>
              {settingsError && <p className="error-text">{settingsError}</p>}
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowSettings(false)}
                  disabled={settingsSaving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={settingsSaving}>
                  {settingsSaving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>

            <div className="settings-danger-zone">
              <p className="settings-danger-title">Danger zone</p>
              <p className="settings-danger-body">
                Permanently delete this project and all its files and history.
                Type <strong>{repo}</strong> to confirm.
              </p>
              <input
                className="text-input"
                placeholder={repo}
                value={deleteProjectName}
                onChange={e => setDeleteProjectName(e.target.value)}
                disabled={deletingProject}
              />
              {deleteProjectError && <p className="error-text">{deleteProjectError}</p>}
              <button
                className="btn-danger"
                style={{ marginTop: '10px' }}
                onClick={handleDeleteProject}
                disabled={deletingProject || deleteProjectName !== repo}
              >
                {deletingProject ? 'Deleting…' : 'Delete this project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAIModal && (
        <ProjectAIModal
          auth={auth}
          repo={repo}
          repoInfo={repoInfo}
          files={files}
          activeFile={activeFile}
          content={content}
          onClose={() => setShowAIModal(false)}
          onHandoff={(toolId, instruction) => {
            if (owner) recordAIHandoff(owner, repo, toolId, instruction)
          }}
        />
      )}
    </div>
  )
}
