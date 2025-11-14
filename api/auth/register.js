const { getFile, putFile } = require('../_lib/github')
const { encryptJson } = require('../_lib/crypto')
const bcrypt = require('bcryptjs')

async function supabaseInsertUser(url, serviceKey, record) {
  const resp = await fetch(`${url}/rest/v1/web_users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(record)
  })
  if (!resp.ok) throw new Error(`supabase_insert ${resp.status}`)
  const json = await resp.json()
  return json && json[0]
}

async function supabaseGetByEmail(url, serviceKey, emailLower, emailOrig) {
  const q = new URLSearchParams({ select: 'id' }).toString()
  const orParam = `or=(email.eq.${emailLower},email.eq.${emailOrig || emailLower})`
  const resp = await fetch(`${url}/rest/v1/web_users?${q}&${orParam}`, {
    headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` }
  })
  if (!resp.ok) throw new Error(`supabase_get ${resp.status}`)
  const json = await resp.json()
  return Array.isArray(json) && json[0] ? json[0] : null
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const { email, password, username, phone } = req.body || {}
    const emailN = String(email || '').trim().toLowerCase()
    if (!emailN || !password || !username) return res.status(400).json({ error: 'invalid_input' })
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_KEY
    if (supabaseUrl && supabaseServiceKey) {
      const existing = await supabaseGetByEmail(supabaseUrl, supabaseServiceKey, emailN, email)
      if (existing) return res.status(409).json({ error: 'user_already_exists' })
      const password_hash = bcrypt.hashSync(password, 12)
      const row = await supabaseInsertUser(supabaseUrl, supabaseServiceKey, { email: emailN, username, phone, password_hash })
      return res.status(200).json({ ok: true, user: { id: row.id, email: emailN } })
    }
    const owner = process.env.GITHUB_OWNER
    const repo = process.env.GITHUB_REPO
    const branch = process.env.GITHUB_BRANCH || 'main'
    const token = process.env.GITHUB_TOKEN
    const encKey = process.env.USER_DATA_ENC_KEY
    if (!owner || !repo || !token || !encKey) return res.status(500).json({ error: 'server_not_configured' })
    const id = Buffer.from(`${emailN}`).toString('base64url')
    const path = `users/${id}.json`
    const existing = await getFile(owner, repo, branch, path, token)
    if (existing) return res.status(409).json({ error: 'user_already_exists' })
    const password_hash = bcrypt.hashSync(password, 12)
    const record = { id, email: emailN, username, phone, password_hash, created_at: new Date().toISOString(), failed_login_attempts: 0, status: 'active' }
    const bundle = encryptJson(record, encKey)
    const content = JSON.stringify({ enc: true, ...bundle })
    await putFile(owner, repo, branch, path, content, `register ${emailN}`, token)
    return res.status(200).json({ ok: true })
  } catch (e) {
    return res.status(500).json({ error: 'register_failed' })
  }
}
