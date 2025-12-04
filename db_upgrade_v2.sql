-- 数据库结构升级补丁
-- 修复: net::ERR_ABORTED 问题 (添加 is_deleted 列)
-- 功能: 支持项目工期和费用字段

-- 1. 确保 works 表具有 is_deleted 列 (软删除支持)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'works' AND column_name = 'is_deleted') THEN
        ALTER TABLE works ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 2. 添加 works 表的新字段 (项目工期和费用)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'works' AND column_name = 'duration') THEN
        ALTER TABLE works ADD COLUMN duration TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'works' AND column_name = 'cost') THEN
        ALTER TABLE works ADD COLUMN cost TEXT;
    END IF;
END $$;

-- 3. 确保存储桶 works 存在 (注意: SQL 无法直接创建 Storage Bucket，需在 Dashboard 操作，但可设置策略)
-- 假设 bucket 已创建，这里设置存储策略
-- 允许任何人读取 works 桶
-- 允许 authenticated 用户上传/修改 works 桶

-- (注意：如果表 storage.buckets 不存在，说明未启用 Storage，请忽略此段报错)
BEGIN;
  -- 尝试插入 works bucket 记录 (如果权限允许)
  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('works', 'works', true)
  ON CONFLICT (id) DO NOTHING;
COMMIT;

-- 设置 works 桶的访问策略
CREATE POLICY "Public Access Works" ON storage.objects FOR SELECT USING (bucket_id = 'works');
CREATE POLICY "Admin Upload Works" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'works');
CREATE POLICY "Admin Update Works" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'works');
