-- ============================================
-- Supabase 数据库配置 - 用户评价功能
-- ============================================
-- 此文件包含设置用户评价功能所需的数据库配置
-- 请在 Supabase SQL Editor 中执行以下 SQL 语句

-- 0. 确保 user_profiles 表有 role 列（如果不存在则添加）
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 1. 确保 reviews 表存在（如果不存在则创建）
CREATE TABLE IF NOT EXISTS public.reviews (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    user_id TEXT,
    role TEXT DEFAULT 'User',
    rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    content TEXT NOT NULL,
    image_url TEXT,
    tag TEXT DEFAULT 'Review',
    is_hidden BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false,
    pinned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_reviews_is_deleted ON public.reviews(is_deleted);
CREATE INDEX IF NOT EXISTS idx_reviews_is_hidden ON public.reviews(is_hidden);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_pinned_at ON public.reviews(pinned_at DESC NULLS LAST);

-- 3. 启用 Row Level Security (RLS)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 4. 创建 RLS 策略 - 允许所有人读取未隐藏且未删除的评价
DROP POLICY IF EXISTS "任何人都可以查看已审核的评价" ON public.reviews;
CREATE POLICY "任何人都可以查看已审核的评价"
    ON public.reviews
    FOR SELECT
    USING (is_deleted = false AND is_hidden = false);

-- 5. 创建 RLS 策略 - 允许所有人插入新评价（包括匿名用户）
DROP POLICY IF EXISTS "任何人都可以提交评价" ON public.reviews;
CREATE POLICY "任何人都可以提交评价"
    ON public.reviews
    FOR INSERT
    WITH CHECK (true);

-- 6. 创建 RLS 策略 - 只允许管理员更新和删除评价
-- 注意：这里假设您有管理员角色，如果没有，可以暂时注释掉或修改
DROP POLICY IF EXISTS "管理员可以更新评价" ON public.reviews;
CREATE POLICY "管理员可以更新评价"
    ON public.reviews
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "管理员可以删除评价" ON public.reviews;
CREATE POLICY "管理员可以删除评价"
    ON public.reviews
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

-- 7. 创建存储桶（如果不存在）- 用于存储评价图片
-- 注意：这需要在 Supabase Dashboard 的 Storage 部分手动创建
-- 或者使用以下 SQL（如果支持）：
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('reviews', 'reviews', true)
-- ON CONFLICT (id) DO NOTHING;

-- 8. 设置存储桶策略 - 允许所有人上传图片到 reviews 存储桶
-- 注意：这需要在 Supabase Dashboard 的 Storage > Policies 中设置
-- 或者使用以下 SQL：
DROP POLICY IF EXISTS "任何人都可以上传评价图片" ON storage.objects;
CREATE POLICY "任何人都可以上传评价图片"
    ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'reviews');

DROP POLICY IF EXISTS "任何人都可以查看评价图片" ON storage.objects;
CREATE POLICY "任何人都可以查看评价图片"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'reviews');

-- 9. 创建触发器 - 自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;
CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 验证配置
-- ============================================
-- 执行以下查询来验证配置是否正确：

-- 检查表是否存在
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name = 'reviews';

-- 检查 RLS 是否启用
-- SELECT tablename, rowsecurity FROM pg_tables 
-- WHERE schemaname = 'public' AND tablename = 'reviews';

-- 检查策略是否存在
-- SELECT policyname FROM pg_policies 
-- WHERE tablename = 'reviews';

-- ============================================
-- 注意事项
-- ============================================
-- 1. 如果您的 user_profiles 表没有 role 字段，请先添加：
--    ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
--
-- 2. 存储桶需要在 Supabase Dashboard 中手动创建：
--    - 进入 Storage
--    - 点击 "New bucket"
--    - 名称: reviews
--    - 公开: 是 (Public)
--
-- 3. 如果遇到权限问题，可以临时禁用 RLS 进行测试：
--    ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;
--    （测试完成后记得重新启用）

