/**
 * drafts.js
 *
 * Edits that exist on this computer and not yet in GitHub.
 *
 * This is what makes "Changes not saved yet" true rather than decorative, and
 * what Review and save shows before anything is written (HANDOFF §7.10).
 *
 * Storage key: plainly_drafts_${owner}_${repo}  →  { [path]: { content, sha, at } }
 */

function key(owner, repo) {
  return `plainly_drafts_${owner}_${repo}`
}

export function getDrafts(owner, repo) {
  if (!owner || !repo) return {}
  try {
    return JSON.parse(localStorage.getItem(key(owner, repo)) || '{}')
  } catch {
    return {}
  }
}

export function getDraft(owner, repo, path) {
  return getDrafts(owner, repo)[path] || null
}

/** Remembers an edit. `sha` is the GitHub blob the edit was made against. */
export function setDraft(owner, repo, path, content, sha) {
  if (!owner || !repo || !path) return
  const all = getDrafts(owner, repo)
  all[path] = { content, sha, at: new Date().toISOString() }
  try {
    localStorage.setItem(key(owner, repo), JSON.stringify(all))
  } catch { /* out of space — the edit stays in the editor either way */ }
}

export function clearDraft(owner, repo, path) {
  const all = getDrafts(owner, repo)
  if (!(path in all)) return
  delete all[path]
  try {
    localStorage.setItem(key(owner, repo), JSON.stringify(all))
  } catch { /* ignore */ }
}

export function clearAllDrafts(owner, repo) {
  try {
    localStorage.removeItem(key(owner, repo))
  } catch { /* ignore */ }
}

export function draftCount(owner, repo) {
  return Object.keys(getDrafts(owner, repo)).length
}

/**
 * Which lines were added and removed.
 *
 * A longest-common-subsequence diff, so lines that didn't move are not
 * reported as changed — this screen's whole job is showing exactly what will
 * be saved.
 */
export function lineChanges(before = '', after = '') {
  const a = before.split('\n')
  const b = after.split('\n')

  // lcs[i][j] = length of the longest common subsequence of a[i..] and b[j..]
  const lcs = Array.from({ length: a.length + 1 }, () => new Uint32Array(b.length + 1))
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j]
        ? lcs[i + 1][j + 1] + 1
        : Math.max(lcs[i + 1][j], lcs[i][j + 1])
    }
  }

  const removed = []
  const added = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++ }
    else if (lcs[i + 1][j] >= lcs[i][j + 1]) { removed.push(a[i]); i++ }
    else { added.push(b[j]); j++ }
  }
  while (i < a.length) { removed.push(a[i]); i++ }
  while (j < b.length) { added.push(b[j]); j++ }

  return { removed, added }
}
