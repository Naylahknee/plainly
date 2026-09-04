/**
 * POST /api/oauth/check  { token }  →  { connected: true | false | null }
 *
 * Asks GitHub whether it still holds an authorization for this token, so
 * Account can state the connection instead of assuming it. `null` means the
 * check itself didn't work — the screen says that rather than guessing.
 */

import { checkToken } from '../../lib/oauth.js'
import { readSession, originIsSameSite } from '../../lib/session.js'
import { limit, requireJson } from '../../lib/security.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  if (!originIsSameSite(req)) return res.status(403).json({ error: 'forbidden' })
  if (!requireJson(req, res) || !limit(req, res, { max: 30, windowMs: 60_000 })) return
  const session = readSession(req)
  if (!session || req.headers?.['x-csrf-token'] !== session.csrf) return res.status(401).json({ error: 'not_signed_in' })

  try {
    res.json(await checkToken(session.token))
  } catch {
    res.json({ connected: null })
  }
}
