const { verify } = require('../_lib/jwt')

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).end()
  try {
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) return res.status(500).json({ error: 'server_not_configured' })
    const cookie = req.headers.cookie || ''
    const m = cookie.match(/(?:^|;\s*)ds_session=([^;]+)/)
    if (!m) return res.status(401).json({ error: 'unauthorized' })
    const data = verify(m[1], jwtSecret)
    if (!data) return res.status(401).json({ error: 'unauthorized' })
    return res.status(200).json({ user: { id: data.id, email: data.email, username: data.username } })
  } catch {
    return res.status(500).json({ error: 'me_failed' })
  }
}
