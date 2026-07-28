/**
 * server.js — the OAuth endpoints for local development.
 *
 * In production these are Vercel functions under api/oauth/. Both import the
 * same module, so `npm run dev` behaves like the deployed site.
 */

import express from 'express'
import cors from 'cors'
import { exchangeCode, revokeGrant } from './api/_lib/oauth.js'

const app = express()
const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:5173'

app.use(cors({ origin: FRONTEND }))
app.use(express.json())

app.post('/api/oauth/exchange', async (req, res) => {
  const { code } = req.body || {}
  if (!code) return res.status(400).json({ error: 'no_code' })

  try {
    const token = await exchangeCode(code)
    res.json({ token })
  } catch (err) {
    if (err.message === 'missing_oauth_config') {
      return res.status(500).json({ error: 'server_error' })
    }
    res.status(400).json({ error: err.message || 'no_token' })
  }
})

app.post('/api/oauth/revoke', async (req, res) => {
  const { token } = req.body || {}
  if (!token) return res.status(400).json({ error: 'no_token' })

  try {
    const revoked = await revokeGrant(token)
    if (!revoked) return res.status(502).json({ error: 'revoke_failed' })
    res.status(204).end()
  } catch {
    res.status(500).json({ error: 'server_error' })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`OAuth server on http://localhost:${PORT}`))
