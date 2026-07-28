/**
 * ContinueWithAI.jsx — /p/:repo/u/:updateId/ai
 *
 * Full-page "Continue with AI" screen (replaces the ProjectAIModal).
 * Four numbered steps:
 *   1. Choose an AI tool
 *   2. Select context to include
 *   3. Review and copy the prompt
 *   4. Mark as sent and open the AI
 *
 * Re-uses aiPrompt.js for prompt building.
 * Re-uses updateMemory.js recordHandoffSent for state transition.
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getUpdateById, updateUpdate, recordHandoffSent } from '../utils/updateMemory'
import { buildProjectPrompt, AI_TOOLS } from '../utils/aiPrompt'
import { getRepoInfo, getFiles, getFileContent } from '../api/github'
import { timeAgo } from '../utils/time'

const CONTEXT_OPTIONS = [
  { id: 'project_name',   label: 'Project name and description' },
  { id: 'file_list',      label: 'List of all files' },
  { id: 'update_title',   label: 'Update title and goal' },
  { id: 'open_file',      label: 'Contents of the currently open file' },
  { id: 'save_history',   label: 'Latest save point label' },
]

export default function ContinueWithAI({ auth }) {
  const { repo, updateId } = useParams()
  const navigate = useNavigate()
  const { token, user } = auth
  const owner = user?.login

  const update = owner ? getUpdateById(owner, repo, updateId) : null

  // Step state
  const [selectedTool, setSelectedTool]       = useState(null)
  const [checkedCtx, setCheckedCtx]           = useState(
    new Set(['project_name', 'file_list', 'update_title'])
  )
  const [step, setStep]                       = useState(1)
  const [prompt, setPrompt]                   = useState('')
  const [copied, setCopied]                   = useState(false)
  const [building, setBuilding]               = useState(false)
  const [buildError, setBuildError]           = useState(null)
  const [marked, setMarked]                   = useState(false)

  // Context data
  const [repoInfo, setRepoInfo]               = useState(null)
  const [files, setFiles]                     = useState([])
  const [ctxLoaded, setCtxLoaded]             = useState(false)

  useEffect(() => {
    if (!token || !owner) return
    Promise.all([
      getRepoInfo(token, owner, repo),
      getFiles(token, owner, repo),
    ])
      .then(([info, fileList]) => {
        setRepoInfo(info)
        setFiles(fileList || [])
      })
      .catch(() => {})
      .finally(() => setCtxLoaded(true))
  }, [token, owner, repo])

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

  function toggleCtx(id) {
    setCheckedCtx(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function buildPrompt() {
    setBuilding(true)
    setBuildError(null)
    try {
      let activeFileContent
      const firstFile = files[0]
      if (checkedCtx.has('open_file') && firstFile) {
        try {
          const fc = await getFileContent(token, owner, repo, firstFile.path)
          activeFileContent = fc.content
        } catch { /* ignore */ }
      }

      const text = buildProjectPrompt({
        projectName:      repoInfo?.name?.replace(/-/g, ' ') || repo.replace(/-/g, ' '),
        description:      checkedCtx.has('project_name') ? repoInfo?.description : undefined,
        repoName:         repo,
        fileNames:        checkedCtx.has('file_list') ? files.map(f => f.name) : [],
        activeFileName:   checkedCtx.has('open_file') ? firstFile?.name : undefined,
        activeFileContent: checkedCtx.has('open_file') ? activeFileContent : undefined,
        latestSaveLabel:  checkedCtx.has('save_history') ? undefined : undefined,
        userInstruction:  checkedCtx.has('update_title')
          ? `${update.title}${update.goal ? `\n\nGoal: ${update.goal}` : ''}`
          : undefined,
        activeTask:       null,
      })
      setPrompt(text)
      setStep(3)
    } catch (e) {
      setBuildError('Could not build the prompt. Try again.')
    } finally {
      setBuilding(false)
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked */
    }
  }

  function handleMarkSent() {
    if (!owner || !selectedTool) return
    // commitSha is not fetchable here without a commits API call; pass null for now
    recordHandoffSent(owner, repo, updateId, selectedTool.label, null)
    setMarked(true)
    setStep(4)
  }

  function handleOpenAI() {
    if (selectedTool?.url) window.open(selectedTool.url, '_blank', 'noopener,noreferrer')
    navigate(`/p/${repo}/u/${updateId}/return`)
  }

  return (
    <div className="screen-padded screen-narrow">
      <div className="screen-header">
        <h1>Continue with AI</h1>
        <p className="screen-subtitle">
          Build a context prompt for an AI tool, then mark it as sent so Plainly can detect what changed when you return.
        </p>
      </div>

      {/* Step 1: Choose AI tool */}
      <section className={`ai-step ${step >= 1 ? 'ai-step--active' : ''}`}>
        <h2 className="ai-step-heading"><span className="ai-step-num">1</span> Choose an AI</h2>
        <div className="ai-tool-grid">
          {AI_TOOLS.filter(t => t.id !== 'generic').map(t => (
            <button
              key={t.id}
              className={`ai-tool-btn ${selectedTool?.id === t.id ? 'ai-tool-btn--selected' : ''}`}
              onClick={() => { setSelectedTool(t); if (step === 1) setStep(2) }}
            >
              {t.label}
            </button>
          ))}
        </div>
        {!selectedTool && (
          <p className="ai-step-hint">Select the AI you'll paste this into.</p>
        )}
      </section>

      {/* Step 2: Choose context */}
      {step >= 2 && (
        <section className="ai-step ai-step--active">
          <h2 className="ai-step-heading"><span className="ai-step-num">2</span> Choose what to include</h2>
          <ul className="ctx-checklist">
            {CONTEXT_OPTIONS.map(opt => (
              <li key={opt.id} className="ctx-item">
                <label className="ctx-label">
                  <input
                    type="checkbox"
                    checked={checkedCtx.has(opt.id)}
                    onChange={() => toggleCtx(opt.id)}
                    className="ctx-checkbox"
                  />
                  {opt.label}
                </label>
              </li>
            ))}
          </ul>
          <div className="ai-step-actions">
            <button
              className="btn-primary"
              onClick={buildPrompt}
              disabled={building || !ctxLoaded}
            >
              {building ? 'Building…' : 'Build the prompt'}
            </button>
          </div>
          {buildError && <p className="error-box" style={{ marginTop: 12 }}>{buildError}</p>}
        </section>
      )}

      {/* Step 3: Review and copy */}
      {step >= 3 && (
        <section className="ai-step ai-step--active">
          <h2 className="ai-step-heading"><span className="ai-step-num">3</span> Copy the prompt</h2>
          <p className="ai-step-hint">
            Copy this and paste it into {selectedTool?.label || 'the AI tool'}.
          </p>
          <pre className="prompt-preview">{prompt}</pre>
          <div className="ai-step-actions">
            <button className="btn-primary" onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy to clipboard'}
            </button>
            <button className="btn-ghost" onClick={() => setStep(2)}>
              Change context
            </button>
          </div>
        </section>
      )}

      {/* Step 4: Mark as sent */}
      {step >= 3 && (
        <section className={`ai-step ${step >= 4 ? 'ai-step--done' : 'ai-step--active'}`}>
          <h2 className="ai-step-heading"><span className="ai-step-num">4</span> Mark as sent</h2>
          <p className="ai-step-hint">
            Once you've pasted it in, mark this update as sent. Plainly will watch for
            changes in GitHub and alert you when {selectedTool?.label || 'the AI'} has saved work.
          </p>
          {!marked ? (
            <div className="ai-step-actions">
              <button
                className="btn-primary"
                onClick={handleMarkSent}
                disabled={!selectedTool}
              >
                Mark as sent to {selectedTool?.label || 'AI'}
              </button>
            </div>
          ) : (
            <div className="ai-sent-confirmation">
              <p className="ai-sent-text">
                ✓ Marked as sent to {selectedTool?.label}. Now open the AI and paste the prompt.
              </p>
              <div className="ai-step-actions">
                <button className="btn-primary" onClick={handleOpenAI}>
                  Open {selectedTool?.label} and go to return screen
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
