import { exchangeCode } from '../../lib/oauth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  const { code } = req.body || {}
  if (!code) return res.status(400).json({ error: 'no_code' })

  try {
    const token = await exchangeCode(code)
    res.json({ token })
  } catch (err) {
    // GitHub refusing the code is the user's problem to retry; anything else is ours.
    if (err.message === 'missing_oauth_config') {
      return res.status(500).json({ error: 'server_error' })
    }
    res.status(400).json({ error: err.message || 'no_token' })
  }
}
