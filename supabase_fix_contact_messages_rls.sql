-- ============================================
-- 修复后台留言管理面板无法查看留言的问题
-- ============================================
-- 此 SQL 用于修复管理员在后台无法查看留言的问题
-- 请在 Supabase SQL Editor 中执行

-- 1. 删除旧的策略（如果存在）
DROP POLICY IF EXISTS "Allow authenticated select access" ON public.contact_messages;
DROP POLICY IF EXISTS "管理员可以查看所有留言" ON public.contact_messages;

-- 2. 创建新的策略：允许管理员查看所有留言
CREATE POLICY "管理员可以查看所有留言"
ON public.contact_messages
FOR SELECT
USING (
    -- 如果是管理员，可以查看所有留言
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid()
        AND (user_profiles.role = 'admin' OR user_profiles.is_admin = true)
    )
    OR
    -- 允许认证用户查看（用于后台管理）
    auth.role() = 'authenticated'
);

-- 3. 确保管理员可以更新和删除留言
DROP POLICY IF EXISTS "管理员可以管理所有留言" ON public.contact_messages;
CREATE POLICY "管理员可以管理所有留言"
ON public.contact_messages
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid()
        AND (user_profiles.role = 'admin' OR user_profiles.is_admin = true)
    )
    OR
    auth.role() = 'authenticated'
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid()
        AND (user_profiles.role = 'admin' OR user_profiles.is_admin = true)
    )
    OR
    auth.role() = 'authenticated'
);

-- 4. 确保 contact_messages_trash 表也有相同的策略
DROP POLICY IF EXISTS "管理员可以查看回收站留言" ON public.contact_messages_trash;
CREATE POLICY "管理员可以查看回收站留言"
ON public.contact_messages_trash
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid()
        AND (user_profiles.role = 'admin' OR user_profiles.is_admin = true)
    )
    OR
    auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "管理员可以管理回收站留言" ON public.contact_messages_trash;
CREATE POLICY "管理员可以管理回收站留言"
ON public.contact_messages_trash
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid()
        AND (user_profiles.role = 'admin' OR user_profiles.is_admin = true)
    )
    OR
    auth.role() = 'authenticated'
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid()
        AND (user_profiles.role = 'admin' OR user_profiles.is_admin = true)
    )
    OR
    auth.role() = 'authenticated'
);

