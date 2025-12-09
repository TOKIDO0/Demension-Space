# Supabase 配置要求

## 问题说明
作品和评价展示板块没有内容显示，需要配置 Supabase 的 RLS（行级安全）策略。

## 需要配置的 RLS 策略

### 1. `works` 表的 RLS 策略

需要允许匿名用户（anon）查询未删除且未隐藏的作品：

```sql
-- 允许匿名用户查询未删除且未隐藏的作品
CREATE POLICY "允许匿名用户查询公开作品"
ON works
FOR SELECT
TO anon
USING (is_deleted = false AND is_hidden = false);
```

### 2. `reviews` 表的 RLS 策略

需要允许匿名用户查询未删除且未隐藏的评价：

```sql
-- 允许匿名用户查询未删除且未隐藏的评价
CREATE POLICY "允许匿名用户查询公开评价"
ON reviews
FOR SELECT
TO anon
USING (is_deleted = false AND is_hidden = false);
```

### 3. `user_profiles` 表的 RLS 策略（如果需要）

如果需要查询用户头像，需要允许匿名用户查询：

```sql
-- 允许匿名用户查询用户头像
CREATE POLICY "允许匿名用户查询用户头像"
ON user_profiles
FOR SELECT
TO anon
USING (true);
```

## 检查步骤

1. 确认 RLS 已启用：
   - 在 Supabase Dashboard 中，进入 Table Editor
   - 选择 `works` 表，点击 "Policies" 标签
   - 确认 RLS 已启用（Enable RLS）

2. 确认数据存在：
   - 检查 `works` 表中是否有数据
   - 确认数据的 `is_deleted` 和 `is_hidden` 字段值
   - 至少需要有一条 `is_deleted = false` 且 `is_hidden = false` 的记录

3. 检查 `reviews` 表：
   - 同样检查 `reviews` 表的数据和 RLS 策略
   - 确认有 `is_deleted = false` 且 `is_hidden = false` 的记录

## 如果使用 Supabase AI 助手

可以直接发送以下内容给 Supabase AI：

```
请为我的 Supabase 项目配置以下 RLS 策略：

1. works 表：允许匿名用户（anon）查询 is_deleted = false 且 is_hidden = false 的记录
2. reviews 表：允许匿名用户（anon）查询 is_deleted = false 且 is_hidden = false 的记录
3. user_profiles 表：允许匿名用户（anon）查询所有记录（用于获取用户头像）

请确保这些策略已正确创建并启用。
```

## 注意事项

- 如果数据表中没有数据，即使策略配置正确也不会显示内容
- 新提交的评价默认 `is_hidden = true`，需要管理员在后台审核通过后才会显示
- 确保存储桶 `reviews` 的权限配置正确，允许匿名用户读取图片



