-- 创建联系人消息表
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 开启行级安全策略 (RLS)
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许任何人（匿名用户）插入数据
CREATE POLICY "Allow public insert access" 
ON public.contact_messages 
FOR INSERT 
TO public 
WITH CHECK (true);

-- 创建策略：仅允许认证用户（管理员/后台）查看数据
-- 注意：这里假设后续会有管理员登录机制，或者您在 Dashboard 查看
CREATE POLICY "Allow authenticated select access" 
ON public.contact_messages 
FOR SELECT 
TO authenticated 
USING (true);

-- 为了方便开发调试，暂时允许匿名读取（可选，正式上线建议关闭）
-- CREATE POLICY "Allow public select access" ON public.contact_messages FOR SELECT TO public USING (true);
