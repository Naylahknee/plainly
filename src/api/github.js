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

export async function getRepoInfo(token, owner, repo) {
  const r = await fetch(`${API}/repos/${owner}/${repo}`, { headers: headers(token) })
  if (!r.ok) return null
  return r.json()
}

export async function getUser(token) {
  const r = await fetch(`${API}/user`, { headers: headers(token) })
  if (!r.ok) throw new Error('Could not load your account.')
  return r.json()
}

export async function getRepos(token) {
  const r = await fetch(`${API}/user/repos?sort=updated&per_page=100&affiliation=owner`, {
    headers: headers(token)
  })
  if (!r.ok) throw new Error('Could not load your projects. Try refreshing the page.')
  return r.json()
}

export async function createRepo(token, name) {
  const r = await fetch(`${API}/user/repos`, {
    method: 'POST',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, auto_init: true, private: true })
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

export async function deleteFile(token, owner, repo, path, sha, message) {
  const r = await fetch(`${API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
    method: 'DELETE',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sha })
  })
  if (!r.ok) throw new Error('Could not delete this file. Try again.')
  return r.json()
}

export async function createFileWithContent(token, owner, repo, path, content, message) {
  const r = await fetch(`${API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
    method: 'PUT',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content: toBase64(content) })
  })
  if (r.status === 422) throw new Error('A file with that name already exists.')
  if (!r.ok) throw new Error('Could not create the file. Try again.')
  return r.json()
}

export async function updateRepoSettings(token, owner, repo, settings) {
  const r = await fetch(`${API}/repos/${owner}/${repo}`, {
    method: 'PATCH',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  })
  if (!r.ok) throw new Error('Could not update project settings. Try again.')
  return r.json()
}

export async function deleteRepo(token, owner, repo) {
  const r = await fetch(`${API}/repos/${owner}/${repo}`, {
    method: 'DELETE',
    headers: headers(token)
  })
  if (!r.ok) throw new Error('Could not delete the project. Try again.')
}

/**
 * Get the current HEAD SHA for the repo's default branch
 */
export async function getCurrentHeadSha(token, owner, repo) {
  const r = await fetch(`${API}/repos/${owner}/${repo}`, { headers: headers(token) })
  if (!r.ok) throw new Error('Could not get repo info.')
  const data = await r.json()
  const branch = data.default_branch || 'main'

  const br = await fetch(`${API}/repos/${owner}/${repo}/branches/${branch}`, { headers: headers(token) })
  if (!br.ok) throw new Error('Could not get branch info.')
  const branchData = await br.json()
  return branchData.commit.sha
}

/**
 * Compare two commits and return files that changed between them
 * Returns: { filesChanged: number, commitCount: number, commits: [] }
 */
export async function compareCommits(token, owner, repo, baseSha, headSha) {
  if (!baseSha || !headSha) return { filesChanged: 0, commitCount: 0, commits: [] }
  if (baseSha === headSha) return { filesChanged: 0, commitCount: 0, commits: [] }

  try {
    const r = await fetch(
      `${API}/repos/${owner}/${repo}/compare/${baseSha}...${headSha}`,
      { headers: headers(token) }
    )
    if (!r.ok) return { filesChanged: 0, commitCount: 0, commits: [] }

    const data = await r.json()
    return {
      filesChanged: data.files?.length || 0,
      commitCount: data.commits?.length || 0,
      commits: data.commits || [],
      files: data.files || []
    }
  } catch {
    throw new Error('Could not compare commits.')
  }
}

/**
 * Get commit details including author
 */
export async function getCommitDetails(token, owner, repo, sha) {
  try {
    const r = await fetch(`${API}/repos/${owner}/${repo}/commits/${sha}`, { headers: headers(token) })
    if (!r.ok) throw new Error('Could not get commit details.')
    return r.json()
  } catch {
    return null
  }
}

/**
 * Everything in a folder — files *and* folders, nothing filtered out.
 *
 * getFiles() above keeps its text-file filter for the editor's file list.
 * This is what the Project Files screen and the AI handoff use, because the
 * design shows folders (HANDOFF §7.14).
 */
export async function getContents(token, owner, repo, path = '') {
  const url = path
    ? `${API}/repos/${owner}/${repo}/contents/${path.split('/').map(encodeURIComponent).join('/')}`
    : `${API}/repos/${owner}/${repo}/contents`
  const r = await fetch(url, { headers: headers(token) })
  if (r.status === 404) return []
  if (!r.ok) throw new Error('Could not load the files in this project. Try refreshing the page.')
  const all = await r.json()
  if (!Array.isArray(all)) return []
  // Folders first, then files, each alphabetically — the order the design shows.
  return all.sort((a, b) =>
    a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1
  )
}

/**
 * Recent Save Points (commits) on the project's main version.
 */
export async function getCommits(token, owner, repo, perPage = 20) {
  const r = await fetch(
    `${API}/repos/${owner}/${repo}/commits?per_page=${perPage}`,
    { headers: headers(token) }
  )
  if (r.status === 404 || r.status === 409) return []   // 409 = empty repository
  if (!r.ok) throw new Error('Could not load the Save Points for this project.')
  const data = await r.json()
  return Array.isArray(data) ? data : []
}
