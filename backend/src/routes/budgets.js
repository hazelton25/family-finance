import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { all, get, run } from '../db/database.js';
const router = Router();

router.get('/', (req, res) => {
  const now = new Date();
  const y = parseInt(req.query.year || now.getFullYear());
  const m = parseInt(req.query.month || now.getMonth()+1);
  const monthStr = `${y}-${String(m).padStart(2,'0')}`;

  const budgets = all(`
    SELECT b.id, b.category_id, b.amount as budget_amount, b.year, b.month,
      c.name as category_name, c.color, c.icon, c.type as category_type,
      COALESCE(act.actual,0) as actual_amount, COALESCE(act.tx_count,0) as transaction_count
    FROM budgets b
    JOIN categories c ON c.id = b.category_id
    LEFT JOIN (
      SELECT category_id, SUM(amount) as actual, COUNT(*) as tx_count
      FROM transactions WHERE type='expense' AND strftime('%Y-%m',date) = '${monthStr}'
      GROUP BY category_id
    ) act ON act.category_id = b.category_id
    WHERE b.year = ? AND b.month = ?
    ORDER BY c.name
  `, [y, m]);

  const budgetedIds = budgets.map(b => b.category_id);
  const unbudgeted = all(`
    SELECT t.category_id, SUM(t.amount) as actual_amount, COUNT(*) as transaction_count,
      c.name as category_name, c.color, c.icon
    FROM transactions t JOIN categories c ON c.id=t.category_id
    WHERE t.type='expense' AND strftime('%Y-%m',t.date) = '${monthStr}'
    ${budgetedIds.length ? `AND t.category_id NOT IN (${budgetedIds.map(()=>'?').join(',')})` : ''}
    GROUP BY t.category_id ORDER BY actual_amount DESC
  `, budgetedIds);

  res.json({ budgets, unbudgeted, year: y, month: m });
});

router.post('/', (req, res) => {
  const { category_id, amount, year, month } = req.body;
  if (!category_id||amount==null||!year||!month) return res.status(400).json({ error: 'category_id, amount, year, month required' });
  const existing = get('SELECT * FROM budgets WHERE category_id=? AND year=? AND month=?', [category_id, year, month]);
  if (existing) {
    run('UPDATE budgets SET amount=? WHERE id=?', [Number(amount), existing.id]);
    return res.json(get('SELECT * FROM budgets WHERE id=?', [existing.id]));
  }
  const id = uuidv4();
  run('INSERT INTO budgets (id,category_id,amount,year,month) VALUES (?,?,?,?,?)', [id, category_id, Number(amount), year, month]);
  res.status(201).json(get('SELECT * FROM budgets WHERE id=?', [id]));
});

router.put('/:id', (req, res) => {
  run('UPDATE budgets SET amount=? WHERE id=?', [Number(req.body.amount), req.params.id]);
  res.json(get('SELECT * FROM budgets WHERE id=?', [req.params.id]));
});

router.delete('/:id', (req, res) => {
  run('DELETE FROM budgets WHERE id=?', [req.params.id]);
  res.json({ success: true });
});

router.get('/performance', (req, res) => {
  const now = new Date();
  const y = parseInt(req.query.year || now.getFullYear());
  const m = parseInt(req.query.month || now.getMonth()+1);
  const monthStr = `${y}-${String(m).padStart(2,'0')}`;

  const perf = all(`
    SELECT c.id as category_id, c.name as category_name, c.color, c.icon, c.type,
      COALESCE(b.amount, 0) as budget,
      COALESCE(act.actual, 0) as actual
    FROM categories c
    LEFT JOIN budgets b ON b.category_id = c.id AND b.year = ? AND b.month = ?
    LEFT JOIN (
      SELECT category_id, SUM(amount) as actual
      FROM transactions WHERE type='expense' AND strftime('%Y-%m',date) = ?
      GROUP BY category_id
    ) act ON act.category_id = c.id
    WHERE (c.type = 'expense' OR c.type = 'both') AND (b.id IS NOT NULL OR act.actual > 0)
    ORDER BY COALESCE(act.actual, 0) DESC
  `, [y, m, monthStr]);

  res.json(perf);
});

router.post('/copy', (req, res) => {
  const { from_year, from_month, to_year, to_month } = req.body;
  const froms = all('SELECT * FROM budgets WHERE year=? AND month=?', [from_year, from_month]);
  let copied = 0, skipped = 0;
  froms.forEach(b => {
    const exists = get('SELECT id FROM budgets WHERE category_id=? AND year=? AND month=?', [b.category_id, to_year, to_month]);
    if (!exists) {
      run('INSERT INTO budgets (id,category_id,amount,year,month) VALUES (?,?,?,?,?)', [uuidv4(), b.category_id, b.amount, to_year, to_month]);
      copied++;
    } else skipped++;
  });
  res.json({ copied, skipped });
});

export default router;
