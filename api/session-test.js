import { readSession } from '../lib/session.js'

export default function handler(req, res) {
  res.status(readSession(req) ? 200 : 401).end()
}
