# 给 Gemini 的提示：生成"精选作品"板块代码

请使用以下要求生成一个"精选作品"（Featured Works）板块的 React 组件代码：

## 技术栈要求
- **框架**: React 18 (使用 hooks: useState, useEffect)
- **样式**: Tailwind CSS (使用 className)
- **图标**: 使用简单的 emoji 或文本图标（不要依赖外部图标库）
- **数据源**: Supabase (从 `works` 表获取数据)

## 功能要求
1. **数据获取**:
   - 从 Supabase 的 `works` 表获取数据
   - 过滤条件：`is_deleted = false` 且 `is_hidden = false`
   - 排序：优先按 `pinned_at` 降序，然后按 `created_at` 降序
   - 限制：最多显示 18 条

2. **数据字段映射**:
   - `title` → 项目标题
   - `image_url` 或 `image_urls` → 图片（如果是字符串用逗号分隔，需要转换为数组）
   - `description` → 项目描述
   - `location` → 施工地点
   - `created_at` → 日期
   - `size` → 面积
   - `cost` → 成本

3. **UI 设计要求**:
   - 深色主题（背景色：#0a0a14）
   - 使用渐变和光效（紫色到青色）
   - 响应式网格布局（移动端1列，平板2列，桌面3列）
   - 每个作品卡片包含：
     - 图片（支持多图轮播或显示第一张）
     - 标题
     - 简短描述
     - 悬停效果（放大、光效）
   - 点击卡片可以打开详情模态框（显示完整信息）

4. **样式要求**:
   - 背景透明（`bg-transparent`）
   - 使用玻璃态效果（backdrop-blur）
   - 紫色/青色渐变边框和光效
   - 平滑的过渡动画

5. **代码要求**:
   - 组件名：`PortfolioSection`
   - 挂载点：`<div id="portfolio-root"></div>`
   - 必须导出到 `window.PortfolioSection` 供外部调用
   - 包含加载状态和空状态处理
   - 错误处理要完善

6. **Supabase 客户端获取方式**:
```javascript
let sb = null;
try { 
  if (typeof getSupabaseClient === 'function') {
    sb = getSupabaseClient(); 
  }
} catch(_) {}

if (!sb && window.supabase && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
  sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
}
```

7. **重要限制**:
   - 不要使用任何外部图标库（如 lucide-react）
   - 使用 emoji 或简单的文本符号作为图标
   - 确保组件在挂载后立即显示（不要有延迟）
   - 确保 z-index 足够高（至少 10），避免被背景动画覆盖
   - 背景必须是透明的，与页面背景融合

## 示例代码结构
```jsx
const PortfolioSection = () => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // 数据获取逻辑
  }, []);
  
  return (
    <section style={{display: 'block', visibility: 'visible', opacity: 1, position: 'relative', zIndex: 10}}>
      {/* UI 内容 */}
    </section>
  );
};

window.PortfolioSection = PortfolioSection;
```

请生成完整的、可以直接使用的代码。

