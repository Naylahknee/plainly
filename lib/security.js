const buckets = new Map()

export function requireJson(req, res) {
  if (!String(req.headers?.['content-type'] || '').toLowerCase().startsWith('application/json')) {
    res.status(415).json({ error: 'json_required' })
    return false
  }
  return true
}

export function limit(req, res, { max, windowMs }) {
  const forwarded = String(req.headers?.['x-forwarded-for'] || '').split(',')[0].trim()
  const key = `${req.url}:${forwarded || req.socket?.remoteAddress || 'unknown'}`
  const now = Date.now()
  const current = buckets.get(key)
  const bucket = !current || current.resetAt <= now ? { count: 0, resetAt: now + windowMs } : current
  bucket.count += 1
  buckets.set(key, bucket)
  res.setHeader('RateLimit-Limit', max)
  res.setHeader('RateLimit-Remaining', Math.max(0, max - bucket.count))
  if (bucket.count <= max) return true
  res.setHeader('Retry-After', Math.ceil((bucket.resetAt - now) / 1000))
  res.status(429).json({ error: 'too_many_requests' })
  return false
}

export function hasSafeSize(value, max = 8192) {
  return typeof value === 'string' && value.length > 0 && value.length <= max
}
