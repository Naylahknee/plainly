/**
 * activity.js
 *
 * "Everything you and your AI tools have done, newest first" (HANDOFF §7.3, §7.12).
 *
 * Every event here is something that actually happened and was recorded: a file
 * you opened, a Save Point you made, a handoff you sent, a step in an update's
 * story, or a commit GitHub reports. Nothing is inferred.
 */

import { getMemory } from './projectMemory'
import { getUpdates } from './updateMemory'

// Keep in step with AI_TOOLS in aiPrompt.js. bob and codex are kept because
// stored memory from before they were dropped still names them, and a past
// event must keep reading the way it happened.
const AI_LABEL = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
  manus: 'Manus',
  deepseek: 'DeepSeek',
  bob: 'Bob',
  codex: 'Codex',
  generic: 'an AI',
}

function firstLine(commit) {
  return (commit.commit?.message || '').split('\n')[0].trim()
}

/**
 * @param {object} p
 * @param {string} p.owner
 * @param {Array}  p.repos           repositories from the GitHub API
 * @param {object} [p.commitsByRepo] optional { [repoName]: commits[] } — real
 *                                   Save Points, for screens willing to fetch them
 * @returns {Array} [{ what, repo, at }] newest first
 */
export function activityEvents({ owner, repos = [], commitsByRepo = {} }) {
  if (!owner) return []
  const events = []
  const seen = new Set()

  const add = (what, repo, at) => {
    if (!what || !at) return
    const key = `${repo}|${what}`
    if (seen.has(key)) return
    seen.add(key)
    events.push({ what, repo, at })
  }

  for (const repo of repos) {
    const name = repo.name
    const mem = getMemory(owner, name)

    // Commits first, so a Save Point GitHub knows about wins over the local
    // note about the same save.
    for (const commit of commitsByRepo[name] || []) {
      add(`Created a Save Point — "${firstLine(commit)}"`, name, commit.commit?.author?.date)
    }

    if (mem.lastSaveLabel) add(`Created a Save Point — "${mem.lastSaveLabel}"`, name, mem.lastSaveAt)
    if (mem.lastOpenedFile) add(`Opened ${mem.lastOpenedFile}`, name, mem.lastOpenedAt)
    else if (mem.lastOpenedAt) add('Opened this project', name, mem.lastOpenedAt)
    if (mem.lastAITool) {
      add(`Continued work with ${AI_LABEL[mem.lastAITool] || mem.lastAITool}`, name, mem.lastAIAt)
    }

    for (const update of getUpdates(owner, name) || []) {
      for (const step of update.story || []) add(step.what, name, step.at)
    }
  }

  return events.sort((a, b) => new Date(b.at) - new Date(a.at))
}
