import { readSession, originIsSameSite } from '../lib/session.js'
import { limit } from '../lib/security.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' })
  if (!originIsSameSite(req) || !limit(req, res, { max: 60, windowMs: 60_000 })) return
  const session = readSession(req)
  if (!session) return res.status(401).json({ error: 'not_signed_in' })

  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${session.token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })
    if (!response.ok) return res.status(401).json({ error: 'not_signed_in' })
    res.setHeader('Cache-Control', 'no-store')
    res.json({ user: await response.json(), csrf: session.csrf })
  } catch {
    res.status(503).json({ error: 'session_unavailable' })
  }
}
