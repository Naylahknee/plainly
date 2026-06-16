export function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`
  const years = Math.floor(months / 12)
  return `${years} year${years !== 1 ? 's' : ''} ago`
}

const AUTO_PHRASES = new Set([
  'Saved progress', 'Checkpoint saved', 'Version saved',
  'Kept this version', 'Saved a copy'
])

export function formatCommitLabel(message) {
  if (!message) return 'Save point'
  if (message.startsWith('Created ')) return 'First version'
  if (message.startsWith('Restored version from')) return 'Restored to an earlier version'
  if (AUTO_PHRASES.has(message)) return 'Save point'
  return message
}

export function isUserLabel(message) {
  if (!message) return false
  if (message.startsWith('Created ')) return false
  if (message.startsWith('Restored version from')) return false
  return !AUTO_PHRASES.has(message)
}

export function greeting() {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'Good morning'
  if (h >= 12 && h < 18) return 'Good afternoon'
  if (h >= 18 && h < 22) return 'Good evening'
  return 'Hello'
}
