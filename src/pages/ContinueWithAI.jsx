/**
 * ContinueWithAI.jsx — /p/:repo/u/:updateId/ai (max-width 860px)
 *
 * Full-page handoff process for sending work to an AI.
 * Four numbered steps:
 *   1. Which AI are you using? (chips)
 *   2. What Plainly is packing (checklist, first 3 always-on)
 *   3. Your handoff (monospace preview, scrollable)
 *   4. Tell Plainly you've sent it
 *
 * Re-uses aiPrompt.js for prompt building.
 * Re-uses updateMemory.js recordHandoffSent for state transition.
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getUpdateById, recordHandoffSent } from '../utils/updateMemory'
import { buildProjectPrompt, AI_TOOLS } from '../utils/aiPrompt'
import { getRepoInfo, getFiles, getFileContent } from '../api/github'
import { timeAgo } from '../utils/time'
import { projectName } from '../utils/projectName'

const CONTEXT_OPTIONS = [
  { id: 'project_desc',     label: 'What this project is',          detail: 'Your project description and README', alwaysOn: true },
  { id: 'update_goal',      label: 'What you asked for',            detail: 'The goal of this update, in your words', alwaysOn: true },
  { id: 'left_off',         label: 'Where you left off',            detail: 'Last file, last Save Point, last AI', alwaysOn: true },
  { id: 'project_design',   label: 'Your project instructions',     detail: 'DESIGN.md and AGENTS.md', alwaysOn: false },
  { id: 'update_files',     label: '{n} files you picked',          detail: 'the update\'s file list', alwaysOn: false },
  { id: 'recent_changes',   label: 'Recent changes',                detail: 'Your last 3 Save Points and what they changed', alwaysOn: false },
  { id: 'scope_limits',     label: 'What not to touch',             detail: 'Do not change anything outside this update', alwaysOn: false },
  { id: 'report_format',    label: 'How to report back',            detail: 'List the files changed, in plain English', alwaysOn: false },
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
        projectName:      projectName(repoInfo?.name || repo),
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

  if (!update) {
    return (
      <div className="page">
        <main className="page-main" style={{ maxWidth: '860px' }}>
          <p className="error-box">Update not found.</p>
          <Link to={`/p/${repo}/updates`} className="pl-btn">
            Back to updates
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="page">
      <main className="page-main" style={{ maxWidth: '860px' }}>
        {/* Intro */}
        <p className="ai-intro">
          Plainly writes a handoff with everything the AI needs to pick up where you left off.
          Copy it, paste it into your AI, then come back and save what it produced.
        </p>

        {/* Previous handoff reminder */}
        {update.handoff?.sentAt && (
          <div className="ai-previous-handoff">
            <p className="ai-previous-text">
              <strong>You continued this project with {update.ai} {timeAgo(update.handoff.sentAt)}.</strong>
            </p>
            <p className="ai-previous-hint">
              Did you make changes? Plainly can only see them once they're in your files.
            </p>
            <Link to={`/p/${repo}/u/${updateId}/return`} className="pl-btn">
              Review project changes
            </Link>
          </div>
        )}

        {/* Step 1: Choose AI tool */}
        <section className="ai-step">
          <h2 className="ai-step-heading">
            <span className="ai-step-num">1</span> Which AI are you using?
          </h2>
          <div className="ai-tool-chips">
            {AI_TOOLS.filter(t => t.id !== 'generic').map(t => (
              <button
                key={t.id}
                className={`ai-tool-chip ${selectedTool?.id === t.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedTool(t)
                  if (step === 1) setStep(2)
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </section>

        {/* Step 2: Context checklist */}
        {step >= 2 && (
          <section className="ai-step">
            <h2 className="ai-step-heading">
              <span className="ai-step-num">2</span> What Plainly is packing
            </h2>
            <ul className="ai-context-list">
              {CONTEXT_OPTIONS.map(opt => (
                <li key={opt.id} className="ai-context-item">
                  <label className="ai-context-label">
                    <input
                      type="checkbox"
                      checked={checkedCtx.has(opt.id)}
                      onChange={() => {
                        if (opt.alwaysOn) return
                        toggleCtx(opt.id)
                      }}
                      disabled={opt.alwaysOn}
                      className="ai-context-checkbox"
                    />
                    <div className="ai-context-text">
                      <span className="ai-context-name">{opt.label}</span>
                      <span className="ai-context-detail">{opt.detail}</span>
                    </div>
                    {opt.alwaysOn && (
                      <span className="ai-context-always">Always included</span>
                    )}
                  </label>
                </li>
              ))}
            </ul>
            <div className="ai-step-action">
              <button
                className="pl-btn-primary"
                onClick={buildPrompt}
                disabled={building || !ctxLoaded}
              >
                {building ? 'Building…' : 'Build handoff'}
              </button>
            </div>
            {buildError && (
              <p className="error-box" style={{ marginTop: 12 }}>{buildError}</p>
            )}
          </section>
        )}

        {/* Step 3: Handoff preview */}
        {step >= 3 && (
          <section className="ai-step">
            <h2 className="ai-step-heading">
              <span className="ai-step-num">3</span> Your handoff
            </h2>
            <div className="ai-handoff-preview">
              <pre>{prompt}</pre>
            </div>
            <div className="ai-step-actions">
              <button className="pl-btn-primary" onClick={handleCopy}>
                {copied ? 'Copied ✓' : 'Copy handoff'}
              </button>
              <Link to={selectedTool?.url || '#'} target="_blank" rel="noopener,noreferrer" className="pl-btn">
                Open {selectedTool?.label || 'AI'}
              </Link>
              <p className="ai-copy-hint">
                {copied ? 'Copied to your clipboard.' : 'Copy the handoff above and paste it into your AI.'}
              </p>
            </div>
          </section>
        )}

        {/* Step 4: Mark as sent */}
        {step >= 3 && (
          <section className="ai-step">
            <div className="ai-mark-sent-strip">
              <p>
                <strong>Tell Plainly you've sent it</strong>
              </p>
              <button
                className="pl-btn-primary"
                onClick={handleMarkSent}
                disabled={marked || !selectedTool}
              >
                {marked ? '✓ Marked as sent' : `Mark as sent to ${selectedTool?.label || 'AI'}`}
              </button>
            </div>
            <p className="ai-mark-sent-note">
              Do this so Plainly knows to watch for changes when you come back.
            </p>
          </section>
        )}
      </main>
    </div>
  )
}
