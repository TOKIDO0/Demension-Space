-- ============================================
-- 修复 reviews 表缺少 image_url 列的问题
-- ============================================
-- 如果 reviews 表已经存在但没有 image_url 列，执行此 SQL 添加该列

-- 添加 image_url 列（如果不存在）
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 验证列是否已添加
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
-- AND table_name = 'reviews' 
-- AND column_name = 'image_url';

-- 注意：执行此 SQL 后，可能需要刷新 Supabase 的 schema cache
-- 如果问题仍然存在，请尝试：
-- 1. 在 Supabase Dashboard 中刷新页面
-- 2. 或者等待几分钟让 schema cache 自动更新


