import { getAuthorizeUrl } from '../../lib/oauth.js'
import { randomToken, setOAuthTransaction, originIsSameSite } from '../../lib/session.js'
import { limit, requireJson } from '../../lib/security.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })
  if (!originIsSameSite(req)) return res.status(403).json({ error: 'forbidden' })
  if (!requireJson(req, res) || !limit(req, res, { max: 10, windowMs: 60_000 })) return

  try {
    const state = randomToken()
    const verifier = randomToken(48)
    setOAuthTransaction(res, { state, verifier })
    res.setHeader('Cache-Control', 'no-store')
    res.json({ authorizeUrl: getAuthorizeUrl(state, verifier) })
  } catch {
    res.status(500).json({ error: 'server_error' })
  }
}
