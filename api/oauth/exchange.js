export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  const { code } = req.body
  if (!code) return res.status(400).json({ error: 'no_code' })

  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      })
    })
    const data = await response.json()
    if (data.error || !data.access_token) {
      return res.status(400).json({ error: data.error_description || data.error || 'no_token' })
    }
    res.json({ token: data.access_token })
  } catch {
    res.status(500).json({ error: 'server_error' })
  }
}
