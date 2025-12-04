-- ============================================
-- 修复 reviews 表缺少 user_id 列的问题
-- ============================================
-- 如果 reviews 表已经存在但没有 user_id 列，执行此 SQL 添加该列

-- 添加 user_id 列（如果不存在）
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS user_id TEXT;

-- 如果表中有旧的 'user' 列，可以将其数据迁移到 user_id 列后删除
-- 注意：只有在确认需要迁移数据时才执行以下语句
-- UPDATE public.reviews SET user_id = "user" WHERE user_id IS NULL AND "user" IS NOT NULL;
-- ALTER TABLE public.reviews DROP COLUMN IF EXISTS "user";

-- 验证列是否已添加
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
-- AND table_name = 'reviews' 
-- AND column_name = 'user_id';

-- 注意：执行此 SQL 后，可能需要刷新 Supabase 的 schema cache
-- 如果问题仍然存在，请尝试：
-- 1. 在 Supabase Dashboard 中刷新页面
-- 2. 或者等待几分钟让 schema cache 自动更新


