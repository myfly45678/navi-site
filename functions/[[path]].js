// 导入 API 模块
import { login, verifyToken, logout } from '../api/auth.js';
import * as navi from '../api/navi.js';

// 简单的路由处理类
class Router {
  constructor() {
    this.routes = { GET: {}, POST: {}, PUT: {}, DELETE: {} };
  }

  get(path, handler) { this.routes.GET[path] = handler; }
  post(path, handler) { this.routes.POST[path] = handler; }
  put(path, handler) { this.routes.PUT[path] = handler; }
  delete(path, handler) { this.routes.DELETE[path] = handler; }

  async handle(request, env) {
    const url = new URL(request.url);
    let path = url.pathname;
    const method = request.method;

    // 移除尾部斜杠
    if (path !== '/' && path.endsWith('/')) path = path.slice(0, -1);

    // 匹配路由
    for (const [routePath, handler] of Object.entries(this.routes[method] || {})) {
      if (routePath === path) {
        return await handler(request, env, url);
      }
      // 处理动态路由
      if (routePath.includes(':')) {
        const pattern = routePath.replace(/:\w+/g, '([^/]+)');
        const regex = new RegExp(`^${pattern}$`);
        const match = path.match(regex);
        if (match) {
          const params = routePath.match(/:\w+/g)?.map((p, i) => ({
            key: p.slice(1),
            value: match[i + 1]
          })) || [];
          request.params = Object.fromEntries(params.map(p => [p.key, p.value]));
          return await handler(request, env, url);
        }
      }
    }

    return null;
  }
}

const router = new Router();

// CORS 中间件
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// 认证中间件
async function authMiddleware(request, env) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const isValid = await verifyToken(env.DB, token);
  return isValid;
}

// JSON 响应
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
  });
}

// HTML 响应
function htmlResponse(html, status = 200) {
  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html', ...corsHeaders() }
  });
}

// ============ API 路由 ============

// 公开 API - 获取所有分类
router.get('/api/categories', async (request, env) => {
  const categories = await navi.getCategories(env.DB);
  return jsonResponse({ success: true, data: categories });
});

// 公开 API - 获取所有导航
router.get('/api/navis', async (request, env, url) => {
  const categoryId = url.searchParams.get('category_id');
  const navis = await navi.getNavis(env.DB, categoryId ? parseInt(categoryId) : null);
  return jsonResponse({ success: true, data: navis });
});

// 管理 API - 登录
router.post('/api/admin/login', async (request, env) => {
  const { password } = await request.json();
  const adminPassword = env.ADMIN_PASSWORD || 'admin123';
  const result = await login(env.DB, password, adminPassword);
  if (result.success) {
    return jsonResponse({ success: true, token: result.token });
  }
  return jsonResponse({ success: false, error: result.error }, 401);
});

// 管理 API - 登出
router.post('/api/admin/logout', async (request, env) => {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  await logout(env.DB, token);
  return jsonResponse({ success: true });
});

// 管理 API - 创建分类
router.post('/api/admin/categories', async (request, env) => {
  const isValid = await authMiddleware(request, env);
  if (!isValid) return jsonResponse({ error: '未授权' }, 401);

  const { name, description, sort_order } = await request.json();
  const id = await navi.createCategory(env.DB, name, description, sort_order || 0);
  return jsonResponse({ success: true, data: { id } });
});

// 管理 API - 更新分类
router.put('/api/admin/categories/:id', async (request, env) => {
  const isValid = await authMiddleware(request, env);
  if (!isValid) return jsonResponse({ error: '未授权' }, 401);

  const id = parseInt(request.params.id);
  const { name, description, sort_order } = await request.json();
  await navi.updateCategory(env.DB, id, name, description, sort_order || 0);
  return jsonResponse({ success: true });
});

// 管理 API - 删除分类
router.delete('/api/admin/categories/:id', async (request, env) => {
  const isValid = await authMiddleware(request, env);
  if (!isValid) return jsonResponse({ error: '未授权' }, 401);

  const id = parseInt(request.params.id);
  await navi.deleteCategory(env.DB, id);
  return jsonResponse({ success: true });
});

// 管理 API - 创建导航
router.post('/api/admin/navis', async (request, env) => {
  const isValid = await authMiddleware(request, env);
  if (!isValid) return jsonResponse({ error: '未授权' }, 401);

  const { category_id, title, description, url, icon, sort_order } = await request.json();
  const id = await navi.createNavi(env.DB, category_id, title, description, url, icon || '', sort_order || 0);
  return jsonResponse({ success: true, data: { id } });
});

// 管理 API - 更新导航
router.put('/api/admin/navis/:id', async (request, env) => {
  const isValid = await authMiddleware(request, env);
  if (!isValid) return jsonResponse({ error: '未授权' }, 401);

  const id = parseInt(request.params.id);
  const { category_id, title, description, url, icon, sort_order } = await request.json();
  await navi.updateNavi(env.DB, id, category_id, title, description, url, icon || '', sort_order || 0);
  return jsonResponse({ success: true });
});

// 管理 API - 删除导航
router.delete('/api/admin/navis/:id', async (request, env) => {
  const isValid = await authMiddleware(request, env);
  if (!isValid) return jsonResponse({ error: '未授权' }, 401);

  const id = parseInt(request.params.id);
  await navi.deleteNavi(env.DB, id);
  return jsonResponse({ success: true });
});

// ============ 页面路由 ============

// 首页
router.get('/', async () => {
  return htmlResponse(await getHomePage());
});

// 管理后台
router.get('/admin', async () => {
  return htmlResponse(await getAdminPage());
});

// 主请求处理
export async function onRequest(context) {
  const { request, env } = context;

  // 处理 OPTIONS 预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders() });
  }

  // 尝试匹配路由
  const response = await router.handle(request, env);
  if (response) return response;

  // 404
  return new Response('Not Found', { status: 404, headers: corsHeaders() });
}

// ============ HTML 生成函数 ============

async function getHomePage() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>导航网站</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <style>${getStyles()}</style>
</head>
<body>
  <div class="container">
    <header>
      <h1><i class="fas fa-compass"></i> 导航网站</h1>
      <a href="/admin" class="admin-link"><i class="fas fa-cog"></i> 管理后台</a>
    </header>

    <div class="search-section">
      <div class="search-box">
        <i class="fas fa-search"></i>
        <input type="text" id="search-input" placeholder="搜索导航网站，或直接输入内容按回车进行站外搜索..." />
        <button id="search-btn" onclick="doSearch()"><i class="fas fa-search"></i> 搜索</button>
      </div>
      <div class="search-engines">
        <span class="engine-label">搜索引擎：</span>
        <button type="button" class="engine-badge active" data-engine="站内" onclick="selectEngine(this)">站内</button>
        <button type="button" class="engine-badge engine-baidu" data-engine="baidu" onclick="selectEngine(this)">百度</button>
        <button type="button" class="engine-badge engine-google" data-engine="google" onclick="selectEngine(this)">Google</button>
        <button type="button" class="engine-badge engine-bing" data-engine="bing" onclick="selectEngine(this)">Bing</button>
      </div>
    </div>

    <main id="app">
      <div class="loading">加载中...</div>
    </main>
  </div>

  <script>
    let allCategories = [];
    let allNavis = [];
    let currentEngine = '站内';

    function selectEngine(btn) {
      document.querySelectorAll('.engine-badge').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentEngine = btn.getAttribute('data-engine');
    }

    async function loadData() {
      const [categoriesRes, navisRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/navis')
      ]);

      allCategories = (await categoriesRes.json()).data || [];
      allNavis = (await navisRes.json()).data || [];

      const app = document.getElementById('app');

      if (allCategories.length === 0) {
        app.innerHTML = '<div class="empty"><i class="fas fa-inbox"></i> 暂无导航数据</div>';
        return;
      }

      renderNavis(allCategories, allNavis);
    }

    function renderNavis(categories, navis) {
      const app = document.getElementById('app');

      const navisByCategory = {};
      navis.forEach(navi => {
        if (!navisByCategory[navi.category_id]) {
          navisByCategory[navi.category_id] = [];
        }
        navisByCategory[navi.category_id].push(navi);
      });

      const categoryIcons = {
        '常用工具': 'fa-toolbox',
        '设计资源': 'fa-palette',
        '开发工具': 'fa-code',
        '娱乐影音': 'fa-film',
        '学习教育': 'fa-graduation-cap',
        '默认': 'fa-folder'
      };

      const html = categories.map(cat => {
        const iconClass = categoryIcons[cat.name] || categoryIcons['默认'];
        const categoryNavis = navisByCategory[cat.id] || [];

        if (categoryNavis.length === 0) return '';

        return \`
        <section class="category">
          <h2><i class="fas \${iconClass}"></i> \${cat.name}</h2>
          <p class="category-desc">\${cat.description || ''}</p>
          <div class="navi-grid">
            \${categoryNavis.map(navi => \`
              <a href="\${navi.url}" target="_blank" rel="noopener" class="navi-card">
                \${navi.icon ? \`<span class="navi-icon"><i class="\${navi.icon}"></i></span>\` :
                  '<span class="navi-icon"><i class="fas fa-link"></i></span>'}
                <div class="navi-info">
                  <h3>\${navi.title}</h3>
                  <p>\${navi.description || ''}</p>
                </div>
              </a>
            \`).join('')}
          </div>
        </section>
      \`;
      }).filter(h => h.trim()).join('');

      app.innerHTML = html || '<div class="empty"><i class="fas fa-search"></i> 未找到相关结果</div>';
    }

    function doSearch() {
      const query = document.getElementById('search-input').value.trim();
      if (!query) {
        window.location.href = '/';
        return;
      }

      if (currentEngine === '站内') {
        const lowerQuery = query.toLowerCase();
        const filteredNavis = allNavis.filter(navi =>
          navi.title.toLowerCase().includes(lowerQuery) ||
          navi.description.toLowerCase().includes(lowerQuery) ||
          navi.url.toLowerCase().includes(lowerQuery)
        );

        const categoryIds = new Set(filteredNavis.map(n => n.category_id));
        const filteredCategories = allCategories.filter(c => categoryIds.has(c.id));

        renderNavis(filteredCategories, filteredNavis);
      } else {
        const searchUrls = {
          'baidu': 'https://www.baidu.com/s?wd=',
          'google': 'https://www.google.com/search?q=',
          'bing': 'https://www.bing.com/search?q='
        };
        const searchUrl = searchUrls[currentEngine] + encodeURIComponent(query);
        window.open(searchUrl, '_blank');
      }
    }

    document.getElementById('search-input')?.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        doSearch();
      }
    });

    loadData();
  </script>
</body>
</html>`;
}

async function getAdminPage() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>管理后台 - 导航网站</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <style>${getStyles()}</style>
</head>
<body>
  <div class="container">
    <header>
      <h1><i class="fas fa-cogs"></i> 管理后台</h1>
      <a href="/" class="admin-link"><i class="fas fa-home"></i> 返回首页</a>
    </header>

    <div id="login-section">
      <div class="login-box">
        <h2><i class="fas fa-user-shield"></i> 管理员登录</h2>
        <div class="input-wrapper">
          <i class="fas fa-lock"></i>
          <input type="password" id="password" placeholder="请输入管理员密码" />
        </div>
        <button onclick="login()"><i class="fas fa-sign-in-alt"></i> 登录</button>
        <p id="login-error" class="error"></p>
      </div>
    </div>

    <div id="admin-section" style="display: none;">
      <div class="admin-header">
        <button onclick="logout()" class="logout-btn"><i class="fas fa-sign-out-alt"></i> 退出登录</button>
      </div>

      <div class="admin-content">
        <section class="admin-panel">
          <h2><i class="fas fa-folder"></i> 分类管理</h2>
          <div class="form-row">
            <input type="text" id="cat-name" placeholder="分类名称" />
            <input type="text" id="cat-desc" placeholder="分类描述" />
            <input type="number" id="cat-sort" placeholder="排序" value="0" style="width:80px" />
            <button onclick="addCategory()"><i class="fas fa-plus"></i> 添加分类</button>
          </div>
          <div id="category-list" class="list"></div>
        </section>

        <section class="admin-panel">
          <h2><i class="fas fa-bookmark"></i> 导航管理</h2>
          <div class="form-row">
            <select id="navi-cat-id"></select>
            <input type="text" id="navi-title" placeholder="标题" />
            <input type="text" id="navi-desc" placeholder="描述" />
            <input type="url" id="navi-url" placeholder="URL" />
            <input type="text" id="navi-icon" placeholder="图标" value="fa-link" style="width:100px" />
            <input type="number" id="navi-sort" placeholder="排序" value="0" style="width:60px" />
            <button onclick="addNavi()"><i class="fas fa-plus"></i> 添加导航</button>
          </div>
          <div id="navi-list" class="list"></div>
        </section>
      </div>
    </div>
  </div>

  <script>
    let token = localStorage.getItem('admin_token');

    function checkAuth() {
      if (token) {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('admin-section').style.display = 'block';
        loadAdminData();
      }
    }

    async function login() {
      const password = document.getElementById('password').value;
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();

      if (data.success) {
        token = data.token;
        localStorage.setItem('admin_token', token);
        checkAuth();
      } else {
        document.getElementById('login-error').textContent = data.error;
      }
    }

    async function logout() {
      await fetch('/api/admin/logout', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      localStorage.removeItem('admin_token');
      token = null;
      location.reload();
    }

    async function loadAdminData() {
      const [catRes, naviRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/navis')
      ]);

      const categories = (await catRes.json()).data || [];
      const navis = (await naviRes.json()).data || [];

      const select = document.getElementById('navi-cat-id');
      select.innerHTML = categories.map(c => \`<option value="\${c.id}">\${c.name}</option>\`).join('');

      document.getElementById('category-list').innerHTML = categories.map(cat => \`
        <div class="list-item">
          <div class="list-item-content">
            <i class="fas fa-folder list-icon"></i>
            <div>
              <strong>\${cat.name}</strong>
              <small>\${cat.description || '无描述'}</small>
            </div>
          </div>
          <div class="list-actions">
            <button onclick="editCategory(\${cat.id})"><i class="fas fa-edit"></i> 编辑</button>
            <button onclick="deleteCategory(\${cat.id})"><i class="fas fa-trash"></i> 删除</button>
          </div>
        </div>
      \`).join('') || '<div class="empty"><i class="fas fa-inbox"></i> 暂无分类</div>';

      document.getElementById('navi-list').innerHTML = navis.map(navi => \`
        <div class="list-item">
          <div class="list-item-content">
            <i class="\${navi.icon || 'fas fa-link'} list-icon"></i>
            <div>
              <strong>\${navi.title}</strong>
              <small>\${navi.url}</small>
            </div>
          </div>
          <div class="list-actions">
            <button onclick="editNavi(\${navi.id})"><i class="fas fa-edit"></i> 编辑</button>
            <button onclick="deleteNavi(\${navi.id})"><i class="fas fa-trash"></i> 删除</button>
          </div>
        </div>
      \`).join('') || '<div class="empty"><i class="fas fa-inbox"></i> 暂无导航</div>';
    }

    async function addCategory() {
      const name = document.getElementById('cat-name').value;
      const description = document.getElementById('cat-desc').value;
      const sort_order = parseInt(document.getElementById('cat-sort').value) || 0;

      if (!name) return alert('请输入分类名称');

      await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ name, description, sort_order })
      });

      document.getElementById('cat-name').value = '';
      document.getElementById('cat-desc').value = '';
      loadAdminData();
    }

    async function editCategory(id) {
      const name = prompt('分类名称:');
      if (!name) return;
      const description = prompt('分类描述:');
      const sort_order = parseInt(prompt('排序:', '0')) || 0;

      await fetch('/api/admin/categories/' + id, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ name, description, sort_order })
      });

      loadAdminData();
    }

    async function deleteCategory(id) {
      if (!confirm('确定删除此分类吗？')) return;
      await fetch('/api/admin/categories/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
      loadAdminData();
    }

    async function addNavi() {
      const category_id = parseInt(document.getElementById('navi-cat-id').value);
      const title = document.getElementById('navi-title').value;
      const description = document.getElementById('navi-desc').value;
      const url = document.getElementById('navi-url').value;
      const icon = document.getElementById('navi-icon').value || 'fa-link';
      const sort_order = parseInt(document.getElementById('navi-sort').value) || 0;

      if (!title || !url) return alert('标题和 URL 必填');

      await fetch('/api/admin/navis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ category_id, title, description, url, icon, sort_order })
      });

      document.getElementById('navi-title').value = '';
      document.getElementById('navi-desc').value = '';
      document.getElementById('navi-url').value = '';
      loadAdminData();
    }

    async function editNavi(id) {
      const title = prompt('标题:');
      if (!title) return;
      const description = prompt('描述:');
      const url = prompt('URL:');
      const icon = prompt('图标:', 'fa-link');
      const sort_order = parseInt(prompt('排序:', '0')) || 0;

      const category_id = parseInt(document.getElementById('navi-cat-id').value);

      await fetch('/api/admin/navis/' + id, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ category_id, title, description, url, icon, sort_order })
      });

      loadAdminData();
    }

    async function deleteNavi(id) {
      if (!confirm('确定删除此导航吗？')) return;
      await fetch('/api/admin/navis/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
      loadAdminData();
    }

    checkAuth();
  </script>
</body>
</html>`;
}

function getStyles() {
  return `
    :root {
      --primary: #0071e3;
      --primary-dark: #005bb5;
      --secondary: #5e5ce6;
      --success: #34c759;
      --danger: #ff3b30;
      --text-primary: #1d1d1f;
      --text-secondary: #6e6e73;
      --text-tertiary: #86868b;
      --bg-color: #f5f5f7;
      --card-bg: #ffffff;
      --card-border: rgba(0,0,0,0.08);
      --card-shadow: 0 2px 8px rgba(0,0,0,0.04);
      --card-shadow-hover: 0 8px 24px rgba(0,0,0,0.12);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
      background: var(--bg-color);
      min-height: 100vh;
      color: var(--text-primary);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 48px 30px;
    }

    .search-section {
      margin-bottom: 48px;
      padding: 40px;
      background: var(--card-bg);
      border-radius: 20px;
      box-shadow: var(--card-shadow);
      border: 1px solid var(--card-border);
      animation: fadeInUp 0.5s ease;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--bg-color);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 8px 8px 8px 20px;
      transition: all 0.2s ease;
    }

    .search-box:focus-within {
      border-color: var(--primary);
      box-shadow: 0 0 0 4px rgba(0,113,227,0.15);
    }

    .search-box i { color: var(--text-tertiary); font-size: 18px; }

    .search-box input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 17px;
      background: transparent;
      color: var(--text-primary);
    }

    .search-box input::placeholder { color: var(--text-tertiary); }

    .search-box button {
      padding: 12px 24px;
      background: var(--primary);
      color: #fff;
      border: none;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .search-box button:hover {
      background: var(--primary-dark);
    }

    .search-engines {
      display: flex;
      gap: 8px;
      margin-top: 16px;
      flex-wrap: wrap;
      align-items: center;
    }

    .engine-label {
      color: var(--text-secondary);
      font-size: 13px;
      font-weight: 500;
    }

    .engine-badge {
      padding: 8px 16px;
      background: var(--bg-color);
      border: 1px solid var(--card-border);
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s ease;
      user-select: none;
    }

    .engine-badge:hover {
      background: var(--card-border);
    }

    .engine-badge.active {
      background: var(--primary);
      color: #fff;
      border-color: var(--primary);
    }

    .engine-baidu { background: #2932e1; color: #fff; border-color: #2932e1; }
    .engine-google { background: #4285f4; color: #fff; border-color: #4285f4; }
    .engine-bing { background: #00809d; color: #fff; border-color: #00809d; }
    .engine-baidu.active, .engine-google.active, .engine-bing.active { opacity: 1; }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 40px;
      padding: 24px 32px;
      background: var(--card-bg);
      border-radius: 18px;
      box-shadow: var(--card-shadow);
      border: 1px solid var(--card-border);
    }

    header h1 {
      font-size: 28px;
      font-weight: 600;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 12px;
      letter-spacing: -0.3px;
    }

    header h1 i {
      color: var(--primary);
      font-size: 32px;
    }

    .admin-link {
      color: #fff;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 980px;
      background: var(--primary);
      font-weight: 500;
      font-size: 14px;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .admin-link:hover {
      background: var(--primary-dark);
    }

    .category {
      margin-bottom: 40px;
      padding: 32px;
      background: var(--card-bg);
      border-radius: 18px;
      box-shadow: var(--card-shadow);
      border: 1px solid var(--card-border);
      animation: fadeInUp 0.5s ease;
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .category h2 {
      font-size: 22px;
      margin-bottom: 6px;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 600;
    }

    .category h2 i {
      color: var(--primary);
      font-size: 22px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--primary);
      border-radius: 10px;
      color: #fff;
    }

    .category-desc {
      color: var(--text-secondary);
      margin-bottom: 20px;
      font-size: 14px;
      padding-left: 52px;
    }

    .navi-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 16px;
    }

    @media (max-width: 1400px) {
      .navi-grid { grid-template-columns: repeat(4, 1fr); gap: 14px; }
    }

    @media (max-width: 1100px) {
      .navi-grid { grid-template-columns: repeat(3, 1fr); gap: 12px; }
    }

    @media (max-width: 768px) {
      .navi-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
    }

    @media (max-width: 480px) {
      .navi-grid { grid-template-columns: 1fr; }
    }

    .navi-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 16px;
      background: var(--card-bg);
      border-radius: 14px;
      text-decoration: none;
      color: inherit;
      transition: all 0.2s ease;
      border: 1px solid var(--card-border);
      position: relative;
      min-height: 140px;
    }

    .navi-card:hover {
      box-shadow: var(--card-shadow-hover);
      transform: translateY(-4px);
      border-color: rgba(0,113,227,0.3);
    }

    .navi-icon {
      font-size: 28px;
      flex-shrink: 0;
      width: 52px;
      height: 52px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-color);
      border-radius: 12px;
      color: var(--primary);
      margin-bottom: 14px;
      transition: all 0.2s ease;
    }

    .navi-card:hover .navi-icon {
      background: var(--primary);
      color: #fff;
    }

    .navi-info {
      flex: 1;
      min-width: 0;
      width: 100%;
      text-align: center;
    }

    .navi-info h3 {
      font-size: 15px;
      margin-bottom: 6px;
      color: var(--text-primary);
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      transition: color 0.2s ease;
    }

    .navi-card:hover .navi-info h3 {
      color: var(--primary);
    }

    .navi-info p {
      font-size: 12px;
      color: var(--text-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      line-height: 1.4;
    }

    .loading, .empty {
      text-align: center;
      padding: 80px 20px;
      color: var(--text-primary);
      font-size: 17px;
      font-weight: 500;
    }

    .empty i {
      display: block;
      font-size: 48px;
      margin-bottom: 16px;
      color: var(--text-tertiary);
    }

    .login-box {
      max-width: 420px;
      margin: 80px auto;
      padding: 48px;
      background: var(--card-bg);
      border-radius: 20px;
      box-shadow: var(--card-shadow-hover);
      text-align: center;
      animation: fadeInUp 0.5s ease;
      border: 1px solid var(--card-border);
    }

    .login-box h2 {
      margin-bottom: 32px;
      font-size: 26px;
      color: var(--text-primary);
      font-weight: 600;
    }

    .login-box h2 i {
      margin-right: 12px;
      color: var(--primary);
    }

    .input-wrapper { position: relative; margin-bottom: 20px; }
    .input-wrapper i {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-tertiary);
      font-size: 16px;
      transition: color 0.2s ease;
    }

    .input-wrapper input, .login-box input {
      width: 100%;
      padding: 16px 16px 16px 48px;
      border: 1px solid var(--card-border);
      border-radius: 12px;
      font-size: 16px;
      transition: all 0.2s ease;
      background: var(--bg-color);
      box-sizing: border-box;
      color: var(--text-primary);
    }

    .input-wrapper input:focus {
      outline: none;
      border-color: var(--primary);
      background: var(--card-bg);
      box-shadow: 0 0 0 4px rgba(0,113,227,0.12);
    }

    .input-wrapper input:focus + i,
    .input-wrapper:focus-within i {
      color: var(--primary);
    }

    .login-box button {
      width: 100%;
      padding: 16px;
      background: var(--primary);
      color: #fff;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .login-box button:hover {
      background: var(--primary-dark);
    }

    .error {
      color: var(--danger);
      margin-top: 16px;
      font-size: 14px;
      background: rgba(255,59,48,0.1);
      padding: 12px 16px;
      border-radius: 10px;
    }

    .admin-header {
      text-align: right;
      margin-bottom: 24px;
    }

    .logout-btn {
      padding: 10px 20px;
      background: var(--danger);
      color: #fff;
      border: none;
      border-radius: 980px;
      cursor: pointer;
      font-weight: 500;
      font-size: 14px;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: auto;
    }

    .logout-btn:hover {
      background: #d73a30;
    }

    .admin-content {
      display: grid;
      gap: 24px;
      grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
    }

    .admin-panel {
      padding: 28px;
      background: var(--card-bg);
      border-radius: 18px;
      box-shadow: var(--card-shadow);
      animation: fadeInUp 0.5s ease;
      border: 1px solid var(--card-border);
    }

    .admin-panel h2 {
      margin-bottom: 20px;
      font-size: 20px;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 600;
    }

    .admin-panel h2 i {
      color: #fff;
      font-size: 18px;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--primary);
      border-radius: 9px;
    }

    .form-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 20px;
    }

    .form-row input, .form-row select {
      padding: 12px 16px;
      border: 1px solid var(--card-border);
      border-radius: 10px;
      font-size: 14px;
      transition: all 0.2s ease;
      background: var(--bg-color);
      flex: 1;
      min-width: 120px;
      color: var(--text-primary);
    }

    .form-row input:focus, .form-row select:focus {
      outline: none;
      border-color: var(--primary);
      background: var(--card-bg);
      box-shadow: 0 0 0 4px rgba(0,113,227,0.12);
    }

    .form-row button {
      padding: 12px 24px;
      background: var(--success);
      color: #fff;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
    }

    .form-row button:hover {
      background: #2db34f;
    }

    .list {
      max-height: 400px;
      overflow-y: auto;
    }

    .list-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 16px;
      border-bottom: 1px solid var(--card-border);
      transition: all 0.2s ease;
    }

    .list-item:hover {
      background: var(--bg-color);
      padding-left: 20px;
    }

    .list-item:last-child { border-bottom: none; }

    .list-item-content {
      display: flex;
      align-items: center;
      gap: 14px;
      flex: 1;
    }

    .list-icon {
      width: 42px;
      height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-color);
      border-radius: 10px;
      color: var(--primary);
      font-size: 18px;
    }

    .list-item-content strong {
      display: block;
      color: var(--text-primary);
      font-size: 15px;
      margin-bottom: 4px;
      font-weight: 600;
    }

    .list-item-content small {
      color: var(--text-secondary);
      font-size: 13px;
    }

    .list-actions { display: flex; gap: 8px; }

    .list-item button {
      padding: 8px 14px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .list-item button:first-of-type {
      background: var(--primary);
      color: #fff;
    }

    .list-item button:first-of-type:hover {
      background: var(--primary-dark);
    }

    .list-item button:last-of-type {
      background: var(--danger);
      color: #fff;
    }

    .list-item button:last-of-type:hover {
      background: #d73a30;
    }

    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb {
      background: #d1d1d1;
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover { background: #b8b8b8; }

    @media (max-width: 768px) {
      .container { padding: 20px 16px; }
      .form-row { flex-direction: column; }
      .form-row input, .form-row select, .form-row button { width: 100%; }
      .admin-content { grid-template-columns: 1fr; }
      header {
        flex-direction: column;
        gap: 16px;
        text-align: center;
        padding: 20px;
      }
      .navi-grid { grid-template-columns: 1fr; }
      .search-box { flex-wrap: wrap; }
      .search-box input {
        width: 100%;
        order: 3;
        padding-top: 12px;
        border-top: 1px solid var(--card-border);
        margin-top: 8px;
      }
      .search-box button { width: 100%; justify-content: center; }
      .search-engines { justify-content: center; }
      .category { padding: 20px; }
      .category h2 { font-size: 18px; }
      .category h2 i { width: 34px; height: 34px; font-size: 16px; }
    }
  `;
}
