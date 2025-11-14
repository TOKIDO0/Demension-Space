module.exports = async (req, res) => {
  try {
    const clientId = process.env.GITHUB_OAUTH_CLIENT_ID
    const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET
    const jwtSecret = process.env.JWT_SECRET
    if (!clientId || !clientSecret || !jwtSecret) return res.status(500).json({ error: 'server_not_configured' })
    const url = new URL(req.url, `http://${req.headers.host}`)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const cookie = req.headers.cookie || ''
    const m = cookie.match(/(?:^|;\s*)oauth_state=([^;]+)/)
    if (!m || m[1] !== state) return res.status(400).json({ error: 'invalid_state' })
    const resp = await fetch('https://github.com/login/oauth/access_token', { method: 'POST', headers: { Accept: 'application/json' }, body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, code }) })
    if (!resp.ok) return res.status(500).json({ error: 'oauth_failed' })
    const json = await resp.json()
    const token = json.access_token
    if (!token) return res.status(500).json({ error: 'oauth_no_token' })
    res.setHeader('Set-Cookie', `gh_token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${3600}`)
    res.writeHead(302, { Location: '/' })
    res.end()
  } catch {
    res.status(500).json({ error: 'oauth_error' })
  }
}
