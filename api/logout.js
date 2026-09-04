import { revokeGrant } from '../lib/oauth.js'
import { readSession, clearAuthCookies, originIsSameSite } from '../lib/session.js'
import { limit, requireJson } from '../lib/security.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })
  if (!originIsSameSite(req) || !requireJson(req, res) || !limit(req, res, { max: 10, windowMs: 60_000 })) return
  const session = readSession(req)
  if (!session || req.headers?.['x-csrf-token'] !== session.csrf) return res.status(403).json({ error: 'forbidden' })

  clearAuthCookies(res)
  try {
    const { revoked } = await revokeGrant(session.token)
    return res.status(revoked ? 204 : 502).end()
  } catch {
    return res.status(502).end()
  }
}
