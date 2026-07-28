/**
 * projectStatus.js
 *
 * The project-level status pill, derived only from stored update records so
 * Home and My Projects can never disagree.
 *
 * Returns null when Plainly has nothing true to say about a project — no pill
 * beats a wrong one (HANDOFF §0).
 */
export function projectStatus(updates) {
  if (!updates || updates.length === 0) return null
  if (updates.some(u => u.status === 'changes_detected' || u.status === 'waiting_for_review')) {
    return { label: 'Needs review', tone: 'needs-review' }
  }
  if (updates.some(u => u.status === 'ready_to_save')) {
    return { label: 'Changes not saved', tone: 'changes-unsaved' }
  }
  if (updates.every(u => u.status === 'saved')) {
    return { label: 'Up to date', tone: 'up-to-date' }
  }
  return null
}
