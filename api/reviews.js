module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  
  try {
    const { name, content, rating, userId, userAvatarUrl } = req.body || {};
    
    if (!content || !rating) {
      return res.status(400).json({ error: 'missing_fields' });
    }
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'server_not_configured' });
    }
    
    // 准备插入数据
    const insertData = {
      name: name || '匿名用户',
      user_id: userId || 'anonymous',
      rating: parseInt(rating) || 5,
      content: content.trim(),
      is_hidden: true, // 默认隐藏，需要管理员审核
      is_deleted: false,
      created_at: new Date().toISOString()
    };
    
    if (userAvatarUrl) {
      insertData.user_avatar_url = userAvatarUrl;
      insertData.image_url = userAvatarUrl;
    }
    
    // 使用服务端密钥插入，绕过 RLS
    const response = await fetch(`${supabaseUrl}/rest/v1/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(insertData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Supabase insert error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'insert_failed',
        message: errorText 
      });
    }
    
    const result = await response.json();
    
    return res.status(200).json({ 
      ok: true, 
      data: Array.isArray(result) ? result[0] : result 
    });
    
  } catch (error) {
    console.error('Review submission error:', error);
    return res.status(500).json({ 
      error: 'server_error',
      message: error.message 
    });
  }
};





