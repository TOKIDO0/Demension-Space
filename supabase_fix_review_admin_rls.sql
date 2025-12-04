-- ============================================
-- 修复后台评价管理面板无法查看所有评价的问题
-- ============================================
-- 此 SQL 用于修复管理员在后台无法查看所有评价（包括待审核的隐藏评价）的问题
-- 请在 Supabase SQL Editor 中执行

-- 1. 删除旧的策略（如果存在）
DROP POLICY IF EXISTS "管理员可以查看所有评价" ON public.reviews;

-- 2. 创建新的策略：允许管理员查看所有评价（包括隐藏和已删除的）
-- 注意：此策略会检查 user_profiles 表中的 role 字段是否为 'admin'
CREATE POLICY "管理员可以查看所有评价"
ON public.reviews
FOR SELECT
USING (
    -- 如果是管理员，可以查看所有评价（包括隐藏和已删除的）
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
    OR
    -- 如果不是管理员，只能查看未删除且未隐藏的评价（前台显示）
    (is_deleted = false AND is_hidden = false)
);

-- 3. 确保管理员可以更新和删除评价
DROP POLICY IF EXISTS "管理员可以管理所有评价" ON public.reviews;
CREATE POLICY "管理员可以管理所有评价"
ON public.reviews
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
);

-- 4. 验证：检查当前用户是否为管理员
-- 如果您的用户还不是管理员，请执行以下 SQL（将 YOUR_USER_EMAIL 替换为您的邮箱）：
-- UPDATE public.user_profiles 
-- SET role = 'admin' 
-- WHERE email = 'YOUR_USER_EMAIL';

-- 5. 如果 user_profiles 表不存在或没有 role 列，执行以下 SQL：
-- ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
-- 然后手动将您的用户角色设置为 'admin'

