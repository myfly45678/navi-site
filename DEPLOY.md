# Cloudflare Pages 部署指南

## 第一步：创建 D1 数据库

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages** → **D1**
3. 点击 **Create a database**
4. 输入数据库名称（如 `navi-db`），点击 **Add database**
5. 创建成功后，复制 **Database ID**（格式类似：`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`）

## 第二步：初始化数据库

1. 在 D1 数据库页面，点击 **Console** 标签
2. 将 `drizzle/schema.sql` 文件的全部内容复制粘贴到控制台
3. 点击 **Execute** 执行 SQL 脚本

这会创建所有必要的表并插入初始导航数据。

## 第三步：推送到 GitHub

### 方法 A：使用 GitHub Desktop（推荐）

1. 下载并安装 [GitHub Desktop](https://desktop.github.com/)
2. 打开 GitHub Desktop，点击 **File** → **Add Local Repository**
3. 选择项目文件夹 `G:\halo\test\navi-site`
4. 如果是首次，点击 **Create a repository**
5. 输入提交信息（如 `Initial commit`），点击 **Commit to main**
6. 点击 **Publish repository**，选择公开或私有
7. 点击 **Publish repository** 完成推送

### 方法 B：网页上传

1. 访问 https://github.com/new 创建新仓库 `navi-site`
2. 创建后点击 **uploading an existing file**
3. 拖拽以下文件/文件夹到上传区域：
   - `functions/` 文件夹
   - `api/` 文件夹
   - `drizzle/` 文件夹
   - `package.json`
   - `.env.example`
   - `.gitignore`
   - `DEPLOY.md`
   - `README.md`
4. **不要上传**：`.env` 文件、`node_modules/` 文件夹、`src/` 文件夹
5. 输入提交信息，点击 **Commit changes**

## 第四步：创建 Cloudflare Pages 项目

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages** → **Pages**
3. 点击 **Create a project**
4. 点击 **Connect to Git**
5. 选择你的 `navi-site` 仓库
6. 点击 **Begin setup**

## 第五步：配置构建设置

在 **Build settings** 页面配置：

| 设置项 | 值 |
|--------|-----|
| Framework preset | `None` |
| Build command | 留空 |
| Build output directory | 留空 |
| Root directory | 留空 |
| Node compatibility | ✅ **勾选** |

点击 **Save and Deploy**

## 第六步：配置环境变量

1. 部署开始后，进入项目页面
2. 点击 **Settings** → **Environment variables**
3. 点击 **Add variable**
4. 添加以下变量：

| Variable name | Value | 说明 |
|---------------|-------|------|
| `ADMIN_PASSWORD` | 你的管理员密码 | 管理后台登录密码 |

5. 点击 **Save**

## 第七步：绑定 D1 数据库

1. 点击 **Settings** → **Functions**
2. 找到 **D1 database bindings**
3. 点击 **Add binding**
4. 填写：
   - **Variable name**: `DB`
   - **D1 database**: 选择你创建的 `navi-db`
5. 点击 **Save**

## 第八步：重新部署

1. 进入 **Deployments** 标签
2. 找到最新的部署，点击右侧的 **···** 菜单
3. 点击 **Retry deployment**
4. 等待部署完成（状态变为 **Ready**）

## 第九步：访问网站

部署成功后，在项目首页会显示你的域名：
- 格式：`https://navi-site-xxxx.pages.dev`
- 点击域名即可访问网站

## 管理后台

- 访问：`https://navi-site-xxxx.pages.dev/admin`
- 密码：你在第六步设置的 `ADMIN_PASSWORD`

## 后续更新

每次推送到 GitHub 后，Cloudflare Pages 会自动重新部署。

如果需要修改环境变量或数据库绑定：
1. 修改后点击 **Save**
2. 进入 **Deployments** → **Retry deployment** 重新部署

## 自定义域名（可选）

1. 进入项目页面
2. 点击 **Custom domains**
3. 点击 **Add custom domain**
4. 按照提示绑定你的域名

## 故障排查

### 部署失败

1. 检查 **Deployments** 标签中的错误日志
2. 确认 `package.json` 配置正确
3. 确认 Node compatibility 已勾选
4. 确认 `functions/` 目录存在

### 500 错误

1. 检查 D1 数据库是否正确绑定
2. 检查环境变量 `ADMIN_PASSWORD` 是否设置
3. 确认数据库表已正确创建（执行了 schema.sql）

### 无法登录

1. 确认 `ADMIN_PASSWORD` 环境变量值正确
2. 清除浏览器缓存后重试

### 页面空白

1. 打开浏览器开发者工具查看控制台错误
2. 确认 `functions/[[path]].js` 文件存在
3. 确认 `functions/_routes.json` 文件存在

## 项目结构说明

```
navi-site/
├── functions/           # Cloudflare Pages Functions 目录
│   ├── [[path]].js     # 主入口文件，处理所有路由
│   └── _routes.json    # 路由配置文件
├── api/                 # API 模块
│   ├── auth.js         # 认证模块
│   └── navi.js         # 导航 CRUD 模块
├── drizzle/
│   └── schema.sql      # 数据库结构和初始数据
├── package.json
└── wrangler.toml       # 本地开发配置
```

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

本地开发时使用 `wrangler dev`，生产环境使用 Cloudflare Pages 部署。
