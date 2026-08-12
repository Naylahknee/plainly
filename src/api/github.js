const API = 'https://api.github.com'

function headers(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  }
}

function toBase64(str) {
  const bytes = new TextEncoder().encode(str)
  const binString = Array.from(bytes, b => String.fromCharCode(b)).join('')
  return btoa(binString)
}

function fromBase64(b64) {
  const binString = atob(b64.replace(/\s/g, ''))
  const bytes = Uint8Array.from(binString, c => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export async function getUser(token) {
  const r = await fetch(`${API}/user`, { headers: headers(token) })
  if (!r.ok) throw new Error('Could not load your account.')
  return r.json()
}

export async function getRepos(token) {
  const r = await fetch(
    `${API}/user/repos?sort=updated&per_page=100&affiliation=owner,organization_member,collaborator`,
    { headers: headers(token) }
  )
  if (!r.ok) throw new Error('Could not load your projects. Try refreshing the page.')
  return r.json()
}

export async function createRepo(token, name) {
  const r = await fetch(`${API}/user/repos`, {
    method: 'POST',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, auto_init: true, private: false })
  })
  if (r.status === 422) throw new Error('A project with that name already exists. Try a different name.')
  if (!r.ok) throw new Error('Could not create the project. Try again.')
  return r.json()
}

const TEXT_EXTENSIONS = ['.txt', '.md', '.markdown', '.mdx', '.text', '.rst']

export async function getFiles(token, owner, repo) {
  const r = await fetch(`${API}/repos/${owner}/${repo}/contents`, { headers: headers(token) })
  if (r.status === 404) return []
  if (!r.ok) throw new Error('Could not load the files in this project. Try refreshing the page.')
  const all = await r.json()
  if (!Array.isArray(all)) return []
  return all.filter(f => f.type === 'file' && TEXT_EXTENSIONS.some(ext => f.name.toLowerCase().endsWith(ext)))
}

export async function getFileContent(token, owner, repo, path) {
  const r = await fetch(`${API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
    headers: headers(token)
  })
  if (!r.ok) throw new Error('Could not open this file. Try again.')
  const data = await r.json()
  return { content: fromBase64(data.content), sha: data.sha }
}

export async function saveFile(token, owner, repo, path, content, sha, message) {
  const r = await fetch(`${API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
    method: 'PUT',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content: toBase64(content), sha })
  })
  if (r.status === 409) {
    throw new Error("This didn't save because the file changed somewhere else. Open it again to see the latest version.")
  }
  if (!r.ok) throw new Error('Could not save. Try again.')
  return r.json()
}

export async function createFile(token, owner, repo, path) {
  const r = await fetch(`${API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
    method: 'PUT',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: `Created ${path}`, content: toBase64('') })
  })
  if (r.status === 422) throw new Error('A file with that name already exists.')
  if (!r.ok) throw new Error('Could not create the file. Try again.')
  return r.json()
}

export async function getFileHistory(token, owner, repo, path) {
  const r = await fetch(
    `${API}/repos/${owner}/${repo}/commits?path=${encodeURIComponent(path)}&per_page=50`,
    { headers: headers(token) }
  )
  if (!r.ok) throw new Error('Could not load the history for this file. Try refreshing.')
  return r.json()
}

export async function getFileAtCommit(token, owner, repo, path, sha) {
  const r = await fetch(
    `${API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${sha}`,
    { headers: headers(token) }
  )
  if (!r.ok) throw new Error('Could not load that version of the file.')
  const data = await r.json()
  return fromBase64(data.content)
}
