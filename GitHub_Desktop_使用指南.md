# GitHub Desktop 使用指南

## 如何推送代码到 GitHub

### 步骤 1: 添加本地仓库到 GitHub Desktop

1. **打开 GitHub Desktop**
   - 如果看到 "Let's get started!" 页面，点击左侧的 **"TOKIDO0/Demension-Space"** 仓库
   - 如果仓库不在列表中，点击右侧的 **"Add an Existing Repository from your local drive..."**

2. **选择本地文件夹**
   - 浏览到你的项目文件夹：`D:\创作\AI App Create\Dimension Space\Dimension Space`
   - 点击 "Add repository"

### 步骤 2: 查看更改

1. **在 GitHub Desktop 中查看更改**
   - 左侧会显示所有修改的文件
   - 右侧会显示具体的代码更改

2. **确认更改**
   - 检查所有更改是否正确
   - 确保没有遗漏重要文件

### 步骤 3: 提交更改

1. **填写提交信息**
   - 在左下角的 "Summary" 框中输入：`Fix project modal layout and update features`
   - （可选）在 "Description" 框中添加详细说明

2. **点击 "Commit to main" 按钮**
   - 这会将更改提交到本地仓库

### 步骤 4: 推送到 GitHub

1. **点击右上角的 "Push origin" 按钮**
   - 或者点击菜单栏的 "Repository" → "Push"
   - 如果提示输入凭据，使用你的 GitHub 用户名和 Personal Access Token

2. **等待推送完成**
   - 推送成功后，代码就会出现在 GitHub 上

## 常见问题

### Q: 如果提示需要登录？
A: 点击 "Sign in to GitHub.com"，使用你的 GitHub 账号登录。

### Q: 如果提示需要 Personal Access Token？
A: 
1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 勾选 `repo` 权限
4. 生成并复制 token
5. 在 GitHub Desktop 中使用这个 token 作为密码

### Q: 如果仓库名称不匹配？
A: 确保本地仓库的远程地址指向正确的仓库：
- 在 GitHub Desktop 中，点击 "Repository" → "Repository settings" → "Remote"
- 确保 URL 是：`https://github.com/TOKIDO0/Demension-Space.git`

## 完成后的下一步

推送成功后，你可以：
1. 访问 https://github.com/TOKIDO0/Demension-Space 查看代码
2. 在 Vercel 中连接这个仓库进行自动部署

