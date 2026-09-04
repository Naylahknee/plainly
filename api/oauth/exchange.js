import { exchangeCode } from '../../lib/oauth.js'
import { readOAuthTransaction, setSession, clearAuthCookies, clearOAuthTransaction, originIsSameSite } from '../../lib/session.js'
import { hasSafeSize, limit, requireJson } from '../../lib/security.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  if (!originIsSameSite(req)) return res.status(403).json({ error: 'forbidden' })
  if (!requireJson(req, res) || !limit(req, res, { max: 10, windowMs: 60_000 })) return
  const { code, state } = req.body || {}
  const transaction = readOAuthTransaction(req)
  if (!hasSafeSize(code, 2048) || !hasSafeSize(state, 256) || !transaction || state !== transaction.state) {
    clearAuthCookies(res)
    return res.status(400).json({ error: 'invalid_oauth_callback' })
  }

  try {
    const token = await exchangeCode(code, transaction.verifier)
    setSession(res, token)
    clearOAuthTransaction(res)
    res.setHeader('Cache-Control', 'no-store')
    res.status(204).end()
  } catch (err) {
    clearAuthCookies(res)
    return res.status(err.message === 'missing_oauth_config' ? 500 : 400)
      .json({ error: err.message === 'missing_oauth_config' ? 'server_error' : 'oauth_exchange_failed' })
  }
}
