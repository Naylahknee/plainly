/**
 * server.js — the OAuth endpoints for local development.
 *
 * In production these are Vercel functions under api/oauth/. Both import the
 * same module, so `npm run dev` behaves like the deployed site.
 */

import express from 'express'
import cors from 'cors'
import startOAuth from './api/oauth/start.js'
import exchangeOAuth from './api/oauth/exchange.js'
import session from './api/session.js'
import logout from './api/logout.js'
import github from './api/github/[...path].js'
import checkOAuth from './api/oauth/check.js'

const app = express()
const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:5173'

app.use(cors({ origin: FRONTEND }))
app.use(express.json())

app.post('/api/oauth/start', startOAuth)
app.post('/api/oauth/exchange', exchangeOAuth)
app.post('/api/oauth/check', checkOAuth)
app.get('/api/session', session)
app.post('/api/logout', logout)
app.all('/api/github/*', github)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`OAuth server on http://localhost:${PORT}`))
