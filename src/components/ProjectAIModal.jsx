import { useState, useEffect, useRef } from 'react'
import { getFileHistory } from '../api/github'
import { formatCommitLabel } from '../utils/time'
import { buildProjectPrompt, AI_TOOLS } from '../utils/aiPrompt'

/**
 * ProjectAIModal
 *
 * Opens over the Files page. Assembles full project context into a prompt
 * the user can copy and take to any AI tool to continue work immediately.
 *
 * Props:
 *   auth         — { token, user }
 *   repo         — raw repository slug (e.g. "my-novel")
 *   repoInfo     — GitHub repo object ({ description, ... }) or null
 *   files        — array of file objects currently in sidebar
 *   activeFile   — the open file object or null
 *   content      — current editor text (may include unsaved changes)
 *   onClose      — () => void
 */
export default function ProjectAIModal({
  auth,
  repo,
  repoInfo,
  files,
  activeFile,
  content,
  onClose,
  onHandoff,
}) {
  const owner = auth.user?.login
  const projectName = repo ? repo.replace(/-/g, ' ') : ''
  const fileNames = files.map(f => f.name)

  const [selectedTool, setSelectedTool] = useState('chatgpt')
  const [instruction, setInstruction] = useState(
    'Continue implementing this project while preserving the existing architecture and approach.'
  )
  const [latestSaveLabel, setLatestSaveLabel] = useState(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef(null)

  // Fetch the most recent save-point label for the open file
  useEffect(() => {
    if (!activeFile || !owner || !repo) return
    setHistoryLoading(true)
    getFileHistory(auth.token, owner, repo, activeFile.path)
      .then(history => {
        if (history && history.length > 0) {
          setLatestSaveLabel(formatCommitLabel(history[0].commit.message))
        }
      })
      .catch(() => {}) // non-fatal; prompt still works without it
      .finally(() => setHistoryLoading(false))
  }, [activeFile?.path, owner, repo])

  // Re-focus modal when it opens
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const prompt = buildProjectPrompt({
    projectName,
    description: repoInfo?.description || '',
    repoName: repo,
    fileNames,
    activeFileName: activeFile?.name || null,
    activeFileContent: content || '',
    latestSaveLabel: historyLoading ? null : latestSaveLabel,
    userInstruction: instruction,
  })

  const activeTool = AI_TOOLS.find(t => t.id === selectedTool) || AI_TOOLS[0]

  function handleCopy() {
    if (onHandoff) onHandoff(selectedTool, instruction)
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true)
      clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopied(false), 2500)
    })
  }

  function handleOpenAI() {
    if (onHandoff) onHandoff(selectedTool, instruction)
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true)
      clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopied(false), 2500)
    })
    if (activeTool.url) {
      window.open(activeTool.url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Continue with Another AI"
    >
      <div
        className="modal ai-modal"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <h2>Continue with Another AI</h2>
        <p className="modal-hint">
          Copies your project context so any AI can pick up right where you left off.
        </p>

        {/* ── Context summary ── */}
        <div className="ai-context-summary">
          <div className="ai-context-row">
            <span className="ai-context-label">Project</span>
            <span className="ai-context-value">{projectName || '—'}</span>
          </div>
          <div className="ai-context-row">
            <span className="ai-context-label">Repository</span>
            <span className="ai-context-value">{repo || '—'}</span>
          </div>
          <div className="ai-context-row">
            <span className="ai-context-label">Open file</span>
            <span className="ai-context-value">
              {activeFile ? activeFile.name : <em>No file open</em>}
            </span>
          </div>
          <div className="ai-context-row">
            <span className="ai-context-label">Files in project</span>
            <span className="ai-context-value">
              {files.length} {files.length === 1 ? 'file' : 'files'}
            </span>
          </div>
          {(latestSaveLabel || historyLoading) && (
            <div className="ai-context-row">
              <span className="ai-context-label">Latest save point</span>
              <span className="ai-context-value">
                {historyLoading ? 'Loading…' : latestSaveLabel}
              </span>
            </div>
          )}
        </div>

        {/* ── AI selector ── */}
        <p className="ai-section-label">Send to</p>
        <div className="ai-tool-strip">
          {AI_TOOLS.map(tool => (
            <button
              key={tool.id}
              className={`ai-tool-btn${selectedTool === tool.id ? ' active' : ''}`}
              onClick={() => setSelectedTool(tool.id)}
            >
              {tool.label}
            </button>
          ))}
        </div>

        {/* ── Instruction ── */}
        <p className="ai-section-label">What should the AI do?</p>
        <textarea
          className="text-input ai-instruction-input"
          value={instruction}
          onChange={e => setInstruction(e.target.value)}
          rows={3}
          placeholder="Describe what you want the AI to help with…"
        />

        {/* ── Prompt preview ── */}
        <p className="ai-section-label">
          Prompt preview
          <span className="ai-char-count">
            {prompt.length.toLocaleString()} chars
          </span>
        </p>
        <div className="ai-prompt-preview" aria-label="Generated prompt preview">
          <pre>{prompt}</pre>
        </div>

        {/* ── Actions ── */}
        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-ghost" onClick={handleCopy}>
            {copied ? 'Copied ✓' : 'Copy prompt'}
          </button>
          <button className="btn-primary" onClick={handleOpenAI}>
            {activeTool.url
              ? `Open ${activeTool.label}`
              : 'Copy prompt'}
          </button>
        </div>

        {copied && activeTool.url && (
          <p className="ai-copied-hint">
            Prompt copied — paste it in the tab that just opened.
          </p>
        )}
      </div>
    </div>
  )
}
