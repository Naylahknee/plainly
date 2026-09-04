import { readSession, originIsSameSite } from '../../lib/session.js'
import { limit } from '../../lib/security.js'

const METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
const SAFE_PATH = /^\/(?:user(?:\/|\?|$)|repos\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\/|\?|$))/

export default async function handler(req, res) {
  if (!METHODS.has(req.method)) return res.status(405).json({ error: 'method_not_allowed' })
  if (!originIsSameSite(req) || !limit(req, res, { max: req.method === 'GET' ? 180 : 45, windowMs: 60_000 })) return
  const session = readSession(req)
  if (!session || req.headers?.['x-csrf-token'] !== session.csrf) return res.status(401).json({ error: 'not_signed_in' })

  const path = String(req.url || '').replace(/^\/api\/github/, '')
  if (!SAFE_PATH.test(path) || path.includes('..') || path.includes('://')) return res.status(400).json({ error: 'invalid_github_path' })

  try {
    const response = await fetch(`https://api.github.com${path}`, {
      method: req.method,
      headers: {
        Authorization: `Bearer ${session.token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(req.body === undefined || req.method === 'GET' ? {} : { 'Content-Type': 'application/json' }),
      },
      body: req.body === undefined || req.method === 'GET' ? undefined : JSON.stringify(req.body),
    })
    const body = await response.text()
    const link = response.headers.get('link')
    if (link) res.setHeader('Link', link)
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json; charset=utf-8')
    res.status(response.status).send(body)
  } catch {
    res.status(502).json({ error: 'github_unavailable' })
  }
}
