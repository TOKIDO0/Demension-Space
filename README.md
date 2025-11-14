# 维度空间

## 项目简介
维度空间 是一个装修设计工作室网站，使用本地存储模式管理表单数据。

## 项目结构

```
维度空间/
├── public/           # 网站前端文件
│   ├── index.html    # 首页
│   ├── styles.css    # 样式文件
│   ├── script.js     # JavaScript 脚本
│   └── test_form.html # 表单测试页面
├── config/           # 配置文件
│   ├── deploy.html   # 部署助手界面
│   ├── firebase.json # Firebase 配置
│   └── .firebaserc   # Firebase 配置
├── docs/             # 文档
│   └── DEPLOY_GUIDE.md    # 部署手册
├── scripts/          # 工具脚本
│   └── manage_project.ps1 # 项目管理脚本
├── package.json      # 项目依赖配置
└── package-lock.json # 依赖版本锁定文件
```

## 功能特点

1. **表单功能**：
   - 联系表单提交
   - 数据本地存储

2. **部署工具**：
   - 可视化部署助手界面
   - PowerShell 项目管理脚本

## 使用方法

### 1. 本地测试

```powershell
# 使用项目管理脚本启动测试
.\scripts\manage_project.ps1 -Command test
```

或者直接在浏览器中打开：
- `public/index.html` - 网站首页
- `public/test_form.html` - 表单测试页面

### 2. 部署到静态托管服务

直接将public目录下的文件上传到任何静态网站托管服务（如Netlify、Vercel、GitHub Pages等）即可。

### 4. 本地数据存储

表单数据自动保存在用户浏览器的localStorage中，无需额外配置数据库。

## 常见问题

### 表单数据存储在哪里？
- 数据存储在浏览器的 localStorage 中

### 如何查看本地存储的数据？
- 打开浏览器开发者工具（F12）
- 切换到「应用程序」或「Application」标签
- 找到「本地存储」（Local Storage）查看数据

### 如何清除本地存储的数据？
- 打开浏览器开发者工具
- 在「应用程序」或「Application」标签中清除localStorage
- 或者直接清除浏览器缓存

## 技术栈

- HTML5
- CSS3
- JavaScript
- Firebase（可选部署选项）

## 后续维护

1. **更新网站内容**：修改 `public/index.html` 和 `public/styles.css`
2. **更新表单功能**：修改 `public/script.js`
3. **查看部署日志**：运行 `.\scripts\manage_project.ps1 -Command list`
4. **清理临时文件**：运行 `.\scripts\manage_project.ps1 -Command clean`

## 注意事项


- 定期备份您的数据
- 部署前确保测试表单功能正常
- 如需帮助，请参考 `docs/` 目录下的详细文档
