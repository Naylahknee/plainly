/**
 * api/_lib/oauth.js — the two calls that need the OAuth App's client secret.
 *
 * Both run server-side only. The secret must never reach the browser bundle,
 * which is the whole reason these endpoints exist instead of the frontend
 * talking to GitHub directly.
 *
 * Imported by the Vercel functions in api/oauth/ and by server.js for local
 * development, so the two environments can't drift apart. Vercel ignores
 * underscore-prefixed paths inside api/, so this is a module, not a route.
 */

const TOKEN_URL = 'https://github.com/login/oauth/access_token'
const API = 'https://api.github.com'

function credentials() {
  const id = process.env.GITHUB_CLIENT_ID
  const secret = process.env.GITHUB_CLIENT_SECRET
  if (!id || !secret) throw new Error('missing_oauth_config')
  return { id, secret }
}

/**
 * Trade the one-time code GitHub sent back for an access token.
 * Throws with a GitHub-supplied reason when GitHub refuses.
 */
export async function exchangeCode(code) {
  const { id, secret } = credentials()

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ client_id: id, client_secret: secret, code }),
  })
  const data = await response.json()

  if (data.error || !data.access_token) {
    throw new Error(data.error_description || data.error || 'no_token')
  }
  return data.access_token
}

/**
 * Revoke the whole authorization, not just this token.
 *
 * Deleting the *grant* removes GitHub's record that this account approved
 * Plainly, so the next sign-in shows the authorize screen again. Deleting the
 * *token* alone would leave the grant in place and the next sign-in would be
 * silent — which is exactly the behaviour this is here to fix.
 *
 * Returns true when the account no longer has a grant, which includes the case
 * where GitHub says there was never one (404): same outcome for the user.
 */
export async function revokeGrant(token) {
  const { id, secret } = credentials()
  const basic = Buffer.from(`${id}:${secret}`).toString('base64')

  const response = await fetch(`${API}/applications/${id}/grant`, {
    method: 'DELETE',
    headers: {
      Authorization: `Basic ${basic}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ access_token: token }),
  })

  return response.status === 204 || response.status === 404
}
