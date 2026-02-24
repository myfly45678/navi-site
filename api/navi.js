// 导航网址 CRUD 操作

export async function getCategories(db) {
  const result = await db.prepare('SELECT * FROM categories ORDER BY sort_order, id').all();
  return result.results || [];
}

export async function getCategory(db, id) {
  const result = await db.prepare('SELECT * FROM categories WHERE id = ?').bind(id).first();
  return result;
}

export async function createCategory(db, name, description, sortOrder = 0) {
  const result = await db.prepare(
    'INSERT INTO categories (name, description, sort_order) VALUES (?, ?, ?)'
  ).bind(name, description, sortOrder).run();
  return result.meta.last_row_id;
}

export async function updateCategory(db, id, name, description, sortOrder) {
  await db.prepare(
    'UPDATE categories SET name = ?, description = ?, sort_order = ? WHERE id = ?'
  ).bind(name, description, sortOrder, id).run();
}

export async function deleteCategory(db, id) {
  await db.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();
}

export async function getNavis(db, categoryId = null) {
  if (categoryId) {
    const result = await db.prepare(
      'SELECT * FROM navis WHERE category_id = ? ORDER BY sort_order, id'
    ).bind(categoryId).all();
    return result.results || [];
  } else {
    const result = await db.prepare('SELECT * FROM navis ORDER BY sort_order, id').all();
    return result.results || [];
  }
}

export async function getNavi(db, id) {
  const result = await db.prepare('SELECT * FROM navis WHERE id = ?').bind(id).first();
  return result;
}

export async function createNavi(db, categoryId, title, description, url, icon = '', sortOrder = 0) {
  const result = await db.prepare(
    'INSERT INTO navis (category_id, title, description, url, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(categoryId, title, description, url, icon, sortOrder).run();
  return result.meta.last_row_id;
}

export async function updateNavi(db, id, categoryId, title, description, url, icon, sortOrder) {
  await db.prepare(
    'UPDATE navis SET category_id = ?, title = ?, description = ?, url = ?, icon = ?, sort_order = ? WHERE id = ?'
  ).bind(categoryId, title, description, url, icon, sortOrder, id).run();
}

export async function deleteNavi(db, id) {
  await db.prepare('DELETE FROM navis WHERE id = ?').bind(id).run();
}
