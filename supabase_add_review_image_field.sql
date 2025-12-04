-- ============================================
-- 为 reviews 表添加项目返图字段
-- ============================================
-- 此 SQL 用于将评价的"项目返图"和"用户头像"分开存储
-- 请在 Supabase SQL Editor 中执行

-- 1. 添加新字段用于存储项目返图（与用户头像分开）
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS project_image_url TEXT;

-- 2. 将现有的 image_url 数据迁移到 project_image_url（如果 image_url 存在且不是用户头像）
-- 注意：这个迁移需要根据实际情况调整，如果 image_url 中存储的是项目返图，则迁移
-- 如果 image_url 中存储的是用户头像，则不需要迁移

-- 3. 添加新字段用于存储用户头像URL
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS user_avatar_url TEXT;

-- 4. 说明：
--    - project_image_url: 存储用户上传的"项目返图"
--    - user_avatar_url: 存储用户的个人头像（从 user_profiles 表获取）
--    - image_url: 保留用于向后兼容，但新代码应该使用 user_avatar_url 和 project_image_url

