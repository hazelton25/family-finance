import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { all, get, run } from '../db/database.js';
import { stringify } from 'csv-stringify/sync';
import { parse } from 'csv-parse/sync';
const router = Router();

// sql.js doesn't support LIKE with wildcards on bound params the same way - we build filter manually
function buildWhere(q) {
  const conditions = ['1=1'];
  const params = [];
  if (q.type) { conditions.push('t.type = ?'); params.push(q.type); }
  if (q.category_id) { conditions.push('t.category_id = ?'); params.push(q.category_id); }
  if (q.month && q.year) {
    const m = String(q.month).padStart(2,'0');
    conditions.push(`strftime('%Y-%m', t.date) = ?`); params.push(`${q.year}-${m}`);
  }
  if (q.search) {
    conditions.push(`(t.description LIKE '%' || ? || '%' OR COALESCE(t.notes,'') LIKE '%' || ? || '%')`);
    params.push(q.search, q.search);
  }
  return { where: conditions.join(' AND '), params };
}

router.get('/', (req, res) => {
  const { where, params } = buildWhere(req.query);
  const allowed = ['date','amount','description','type'];
  const sortBy = allowed.includes(req.query.sort_by) ? `t.${req.query.sort_by}` : 't.date';
  const sortDir = req.query.sort_dir === 'ASC' ? 'ASC' : 'DESC';

  const transactions = all(`
    SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon, s.name as subcategory_name
    FROM transactions t
    LEFT JOIN categories c ON c.id = t.category_id
    LEFT JOIN subcategories s ON s.id = t.subcategory_id
    WHERE ${where}
    ORDER BY ${sortBy} ${sortDir}, t.created_at DESC
  `, params);

  const totals = all(`SELECT COUNT(*) as total FROM transactions t WHERE ${where}`, params);
  res.json({ transactions, total: Number(totals[0]?.total || 0) });
});

router.get('/stats/summary', (req, res) => {
  const { month, year } = req.query;
  const now = new Date();
  const y = year || now.getFullYear();
  const m = month || (now.getMonth()+1);
  const monthStr = `${y}-${String(m).padStart(2,'0')}`;

  const monthly = get(`
    SELECT SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as income,
           SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as expenses,
           COUNT(*) as transaction_count
    FROM transactions WHERE strftime('%Y-%m', date) = ?`, [monthStr]) || {};

  const byCategory = all(`
    SELECT c.id, c.name, c.color, c.icon, t.type, SUM(t.amount) as total, COUNT(*) as count
    FROM transactions t JOIN categories c ON c.id = t.category_id
    WHERE strftime('%Y-%m', t.date) = ?
    GROUP BY c.id, t.type ORDER BY total DESC`, [monthStr]);

  const trend = all(`
    SELECT strftime('%Y-%m', date) as month,
      SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as expenses
    FROM transactions
    WHERE date >= date('now', '-6 months')
    GROUP BY month ORDER BY month ASC`);

  const recent = all(`
    SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon, s.name as subcategory_name
    FROM transactions t
    LEFT JOIN categories c ON c.id = t.category_id
    LEFT JOIN subcategories s ON s.id = t.subcategory_id
    ORDER BY t.date DESC, t.created_at DESC LIMIT 10`);

  res.json({ monthly, by_category: byCategory, trend, recent });
});

router.get('/export/csv', (req, res) => {
  const rows = all(`
    SELECT t.date, t.type, t.amount, c.name as category, s.name as subcategory, t.description, t.notes, t.payment_method, t.is_recurring, t.recurring_frequency
    FROM transactions t LEFT JOIN categories c ON c.id=t.category_id LEFT JOIN subcategories s ON s.id=t.subcategory_id
    ORDER BY t.date DESC`);
  res.setHeader('Content-Type','text/csv');
  res.setHeader('Content-Disposition','attachment; filename="transactions.csv"');
  res.send(stringify(rows, { header: true }));
});

router.post('/import/csv', (req, res) => {
  const { csv_data } = req.body;
  if (!csv_data) return res.status(400).json({ error: 'csv_data required' });
  try {
    const records = parse(csv_data, { columns: true, skip_empty_lines: true, trim: true });
    const categories = all('SELECT * FROM categories');
    let imported = 0, skipped = 0;
    records.forEach(row => {
      const cat = categories.find(c => c.name.toLowerCase() === (row.category||'').toLowerCase());
      const amount = parseFloat(row.amount);
      if (!cat || isNaN(amount)) { skipped++; return; }
      try {
        run(`INSERT INTO transactions (id,date,amount,type,category_id,description,notes,payment_method,is_recurring) VALUES (?,?,?,?,?,?,?,?,?)`,
          [uuidv4(), row.date||new Date().toISOString().split('T')[0], Math.abs(amount), row.type||(amount<0?'expense':'income'), cat.id, row.description||'Imported', row.notes||null, row.payment_method||'bank', row.is_recurring==='true'?1:0]);
        imported++;
      } catch { skipped++; }
    });
    res.json({ imported, skipped, total: records.length });
  } catch(e) { res.status(400).json({ error: 'Invalid CSV: '+e.message }); }
});

router.post('/', (req, res) => {
  const { date, amount, type, category_id, subcategory_id, description, notes, payment_method, is_recurring, recurring_frequency } = req.body;
  if (!date||!amount||!type||!category_id||!description) return res.status(400).json({ error: 'Missing required fields' });
  const id = uuidv4();
  run(`INSERT INTO transactions (id,date,amount,type,category_id,subcategory_id,description,notes,payment_method,is_recurring,recurring_frequency) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [id, date, Math.abs(Number(amount)), type, category_id, subcategory_id||null, description, notes||null, payment_method||'bank', is_recurring?1:0, recurring_frequency||null]);
  res.status(201).json(get(`SELECT t.*,c.name as category_name,c.color as category_color,c.icon as category_icon FROM transactions t LEFT JOIN categories c ON c.id=t.category_id WHERE t.id=?`,[id]));
});

router.put('/:id', (req, res) => {
  const tx = get('SELECT * FROM transactions WHERE id=?', [req.params.id]);
  if (!tx) return res.status(404).json({ error: 'Not found' });
  const { date, amount, type, category_id, subcategory_id, description, notes, payment_method, is_recurring, recurring_frequency } = req.body;
  run(`UPDATE transactions SET date=?,amount=?,type=?,category_id=?,subcategory_id=?,description=?,notes=?,payment_method=?,is_recurring=?,recurring_frequency=?,updated_at=datetime('now') WHERE id=?`,
    [date??tx.date, amount!=null?Math.abs(Number(amount)):tx.amount, type??tx.type, category_id??tx.category_id, subcategory_id!==undefined?subcategory_id:tx.subcategory_id, description??tx.description, notes!==undefined?notes:tx.notes, payment_method??tx.payment_method, is_recurring!=null?(is_recurring?1:0):tx.is_recurring, recurring_frequency!==undefined?recurring_frequency:tx.recurring_frequency, req.params.id]);
  res.json(get(`SELECT t.*,c.name as category_name,c.color as category_color,c.icon as category_icon FROM transactions t LEFT JOIN categories c ON c.id=t.category_id WHERE t.id=?`,[req.params.id]));
});

router.delete('/:id', (req, res) => {
  run('DELETE FROM transactions WHERE id=?', [req.params.id]);
  res.json({ success: true });
});

router.delete('/', (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)||!ids.length) return res.status(400).json({ error: 'ids required' });
  ids.forEach(id => run('DELETE FROM transactions WHERE id=?', [id]));
  res.json({ deleted: ids.length });
});

// Clean summary endpoint used by Dashboard and Reports
router.get('/summary', (req, res) => {
  const { month, year } = req.query;
  const now = new Date();
  const y = parseInt(year || now.getFullYear());

  if (month) {
    // Monthly summary
    const m = parseInt(month);
    const monthStr = `${y}-${String(m).padStart(2,'0')}`;
    const row = get(`
      SELECT SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as income,
             SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as expenses
      FROM transactions WHERE strftime('%Y-%m', date) = ?`, [monthStr]) || {};
    const income = row.income || 0, expenses = row.expenses || 0;
    const net = income - expenses;
    const savings_rate = income > 0 ? ((net / income) * 100) : 0;

    const by_category = all(`
      SELECT c.id as category_id, c.name, c.color, c.icon, t.type, SUM(t.amount) as total, COUNT(*) as count
      FROM transactions t JOIN categories c ON c.id = t.category_id
      WHERE strftime('%Y-%m', t.date) = ?
      GROUP BY c.id, t.type ORDER BY total DESC`, [monthStr]);

    const trend = all(`
      SELECT strftime('%Y-%m', date) as month,
        SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as expenses
      FROM transactions
      WHERE date >= date(?, '-6 months') AND date <= date(?, '+1 month')
      GROUP BY month ORDER BY month ASC`, [monthStr, monthStr]);

    res.json({ income, expenses, net, savings_rate, by_category, trend });
  } else {
    // Yearly summary
    const by_category = all(`
      SELECT c.id as category_id, c.name, c.color, c.icon, t.type, SUM(t.amount) as total, COUNT(*) as count
      FROM transactions t JOIN categories c ON c.id = t.category_id
      WHERE strftime('%Y', t.date) = ?
      GROUP BY c.id, t.type ORDER BY total DESC`, [String(y)]);

    const row = get(`
      SELECT SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as income,
             SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as expenses
      FROM transactions WHERE strftime('%Y', date) = ?`, [String(y)]) || {};
    const income = row.income || 0, expenses = row.expenses || 0;
    const net = income - expenses;
    const savings_rate = income > 0 ? ((net / income) * 100) : 0;

    const trend = all(`
      SELECT strftime('%Y-%m', date) as month,
        SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as expenses
      FROM transactions WHERE strftime('%Y', date) = ?
      GROUP BY month ORDER BY month ASC`, [String(y)]);

    res.json({ income, expenses, net, savings_rate, by_category, trend });
  }
});

export default router;
