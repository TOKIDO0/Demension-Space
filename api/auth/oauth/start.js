module.exports = async (req, res) => {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID
  const redirectUri = process.env.OAUTH_REDIRECT_URI
  const state = Math.random().toString(36).slice(2)
  if (!clientId || !redirectUri) return res.status(500).json({ error: 'server_not_configured' })
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo&state=${state}`
  res.setHeader('Set-Cookie', `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`)
  res.writeHead(302, { Location: url })
  res.end()
}
