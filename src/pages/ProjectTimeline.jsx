import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getFiles, getFileHistory } from '../api/github'
import { getMemory } from '../utils/projectMemory'
import { getTasks } from '../utils/taskMemory'
import { timeAgo, formatCommitLabel } from '../utils/time'
import { projectName } from '../utils/projectName'

const AI_LABELS = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
  bob: 'Bob',
  generic: 'Generic AI',
}

export default function ProjectTimeline({ auth }) {
  const { repo } = useParams()
  const navigate = useNavigate()
  const owner = auth.user?.login

  const [recentActivity, setRecentActivity] = useState([])
  const [activityLoading, setActivityLoading] = useState(true)
  const [activityError, setActivityError] = useState(null)

  const projectTitle = projectName(repo)
  const memory = owner ? getMemory(owner, repo) : {}
  const tasks = owner ? getTasks(owner, repo) : []

  useEffect(() => {
    if (!owner) return
    loadActivity()
  }, [owner, repo])

  async function loadActivity() {
    setActivityLoading(true)
    setActivityError(null)
    try {
      const files = await getFiles(auth.token, owner, repo)
      if (files.length === 0) {
        setRecentActivity([])
        return
      }

      // Fetch history for each file, then deduplicate by SHA and sort by date
      const allCommits = []
      const seen = new Set()

      await Promise.all(
        files.map(async file => {
          try {
            const commits = await getFileHistory(auth.token, owner, repo, file.path)
            for (const c of commits) {
              if (!seen.has(c.sha)) {
                seen.add(c.sha)
                allCommits.push({ ...c, _fileName: file.name })
              }
            }
          } catch {
            // skip files that fail
          }
        })
      )

      allCommits.sort((a, b) =>
        new Date(b.commit.author.date) - new Date(a.commit.author.date)
      )

      setRecentActivity(allCommits.slice(0, 10))
    } catch (e) {
      setActivityError(e.message)
    } finally {
      setActivityLoading(false)
    }
  }

  const hasMemory = memory.lastOpenedAt || memory.lastAITool || memory.lastSaveLabel
  const hasTasks = tasks.length > 0
  const hasActivity = recentActivity.length > 0

  return (
    <div className="page timeline-page">
      <header className="topbar">
        <button className="back-btn" onClick={() => navigate(`/p/${repo}`)}>
          <span aria-hidden="true">←</span> {projectTitle}
        </button>
        <div className="topbar-title">Timeline: {projectTitle}</div>
        <div className="topbar-actions" />
      </header>

      <main className="page-main">
        {/* ── Empty state ── */}
        {!activityLoading && !hasActivity && !hasMemory && !hasTasks && (
          <div className="empty-state">
            <p>
              No history yet. Open a file, make a save point, and this timeline
              will fill in as you work.
            </p>
          </div>
        )}

        {/* ── Recent activity (from GitHub) ── */}
        <section className="timeline-section">
          <h2 className="timeline-section-title">Recent save points</h2>
          {activityLoading && (
            <p className="state-loading">Loading save points…</p>
          )}
          {!activityLoading && activityError && (
            <p className="error-box">{activityError}</p>
          )}
          {!activityLoading && !activityError && !hasActivity && (
            <p className="timeline-empty">
              No save points yet. Make your first save point in the editor.
            </p>
          )}
          {!activityLoading && !activityError && hasActivity && (
            <div className="timeline">
              {recentActivity.map((commit, i) => {
                const label = formatCommitLabel(commit.commit.message)
                return (
                  <div key={commit.sha} className="activity-entry">
                    <div className="timeline-rail">
                      <div className="timeline-dot" />
                      {i < recentActivity.length - 1 && <div className="timeline-line" />}
                    </div>
                    <div className="timeline-body">
                      <p className="timeline-message">{label}</p>
                      <p className="timeline-meta">
                        {commit._fileName} &middot; {timeAgo(commit.commit.author.date)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Memory (from localStorage) ── */}
        {hasMemory && (
          <section className="timeline-section">
            <h2 className="timeline-section-title">Where you left off</h2>
            <div className="timeline-memory-card">
              {memory.lastOpenedAt && (
                <div className="timeline-memory-row">
                  <span className="timeline-memory-label">Last opened</span>
                  <span>{timeAgo(memory.lastOpenedAt)}</span>
                </div>
              )}
              {memory.lastOpenedFile && (
                <div className="timeline-memory-row">
                  <span className="timeline-memory-label">Last file</span>
                  <span>{memory.lastOpenedFile}</span>
                </div>
              )}
              {memory.lastSaveLabel && (
                <div className="timeline-memory-row">
                  <span className="timeline-memory-label">Last save point</span>
                  <span>"{memory.lastSaveLabel}"</span>
                </div>
              )}
              {memory.lastAITool && (
                <div className="timeline-memory-row">
                  <span className="timeline-memory-label">Last AI handoff</span>
                  <span>
                    {AI_LABELS[memory.lastAITool] || memory.lastAITool}
                    {memory.lastAIAt ? ` · ${timeAgo(memory.lastAIAt)}` : ''}
                  </span>
                </div>
              )}
              {memory.lastAIInstruction && (
                <div className="timeline-memory-row">
                  <span className="timeline-memory-label">AI instruction</span>
                  <span className="timeline-memory-instruction">
                    "{memory.lastAIInstruction}"
                  </span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Tasks (from localStorage) ── */}
        <section className="timeline-section">
          <h2 className="timeline-section-title">Tasks</h2>
          {!hasTasks ? (
            <p className="timeline-empty">
              No tasks yet. Add tasks from the project sidebar.
            </p>
          ) : (
            <div className="timeline-task-list">
              {tasks.map(task => (
                <div key={task.id} className="timeline-task-item">
                  <span className={`task-badge task-badge-${task.status}`}>
                    {task.status}
                  </span>
                  <div className="timeline-task-body">
                    <span className="timeline-task-title">{task.title}</span>
                    {task.goal && (
                      <span className="timeline-task-goal">{task.goal}</span>
                    )}
                  </div>
                  <span className="timeline-task-meta">
                    Updated {timeAgo(task.updatedAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
