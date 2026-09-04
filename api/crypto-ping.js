import crypto from 'node:crypto'

export default function handler(req, res) {
  res.setHeader('X-Crypto-Test', String(Boolean(crypto.randomBytes(1))))
  res.status(204).end()
}
