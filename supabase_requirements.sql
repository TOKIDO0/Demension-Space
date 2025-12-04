-- 复制以下所有 SQL 代码并在 Supabase 的 SQL Editor 中运行 --

-- 1. 允许 'deleted_works' 表的所有操作 (解决归档权限错误) --
ALTER TABLE "public"."deleted_works" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for public" ON "public"."deleted_works"
FOR ALL USING (true) WITH CHECK (true);

-- 2. 允许 'contact_messages_trash' 表的所有操作 (解决留言删除权限错误) --
ALTER TABLE "public"."contact_messages_trash" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for public" ON "public"."contact_messages_trash"
FOR ALL USING (true) WITH CHECK (true);

-- 3. 允许 'works' 表的更新操作 (解决编辑保存报错) --
CREATE POLICY "Enable update for public" ON "public"."works"
FOR UPDATE USING (true) WITH CHECK (true);

-- 4. 添加可能缺失的字段 (解决 'Could not find cost column' 报错) --
ALTER TABLE "public"."works" ADD COLUMN IF NOT EXISTS "cost" text;
ALTER TABLE "public"."works" ADD COLUMN IF NOT EXISTS "duration" text;

ALTER TABLE "public"."deleted_works" ADD COLUMN IF NOT EXISTS "cost" text;
ALTER TABLE "public"."deleted_works" ADD COLUMN IF NOT EXISTS "duration" text;
ALTER TABLE "public"."deleted_works" ADD COLUMN IF NOT EXISTS "original_id" bigint;

ALTER TABLE "public"."contact_messages_trash" ADD COLUMN IF NOT EXISTS "original_id" bigint;

-- 5. (可选) 如果上述执行后仍有权限问题，可尝试运行以下重置命令 --
-- DROP POLICY IF EXISTS "Enable all for public" ON "public"."deleted_works";
-- CREATE POLICY "Enable all for public" ON "public"."deleted_works" FOR ALL USING (true) WITH CHECK (true);
