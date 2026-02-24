// 简单的基于 Session 的认证

export async function login(db, password, adminPassword) {
  const configPassword = adminPassword || 'admin123';

  if (password !== configPassword) {
    return { success: false, error: '密码错误' };
  }

  // 生成 token
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 天有效期

  await db.prepare(
    'INSERT INTO admin_sessions (token, expires_at) VALUES (?, ?)'
  ).bind(token, expiresAt.toISOString()).run();

  return { success: true, token };
}

export async function verifyToken(db, token) {
  if (!token) return false;

  const result = await db.prepare(
    'SELECT * FROM admin_sessions WHERE token = ? AND expires_at > ?'
  ).bind(token, new Date().toISOString()).first();

  return !!result;
}

export async function logout(db, token) {
  if (!token) return;
  await db.prepare('DELETE FROM admin_sessions WHERE token = ?').bind(token).run();
}
