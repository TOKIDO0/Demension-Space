# NTFY 推送通知服务部署指南

## 概述

ntfy 是一个基于 HTTP 的简单发布/订阅通知服务，可以让您在用户提交留言或评价时，实时收到推送通知到您的手机和电脑。

**GitHub 项目**: https://github.com/binwiederhier/ntfy

## 部署方案选择

### 方案 1: 使用公共 ntfy.sh 服务（推荐，最简单）

**优点**：
- 无需自己部署服务器
- 免费使用
- 开箱即用

**缺点**：
- 消息是公开的（任何人都可以订阅您的主题）
- 有速率限制

**配置步骤**：
1. 在 `public/app.js` 中设置：
   ```javascript
   const NTFY_SERVER_URL = 'https://ntfy.sh';
   const NTFY_TOPIC = 'your-unique-topic-name'; // 使用一个唯一的主题名
   ```

2. 在手机和电脑上安装 ntfy 客户端：
   - **Android**: Google Play 或 F-Droid 搜索 "ntfy"
   - **iOS**: App Store 搜索 "ntfy"
   - **桌面端**: 访问 https://ntfy.sh/app 或下载桌面应用

3. 在客户端订阅主题：`your-unique-topic-name`

### 方案 2: 自托管部署（推荐用于生产环境）

**优点**：
- 完全控制，数据私有
- 无速率限制
- 可以配置认证和访问控制

**缺点**：
- 需要自己的服务器
- 需要维护

## 自托管部署步骤

### 1. 服务器要求

- 一台 Linux 服务器（Ubuntu/Debian 推荐）
- 已安装 Docker 和 Docker Compose
- 至少 512MB 内存
- 开放端口（默认 2586，或通过 Nginx 反向代理使用 80/443）

### 2. 使用 Docker Compose 部署

创建目录并进入：
```bash
mkdir -p /etc/ntfy
cd /etc/ntfy
```

创建 `docker-compose.yml` 文件：
```yaml
version: "3"

services:
  ntfy:
    image: binwiederhier/ntfy:latest
    container_name: ntfy
    command:
      - serve
    environment:
      - TZ=Asia/Shanghai
      - NTFY_BASE_URL=https://ntfy.yourdomain.com  # 替换为您的域名
      - NTFY_CACHE_FILE=/var/cache/ntfy/cache.db
      - NTFY_AUTH_FILE=/var/cache/ntfy/user.db
    volumes:
      - /var/cache/ntfy:/var/cache/ntfy
      - /etc/ntfy:/etc/ntfy
    ports:
      - "2586:2586"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:2586/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

启动服务：
```bash
docker-compose up -d
```

### 3. 配置 Nginx 反向代理（推荐）

如果您希望通过域名访问并使用 HTTPS，配置 Nginx：

```nginx
server {
    listen 80;
    server_name ntfy.yourdomain.com;  # 替换为您的域名

    location / {
        proxy_pass http://localhost:2586;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_read_timeout 86400;
    }
}
```

然后配置 SSL 证书（使用 Let's Encrypt）：
```bash
sudo certbot --nginx -d ntfy.yourdomain.com
```

### 4. 配置访问控制（可选但推荐）

创建用户和访问控制：
```bash
# 进入容器
docker exec -it ntfy ntfy user add --role=admin admin

# 设置密码
docker exec -it ntfy ntfy user change-pass admin

# 创建主题访问控制
docker exec -it ntfy ntfy access admin dimension-space-notifications read-write
```

### 5. 在网站中配置

在 `public/index.html` 的 `<head>` 部分添加：
```html
<script>
  // 配置 NTFY
  window.NTFY_SERVER_URL = 'https://ntfy.yourdomain.com';  // 或 'https://ntfy.sh' 使用公共服务
  window.NTFY_TOPIC = 'dimension-space-notifications';     // 您的主题名
</script>
```

或者在 `public/app.js` 中直接修改：
```javascript
const NTFY_SERVER_URL = 'https://ntfy.yourdomain.com';
const NTFY_TOPIC = 'dimension-space-notifications';
```

## 客户端订阅

### Android/iOS 应用

1. 安装 ntfy 应用
2. 点击 "Subscribe to topic"
3. 输入主题名：`dimension-space-notifications`
4. 如果使用自托管且有认证，输入用户名和密码
5. 完成！现在您会收到所有推送通知

### 桌面端

1. 访问 https://ntfy.sh/app（公共服务）或您的自托管地址
2. 点击 "Subscribe"
3. 输入主题名
4. 允许浏览器通知权限

## 测试推送

在浏览器控制台测试：
```javascript
window.sendNtfyNotification('测试标题', '这是一条测试消息', 'high', 'test');
```

## 安全建议

1. **使用自托管服务**：如果处理敏感信息，建议自托管
2. **配置认证**：为您的主题设置访问控制
3. **使用 HTTPS**：确保通信加密
4. **使用唯一主题名**：避免使用常见名称，使用随机字符串

## 故障排查

### 推送不工作

1. 检查浏览器控制台是否有错误
2. 检查 NTFY_SERVER_URL 和 NTFY_TOPIC 是否正确配置
3. 测试直接访问 ntfy 服务器是否正常
4. 检查防火墙是否阻止了请求

### 收不到通知

1. 确认客户端已正确订阅主题
2. 检查客户端通知权限是否开启
3. 测试发送一条消息看是否到达服务器

## 更多信息

- 官方文档: https://docs.ntfy.sh/
- GitHub: https://github.com/binwiederhier/ntfy
- 示例和 API: https://docs.ntfy.sh/publish/

