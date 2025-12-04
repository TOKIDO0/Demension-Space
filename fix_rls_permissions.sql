-- 修复前端“精选作品”不显示的问题
-- 请在 Supabase SQL 编辑器中运行此脚本

-- 1. 确保 works 表启用了行级安全策略 (RLS)
ALTER TABLE works ENABLE ROW LEVEL SECURITY;

-- 2. 删除旧策略（防止冲突）
DROP POLICY IF EXISTS "Public works are visible to everyone" ON works;
DROP POLICY IF EXISTS "User can view all public works" ON works;

-- 3. 创建新的公共访问策略
-- 允许任何人（包括未登录用户）查看 is_hidden 为 false 的作品
-- 同时也确保未被标记为删除的作品可见 (兼容 NULL 值)
CREATE POLICY "Public works are visible to everyone" 
ON works FOR SELECT 
USING (
    is_hidden = false 
    AND (is_deleted = false OR is_deleted IS NULL)
);

-- 4. 确保 deleted_works 表允许 authenticated 用户（管理员）操作
ALTER TABLE deleted_works ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert into deleted_works" 
ON deleted_works FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update deleted_works" 
ON deleted_works FOR UPDATE
TO authenticated 
USING (true);

-- 5. 确保 contact_messages_trash 表允许 authenticated 用户操作
ALTER TABLE contact_messages_trash ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert into contact_messages_trash" 
ON contact_messages_trash FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update contact_messages_trash" 
ON contact_messages_trash FOR UPDATE
TO authenticated 
USING (true);
