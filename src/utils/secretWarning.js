// A final, local-only safety check before project context is copied to an
// external AI. It is intentionally conservative: it warns rather than trying
// to decide whether a value is truly a secret or silently editing a handoff.
const PATTERNS = [
  ['a private key', /-----BEGIN(?: [A-Z0-9]+)? PRIVATE KEY-----/i],
  ['a GitHub token', /(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})/],
  ['an OpenAI-style API key', /\bsk-[A-Za-z0-9_-]{20,}/],
  ['an AWS access key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ['a password or API-key assignment', /\b(?:password|api[_-]?key|secret|token)\s*[:=]\s*[^\s'"`]{8,}/i],
]

export function findSensitiveText(text) {
  return PATTERNS.filter(([, pattern]) => pattern.test(text)).map(([label]) => label)
}
