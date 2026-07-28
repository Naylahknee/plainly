/**
 * POST /api/oauth/check  { token }  →  { connected: true | false | null }
 *
 * Asks GitHub whether it still holds an authorization for this token, so
 * Account can state the connection instead of assuming it. `null` means the
 * check itself didn't work — the screen says that rather than guessing.
 */

import { checkToken } from '../../lib/oauth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  const { token } = req.body || {}
  if (!token) return res.status(400).json({ error: 'no_token' })

  try {
    res.json(await checkToken(token))
  } catch {
    res.json({ connected: null })
  }
}
