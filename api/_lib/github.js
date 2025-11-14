async function getFile(owner, repo, branch, path, token) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } })
  if (resp.status === 404) return null
  if (!resp.ok) throw new Error(`GitHub getFile ${resp.status}`)
  const json = await resp.json()
  return json
}

async function putFile(owner, repo, branch, path, content, message, token, sha) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`
  const body = { message, content: Buffer.from(content).toString('base64'), branch }
  if (sha) body.sha = sha
  const resp = await fetch(url, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }, body: JSON.stringify(body) })
  if (!resp.ok) throw new Error(`GitHub putFile ${resp.status}`)
  return await resp.json()
}

module.exports = { getFile, putFile }
