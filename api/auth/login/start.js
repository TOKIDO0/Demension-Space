module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const { email } = req.body || {}
    const emailN = String(email || '').trim().toLowerCase()
    if (!emailN) return res.status(400).json({ error: 'invalid_input' })
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_KEY
    if (supabaseUrl && supabaseKey) {
      const q = new URLSearchParams({ select: 'id' }).toString()
      const orParam = `or=(email.eq.${emailN},email.eq.${email || emailN})`
      const resp = await fetch(`${supabaseUrl}/rest/v1/web_users?${q}&${orParam}`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
      })
      if (!resp.ok) return res.status(500).json({ error: 'check_failed' })
      const json = await resp.json()
      if (!Array.isArray(json) || !json[0]) return res.status(404).json({ error: 'not_found' })
      return res.status(200).json({ ok: true })
    }
    const { getFile } = require('../../_lib/github')
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
