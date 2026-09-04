import crypto from 'node:crypto'

const SESSION_COOKIE = 'plainly_session'
const OAUTH_COOKIE = 'plainly_oauth_transaction'
const SESSION_SECONDS = 8 * 60 * 60
const OAUTH_SECONDS = 10 * 60

function key() {
  const raw = process.env.GITHUB_SESSION_SECRET
  if (!raw) throw new Error('missing_session_secret')
  const value = Buffer.from(raw, 'base64url')
  if (value.length !== 32) throw new Error('invalid_session_secret')
  return value
}

function seal(value) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv)
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()])
  return [iv, cipher.getAuthTag(), encrypted].map(part => part.toString('base64url')).join('.')
}

function open(value) {
  try {
    const [iv, tag, encrypted] = String(value || '').split('.').map(part => Buffer.from(part, 'base64url'))
    if (!iv || !tag || !encrypted) return null
    const decipher = crypto.createDecipheriv('aes-256-gcm', key(), iv)
    decipher.setAuthTag(tag)
    return JSON.parse(Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8'))
  } catch {
    return null
  }
}

function cookies(req) {
  return Object.fromEntries(
    String(req.headers?.cookie || '')
      .split(';')
      .map(part => part.trim().split(/=(.*)/s, 2))
      .filter(([name]) => name)
  )
}

function cookie(name, value, seconds) {
  const secure = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${seconds}${secure ? '; Secure' : ''}`
}

function appendCookie(res, value) {
  const existing = res.getHeader('Set-Cookie')
  res.setHeader('Set-Cookie', existing ? [...(Array.isArray(existing) ? existing : [existing]), value] : value)
}

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url')
}

export function setOAuthTransaction(res, transaction) {
  res.setHeader('Set-Cookie', cookie(OAUTH_COOKIE, seal({ ...transaction, exp: Date.now() + OAUTH_SECONDS * 1000 }), OAUTH_SECONDS))
}

export function readOAuthTransaction(req) {
  const transaction = open(cookies(req)[OAUTH_COOKIE])
  return transaction?.exp > Date.now() ? transaction : null
}

export function setSession(res, token) {
  const csrf = randomToken()
  appendCookie(res, cookie(SESSION_COOKIE, seal({ token, csrf, exp: Date.now() + SESSION_SECONDS * 1000 }), SESSION_SECONDS))
  return csrf
}

export function clearOAuthTransaction(res) {
  appendCookie(res, cookie(OAUTH_COOKIE, '', 0))
}

export function readSession(req) {
  const session = open(cookies(req)[SESSION_COOKIE])
  return session?.token && session?.csrf && session?.exp > Date.now() ? session : null
}

export function clearAuthCookies(res) {
  res.setHeader('Set-Cookie', [
    cookie(SESSION_COOKIE, '', 0),
    cookie(OAUTH_COOKIE, '', 0),
  ])
}

export function originIsSameSite(req) {
  const origin = req.headers?.origin
  if (!origin) return process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1'
  const host = req.headers?.['x-forwarded-host'] || req.headers?.host
  const protocol = req.headers?.['x-forwarded-proto'] || 'https'
  return origin === `${protocol}://${host}` || origin === process.env.FRONTEND_URL
}
