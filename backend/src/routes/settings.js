import { Router } from 'express';
import { all, run, transaction } from '../db/database.js';
import { seed } from '../db/seed.js';

const router = Router();

router.get('/', (req, res) => {
  const rows = all('SELECT * FROM settings');
  const s = {};
  rows.forEach(r => s[r.key] = r.value);
  res.json(s);
});

router.put('/', (req, res) => {
  Object.entries(req.body).forEach(([key, value]) => {
    run('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)', [key, String(value)]);
  });
  const rows = all('SELECT * FROM settings');
  const s = {};
  rows.forEach(r => s[r.key] = r.value);
  res.json(s);
});

router.post('/reseed', (req, res) => {
  try {
    transaction(({ exec }) => {
      exec('DELETE FROM budgets');
      exec('DELETE FROM transactions');
      exec('DELETE FROM subcategories');
      exec('DELETE FROM categories');
      exec('DELETE FROM settings');
    });
    seed();
    res.json({ ok: true, message: 'Reseeded successfully' });
  } catch (e) {
    console.error('Reseed error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

export default router;
