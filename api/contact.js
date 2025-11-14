const https = require('https');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { name, phone, message, from } = req.body || {};
    if (!name || !phone || !message || !from) return res.status(400).json({ error: 'missing_fields' });
    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.CONTACT_EMAIL;
    if (!apiKey || !to) return res.status(500).json({ error: 'server_not_configured' });
    const payload = JSON.stringify({ from: `Dimension Space <no-reply@dimensionspace.app>`, to, subject: `新的联系表单 - ${name}`, html: `<p>发件人邮箱：${from}</p><p>姓名：${name}</p><p>电话：${phone}</p><p>内容：</p><pre>${message}</pre>` });
    const reqOpts = { method: 'POST', hostname: 'api.resend.com', path: '/emails', headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } };
    const apiReq = https.request(reqOpts, (apiRes) => {
      let data = '';
      apiRes.on('data', (c) => data += c);
      apiRes.on('end', () => {
        if (apiRes.statusCode >= 200 && apiRes.statusCode < 300) return res.status(200).json({ ok: true });
        try { const j = JSON.parse(data); return res.status(apiRes.statusCode).json({ error: j?.message || 'send_failed' }); } catch { return res.status(apiRes.statusCode).json({ error: 'send_failed' }); }
      });
    });
    apiReq.on('error', () => res.status(500).json({ error: 'send_failed' }));
    apiReq.write(payload);
    apiReq.end();
  } catch { return res.status(500).json({ error: 'server_error' }); }
}
