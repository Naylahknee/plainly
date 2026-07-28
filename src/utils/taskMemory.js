/**
 * taskMemory.js
 *
 * Pure client-side task store using localStorage.
 * Stores per-project tasks (title, goal, status, notes, AI usage).
 *
 * Storage key: plainly_tasks_${owner}_${repo}
 */

function key(owner, repo) {
  return `plainly_tasks_${owner}_${repo}`
}

/**
 * Generates a simple unique ID from timestamp + random suffix.
 * @returns {string}
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Returns all tasks for a repo, newest first.
 * @param {string} owner
 * @param {string} repo
 * @returns {Array}
 */
export function getTasks(owner, repo) {
  try {
    const raw = localStorage.getItem(key(owner, repo))
    if (!raw) return []
    const tasks = JSON.parse(raw)
    return Array.isArray(tasks)
      ? [...tasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      : []
  } catch {
    return []
  }
}

function saveTasks(owner, repo, tasks) {
  try {
    localStorage.setItem(key(owner, repo), JSON.stringify(tasks))
  } catch {
    // localStorage unavailable or full — silently ignore
  }
}

/**
 * Creates and persists a new task.
 * @param {string} owner
 * @param {string} repo
 * @param {string} title
 * @param {string|null} goal
 * @returns {object} the new task
 */
export function createTask(owner, repo, title, goal = null) {
  const now = new Date().toISOString()
  const task = {
    id: generateId(),
    repoKey: `${owner}/${repo}`,
    title: title.trim(),
    goal: goal ? goal.trim() : null,
    status: 'open',
    createdAt: now,
    updatedAt: now,
    lastAITool: null,
    lastAIAt: null,
    lastAIInstruction: null,
    filesHint: null,
    notes: null,
  }
  const current = getTasks(owner, repo)
  saveTasks(owner, repo, [task, ...current])
  return task
}

/**
 * Merges a patch into a task by id.
 * @param {string} owner
 * @param {string} repo
 * @param {string} id
 * @param {object} patch
 */
export function updateTask(owner, repo, id, patch) {
  try {
    const raw = localStorage.getItem(key(owner, repo))
    const tasks = raw ? JSON.parse(raw) : []
    const updated = tasks.map(t =>
      t.id === id
        ? { ...t, ...patch, updatedAt: new Date().toISOString() }
        : t
    )
    saveTasks(owner, repo, updated)
  } catch {
    // silently ignore
  }
}

/**
 * Removes a task by id.
 * @param {string} owner
 * @param {string} repo
 * @param {string} id
 */
export function deleteTask(owner, repo, id) {
  try {
    const raw = localStorage.getItem(key(owner, repo))
    const tasks = raw ? JSON.parse(raw) : []
    saveTasks(owner, repo, tasks.filter(t => t.id !== id))
  } catch {
    // silently ignore
  }
}

/**
 * Returns the first 'open' or 'in-progress' task, or null.
 * @param {string} owner
 * @param {string} repo
 * @returns {object|null}
 */
export function getActiveTask(owner, repo) {
  const tasks = getTasks(owner, repo)
  return tasks.find(t => t.status === 'open' || t.status === 'in-progress') || null
}
