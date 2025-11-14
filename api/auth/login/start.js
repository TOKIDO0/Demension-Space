const { getFile } = require('../../_lib/github')

async function supabaseGetByEmail(url, serviceKey, emailLower, emailOrig) {
  const orParam = `or=(email.eq.${emailLower},email.eq.${emailOrig || emailLower})`
  const q = new URLSearchParams({ select: 'id' }).toString()
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
    const { email } = req.body || {}
    const emailN = String(email || '').trim().toLowerCase()
    if (!emailN) return res.status(400).json({ error: 'invalid_input' })
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_KEY
    if (supabaseUrl && supabaseServiceKey) {
      const existing = await supabaseGetByEmail(supabaseUrl, supabaseServiceKey, emailN, email)
      if (!existing) return res.status(404).json({ error: 'not_found' })
      return res.status(200).json({ ok: true })
    }
    const owner = process.env.GITHUB_OWNER
    const repo = process.env.GITHUB_REPO
    const branch = process.env.GITHUB_BRANCH || 'main'
    const token = process.env.GITHUB_TOKEN
    if (!owner || !repo || !token) return res.status(500).json({ error: 'server_not_configured' })
    const id = Buffer.from(`${emailN}`).toString('base64url')
    const path = `users/${id}.json`
    const existing = await getFile(owner, repo, branch, path, token)
    if (!existing) return res.status(404).json({ error: 'not_found' })
    return res.status(200).json({ ok: true })
  } catch {
    return res.status(500).json({ error: 'check_failed' })
  }
}
