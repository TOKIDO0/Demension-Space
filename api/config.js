module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
    if (!supabaseUrl || !supabaseAnonKey) return res.status(500).json({ error: 'server_not_configured' });
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ supabaseUrl, supabaseAnonKey });
  } catch {
    return res.status(500).json({ error: 'config_failed' });
  }
}
