const { getFile, putFile } = require('../_lib/github')
const { decryptJson, encryptJson } = require('../_lib/crypto')
const { sign } = require('../_lib/jwt')
const bcrypt = require('bcryptjs')

async function supabaseGetUser(url, serviceKey, email) {
  const q = new URLSearchParams({ email: `eq.${email}`, select: '*' }).toString()
  const resp = await fetch(`${url}/rest/v1/web_users?${q}`, {
    headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` }
  })
  if (!resp.ok) throw new Error(`supabase_get ${resp.status}`)
  const json = await resp.json()
  return Array.isArray(json) && json[0] ? json[0] : null
}

async function supabaseUpdate(url, serviceKey, id, patch) {
  const q = new URLSearchParams({ id: `eq.${id}` }).toString()
  const resp = await fetch(`${url}/rest/v1/web_users?${q}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(patch)
  })
  if (!resp.ok) throw new Error(`supabase_update ${resp.status}`)
  const json = await resp.json()
  return Array.isArray(json) && json[0] ? json[0] : null
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const { email, password } = req.body || {}
    if (!email || !password) return res.status(400).json({ error: 'invalid_input' })
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE
    const jwtSecret = process.env.JWT_SECRET
    const maxFails = parseInt(process.env.LOGIN_FAIL_LIMIT || '5', 10)
    if (supabaseUrl && supabaseServiceKey && jwtSecret) {
      const row = await supabaseGetUser(supabaseUrl, supabaseServiceKey, email)
      if (!row) return res.status(404).json({ error: 'not_registered' })
      if ((row.failed_login_attempts || 0) >= maxFails) return res.status(429).json({ error: 'too_many_attempts' })
      const ok = bcrypt.compareSync(password, row.password_hash)
      if (!ok) {
        const upd = await supabaseUpdate(supabaseUrl, supabaseServiceKey, row.id, { failed_login_attempts: (row.failed_login_attempts || 0) + 1 })
        return res.status(401).json({ error: 'invalid_credentials' })
      }
      const upd = await supabaseUpdate(supabaseUrl, supabaseServiceKey, row.id, { failed_login_attempts: 0, last_login: new Date().toISOString() })
      const jwt = sign({ id: row.id, email: row.email, username: row.username }, jwtSecret, '7d')
      res.setHeader('Set-Cookie', `ds_session=${jwt}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${7*24*3600}`)
      return res.status(200).json({ user: { id: row.id, email: row.email } })
    }
    const owner = process.env.GITHUB_OWNER
    const repo = process.env.GITHUB_REPO
    const branch = process.env.GITHUB_BRANCH || 'main'
    const token = process.env.GITHUB_TOKEN
    const encKey = process.env.USER_DATA_ENC_KEY
    if (!owner || !repo || !token || !encKey || !jwtSecret) return res.status(500).json({ error: 'server_not_configured' })
    const id = Buffer.from(`${email}`).toString('base64url')
    const path = `users/${id}.json`
    const existing = await getFile(owner, repo, branch, path, token)
    if (!existing) return res.status(404).json({ error: 'not_registered' })
    const dataText = Buffer.from(existing.content, 'base64').toString()
    const dataJson = JSON.parse(dataText)
    const record = decryptJson(dataJson, encKey)
    if (record.failed_login_attempts >= maxFails) return res.status(429).json({ error: 'too_many_attempts' })
    const ok = bcrypt.compareSync(password, record.password_hash)
    if (!ok) {
      record.failed_login_attempts = (record.failed_login_attempts || 0) + 1
      const contentNew = JSON.stringify(encryptJson(record, encKey))
      await putFile(owner, repo, branch, path, contentNew, `login_fail ${email}`, token, existing.sha)
      return res.status(401).json({ error: 'invalid_credentials' })
    }
    record.failed_login_attempts = 0
    const contentNew = JSON.stringify(encryptJson(record, encKey))
    await putFile(owner, repo, branch, path, contentNew, `login_ok ${email}`, token, existing.sha)
    const jwt = sign({ id: record.id, email: record.email, username: record.username }, jwtSecret, '7d')
    res.setHeader('Set-Cookie', `ds_session=${jwt}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${7*24*3600}`)
    return res.status(200).json({ user: { id: record.id, email: record.email } })
  } catch {
    return res.status(500).json({ error: 'login_failed' })
  }
}
