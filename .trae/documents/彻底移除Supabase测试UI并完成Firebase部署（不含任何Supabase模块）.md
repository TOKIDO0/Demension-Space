## 目标
- 彻底移除页面中的 Supabase 测试模态与按钮（`#supabase-test-results`、`#supabase-connection-result`、“重新测试Supabase连接”），以及所有相关功能逻辑。
- 仅保留网站正常功能；不再使用或暴露任何 Supabase 代码。
- 使用 Firebase Hosting 部署站点（不上传你的 Admin SDK 密钥），确保上线后不再出现上述测试 UI。

## 页面与脚本清理方案
1. Index 级别的强制拦截
- 在 `public/index.html` 的 `<head>` 尾部插入一段极早执行的内联脚本，立即执行以下操作：
  - 删除现有的 `#supabase-test-results`、`#supabase-connection-result` 元素；
  - 删除页面上文本为“重新测试Supabase连接”的按钮；
  - 启用 `MutationObserver` 监听整个文档，若有脚本再次插入上述元素或按钮，立即移除（毫秒级拦截）。
- 在 `<head>` 同时注入一条内联样式：`#supabase-test-results, #supabase-connection-result { display: none !important; visibility: hidden !important; }` 作为 CSS 层面的兜底。

2. 应用脚本层兜底
- 在 `public/app.js` 文件开头增加同样的清理逻辑（初始化即执行一次 + 观察器），确保即使 index 的脚本被绕过，应用层仍可拦截删除。

3. 仓库中相关页面与脚本的移除/精简
- 已清理 `config/deploy.html` 中所有 Supabase 配置/测试/建表逻辑与按钮，仅保留本地预览与示例表单。
- 继续清理纯文档/脚本中的 Supabase 引用：
  - `README.md` 与 `docs/DEPLOY_GUIDE.md` 中的 Supabase 文案（保留项目与部署通用说明）。
  - `scripts/manage_project.ps1` 删除 Supabase 部署选项，只保留本地测试/清理/列出结构等。
- 不改变你网站的正常功能，不新增测试代码；不写冗余代码。

## Firebase 部署方案（不上传密钥）
1. Hosting 配置
- `config/firebase.json` 已设置 `public: ../public` 指向站点静态目录。
- `config/.firebaserc` 已设置默认项目为 `dimension-space`。
- 新增 `.firebaseignore`（将添加）：忽略 `config/src/*.json`（你的 Admin SDK 密钥）、`node_modules`、临时文件；确保密钥绝不被上传。

2. 部署执行
- 使用 `firebase deploy --project dimension-space` 进行托管部署。
- 需要在你的机器执行一次 `firebase login` 或提供 CI Token（`firebase login:ci`），我将配置为非交互部署。
- 管理密钥仅用于服务端，不参与静态 Hosting；本次仅发布前端站点，不会泄露密钥。

## 验证
- 本地/线上打开页面，确认上述 `div` 与 `button` 不存在；若第三方脚本尝试再次注入，观察器会立即删除。
- 验证网站功能与样式不受影响。

## 后续
- 若你选择“直接复刻网站且完全不含这些模块”，我也可以在保留现有视觉与结构的前提下生成一个纯静态版本（移除所有与 Supabase/Firebase 相关的说明与脚本），按你的确认执行。请确认本计划或选择复刻方案。