/**
 * POST /api/oauth/revoke  { token }
 *
 * Disconnects Plainly from the signed-in GitHub account. Called when someone
 * signs out, so that signing back in asks them to allow access again.
 *
 * The caller has already signed out locally by the time this runs — a failure
 * here means "still connected on GitHub's side", never "still signed in".
 */

import { revokeGrant } from '../../lib/oauth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  const { token } = req.body || {}
  if (!token) return res.status(400).json({ error: 'no_token' })

  try {
    const { revoked, status } = await revokeGrant(token)
    // The GitHub status goes back with the failure so it shows up in logs as
    // something specific rather than "it didn't work".
    if (!revoked) return res.status(502).json({ error: 'revoke_failed', github_status: status })
    res.status(204).end()
  } catch {
    res.status(500).json({ error: 'server_error' })
  }
}
