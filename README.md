# 导航网站 (Navi Site)

一个基于 Cloudflare Pages Functions 和 D1 数据库的轻量级导航网站。

## 功能特点

- 无需服务器，部署在 Cloudflare 边缘网络
- 使用 Cloudflare D1 数据库（SQLite）存储数据
- 管理后台支持分类和导航 URL 的增删改查
- 支持站内搜索和站外搜索（百度、Google、Bing）
- 响应式设计，支持移动端
- 基于 Font Awesome 的精美图标

## 技术栈

- **运行时**: Cloudflare Pages Functions
- **框架**: Hono
- **数据库**: Cloudflare D1 (SQLite)
- **UI**: 原生 HTML/CSS/JavaScript
- **图标**: Font Awesome 6.5.1

## 本地开发

### 环境要求

- Node.js 18+
- npm

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
D1_DATABASE_ID=local-dev
ADMIN_PASSWORD=你的管理员密码
```

### 初始化数据库

```bash
npm run db:migrate
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://127.0.0.1:8787/

## 部署

详见 [部署指南](DEPLOY.md)

### 快速部署步骤

1. 在 Cloudflare Dashboard 创建 D1 数据库
2. 执行 `drizzle/schema.sql` 初始化数据库
3. 推送代码到 GitHub（`functions/` 和 `api/` 目录）
4. 在 Cloudflare Pages 连接 GitHub 仓库
5. 配置环境变量和数据库绑定
6. 完成部署

## 项目结构

```
navi-site/
├── functions/              # Cloudflare Pages Functions 目录
│   ├── [[path]].js        # 主入口文件，处理所有路由
│   └── _routes.json       # 路由配置文件
├── api/
│   ├── auth.js            # 认证模块
│   └── navi.js            # 导航 CRUD 模块
├── drizzle/
│   └── schema.sql         # 数据库结构和初始数据
├── wrangler.toml          # Wrangler 配置（本地开发）
├── package.json           # 项目依赖
├── .env.example           # 环境变量示例
├── .gitignore             # Git 忽略文件
├── DEPLOY.md              # 部署指南
└── README.md              # 项目说明
```

## 默认数据

项目包含 5 个分类，每个分类 5 个导航网址：

1. **常用工具**: Google、哔哩哔哩、知乎、微博、百度
2. **设计资源**: Dribbble、Behance、Pinterest、站酷、Unsplash
3. **开发工具**: GitHub、Stack Overflow、V2EX、掘金、MDN
4. **娱乐影音**: YouTube、网易云音乐、QQ 音乐、爱奇艺、腾讯视频
5. **学习教育**: Coursera、B 站课堂、慕课网、得到、维基百科

## API 接口

### 公开接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/categories | 获取所有分类 |
| GET | /api/navis | 获取所有导航 URL |
| GET | /api/navis?category_id=1 | 获取指定分类的导航 |

### 管理接口（需要认证）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/admin/login | 管理员登录 |
| POST | /api/admin/logout | 管理员登出 |
| POST | /api/admin/categories | 创建分类 |
| PUT | /api/admin/categories/:id | 更新分类 |
| DELETE | /api/admin/categories/:id | 删除分类 |
| POST | /api/admin/navis | 创建导航 |
| PUT | /api/admin/navis/:id | 更新导航 |
| DELETE | /api/admin/navis/:id | 删除导航 |

## 许可证

MIT
