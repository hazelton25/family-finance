import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { all, get, run } from '../db/database.js';
const router = Router();

router.get('/', (req, res) => {
  const cats = all(`SELECT c.*, (SELECT COUNT(*) FROM transactions t WHERE t.category_id = c.id) as transaction_count FROM categories c ORDER BY c.type, c.sort_order, c.name`);
  const subs = all(`SELECT * FROM subcategories ORDER BY name`);
  res.json(cats.map(cat => ({ ...cat, subcategories: subs.filter(s => s.category_id === cat.id) })));
});

router.post('/', (req, res) => {
  try {
    const { name, type, color, icon } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'name and type required' });
    const maxOrder = get('SELECT MAX(sort_order) as m FROM categories')?.m || 0;
    const id = uuidv4();
    run('INSERT INTO categories (id,name,type,color,icon,sort_order) VALUES (?,?,?,?,?,?)',
      [id, String(name).trim(), type, color || '#4e8cff', icon || '💰', Number(maxOrder) + 1]);
    // Return the inserted data directly rather than re-querying
    res.status(201).json({ id, name: String(name).trim(), type, color: color || '#4e8cff', icon: icon || '💰', sort_order: Number(maxOrder) + 1, transaction_count: 0, subcategories: [] });
  } catch (e) {
    console.error('POST /categories error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const cat = get('SELECT * FROM categories WHERE id=?', [req.params.id]);
    if (!cat) return res.status(404).json({ error: 'Not found' });
    const { name, type, color, icon } = req.body;
    run('UPDATE categories SET name=?,type=?,color=?,icon=? WHERE id=?',
      [name ?? cat.name, type ?? cat.type, color ?? cat.color, icon ?? cat.icon, req.params.id]);
    res.json({ ...cat, name: name ?? cat.name, type: type ?? cat.type, color: color ?? cat.color, icon: icon ?? cat.icon });
  } catch (e) {
    console.error('PUT /categories error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', (req, res) => {
  const txCount = get('SELECT COUNT(*) as n FROM transactions WHERE category_id=?', [req.params.id])?.n || 0;
  if (txCount > 0) return res.status(400).json({ error: `Category has ${txCount} transactions` });
  run('DELETE FROM subcategories WHERE category_id=?', [req.params.id]);
  run('DELETE FROM categories WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

router.post('/:id/subcategories', (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const id = uuidv4();
    run('INSERT INTO subcategories (id,category_id,name) VALUES (?,?,?)', [id, req.params.id, name]);
    res.status(201).json({ id, category_id: req.params.id, name });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/subcategories/:subId', (req, res) => {
  run('DELETE FROM subcategories WHERE id=?', [req.params.subId]);
  res.json({ ok: true });
});

// Also support /:id/subcategories/:subId for compatibility
router.delete('/:id/subcategories/:subId', (req, res) => {
  run('DELETE FROM subcategories WHERE id=?', [req.params.subId]);
  res.json({ ok: true });
});

export default router;
