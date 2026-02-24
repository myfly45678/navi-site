-- 删除现有表（如果存在）
DROP TABLE IF EXISTS admin_sessions;
DROP TABLE IF EXISTS navis;
DROP TABLE IF EXISTS categories;

-- 导航分类表
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 导航网址表
CREATE TABLE IF NOT EXISTS navis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- 管理员会话表
CREATE TABLE IF NOT EXISTS admin_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL
);

-- 插入默认分类（5 个分类）
INSERT INTO categories (name, description, sort_order) VALUES
  ('常用工具', '日常使用的工具网站', 1),
  ('设计资源', '设计相关的资源网站', 2),
  ('开发工具', '开发者常用的工具', 3),
  ('娱乐影音', '视频音乐娱乐网站', 4),
  ('学习教育', '在线学习和知识平台', 5);

-- 插入默认导航网址（每个分类 5 个，共 25 个）

-- 常用工具
INSERT INTO navis (category_id, title, description, url, icon, sort_order) VALUES
  (1, 'Google', '全球最大的搜索引擎', 'https://www.google.com', 'fab fa-google', 1),
  (1, '哔哩哔哩', '国内知名的视频弹幕网站', 'https://www.bilibili.com', 'fab fa-bilibili', 2),
  (1, '知乎', '中文互联网高质量的问答社区', 'https://www.zhihu.com', 'fas fa-comment-dots', 3),
  (1, '微博', '随时随地发现新鲜事', 'https://weibo.com', 'fab fa-weibo', 4),
  (1, '百度', '全球最大的中文搜索引擎', 'https://www.baidu.com', 'fab fa-baidu', 5);

-- 设计资源
INSERT INTO navis (category_id, title, description, url, icon, sort_order) VALUES
  (2, 'Dribbble', '全球设计师作品分享平台', 'https://dribbble.com', 'fab fa-dribbble', 1),
  (2, 'Behance', 'Adobe 旗下设计师作品集平台', 'https://www.behance.net', 'fab fa-behance', 2),
  (2, 'Pinterest', '全球美图收藏发现平台', 'https://www.pinterest.com', 'fab fa-pinterest', 3),
  (2, '站酷', '中国人气设计师互动平台', 'https://www.zcool.com.cn', 'fas fa-palette', 4),
  (2, 'Unsplash', '高质量免费图片分享网站', 'https://unsplash.com', 'fas fa-image', 5);

-- 开发工具
INSERT INTO navis (category_id, title, description, url, icon, sort_order) VALUES
  (3, 'GitHub', '全球最大的代码托管平台', 'https://github.com', 'fab fa-github', 1),
  (3, 'Stack Overflow', '全球最大的程序员问答社区', 'https://stackoverflow.com', 'fab fa-stack-overflow', 2),
  (3, 'V2EX', '创意工作者们的社区', 'https://www.v2ex.com', 'fas fa-comments', 3),
  (3, '掘金', '帮助开发者成长的社区', 'https://juejin.cn', 'fas fa-gem', 4),
  (3, 'MDN', 'Mozilla 开发者网络文档', 'https://developer.mozilla.org', 'fab fa-firefox', 5);

-- 娱乐影音
INSERT INTO navis (category_id, title, description, url, icon, sort_order) VALUES
  (4, 'YouTube', '全球最大的视频分享网站', 'https://www.youtube.com', 'fab fa-youtube', 1),
  (4, '网易云音乐', '网易推出的音乐播放平台', 'https://music.163.com', 'fas fa-music', 2),
  (4, 'QQ 音乐', '腾讯旗下的在线音乐平台', 'https://y.qq.com', 'fas fa-compact-disc', 3),
  (4, '爱奇艺', '中国领先的视频平台', 'https://www.iqiyi.com', 'fas fa-film', 4),
  (4, '腾讯视频', '中国领先的在线视频媒体平台', 'https://v.qq.com', 'fas fa-play-circle', 5);

-- 学习教育
INSERT INTO navis (category_id, title, description, url, icon, sort_order) VALUES
  (5, 'Coursera', '全球领先的在线学习平台', 'https://www.coursera.org', 'fas fa-graduation-cap', 1),
  (5, 'B 站课堂', '哔哩哔哩学习区', 'https://www.bilibili.com/v/knowledge', 'fas fa-chalkboard-teacher', 2),
  (5, '慕课网', '中国领先的 IT 技能学习平台', 'https://www.imooc.com', 'fas fa-laptop-code', 3),
  (5, '得到', '终身学习平台', 'https://www.dedao.cn', 'fas fa-book-reader', 4),
  (5, '维基百科', '自由的百科全书', 'https://zh.wikipedia.org', 'fab fa-wikipedia-w', 5);
