import express from 'express';
import cors from 'cors';
import categoriesRouter from './routes/categories.js';
import transactionsRouter from './routes/transactions.js';
import budgetsRouter from './routes/budgets.js';
import settingsRouter from './routes/settings.js';
import { seedIfEmpty } from './db/seed.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/categories', categoriesRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/budgets', budgetsRouter);
app.use('/api/settings', settingsRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

// Auto-seed on first run (no-op if data already exists)
seedIfEmpty();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Family Finance API — http://localhost:${PORT}\n`);
});
app.post('/api/transactions/batch', (req, res) => {
    const { transactions } = req.body;
    
    if (!Array.isArray(transactions) || transactions.length === 0) {
        return res.status(400).json({ error: "No transactions provided" });
    }

    const insertStmt = db.prepare(`
        INSERT INTO transactions (id, date, amount, payee, category_id, paid_by) 
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    db.exec("BEGIN TRANSACTION");
    try {
        transactions.forEach(t => {
            insertStmt.run([
                t.id, 
                t.date, 
                t.amount, 
                t.payee, 
                t.category_id, 
                t.paid_by || null
            ]);
        });
        db.exec("COMMIT");
        
        // Force sql.js to write the buffer out to ./data/hearth.sqlite
        saveDatabaseToDisk(); 
        res.json({ success: true, count: transactions.length });
    } catch (err) {
        db.exec("ROLLBACK");
        res.status(500).json({ error: err.message });
    }
});
function processGhostSubscriptions() {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonthKey = today.toISOString().slice(0, 7); // Returns "2026-06"

    // Grab all bills due today (or earlier in the month) that haven't been charged for June yet
    const pendingBills = db.exec(`
        SELECT * FROM recurring_bills 
        WHERE day_of_month <= ${currentDay} 
        AND (last_processed_month IS NULL OR last_processed_month != '${currentMonthKey}')
    `);

    if (!pendingBills[0]) return;

    const bills = pendingBills[0].values;
    db.exec("BEGIN TRANSACTION");
    
    try {
        bills.forEach(bill => {
            const [id, payee, amount, cat_id, paid_by, day] = bill;
            const transId = 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
            const dateStr = `${currentMonthKey}-${String(day).padStart(2, '0')}`;

            // Inject into ledger
            db.run(`INSERT INTO transactions (id, date, amount, payee, category_id, paid_by) 
                    VALUES (?, ?, ?, ?, ?, ?)`, 
                    [transId, dateStr, amount, payee, cat_id, paid_by]);

            // Mark bill as paid for this month
            db.run(`UPDATE recurring_bills SET last_processed_month = ? WHERE id = ?`, 
                    [currentMonthKey, id]);
        });
        db.exec("COMMIT");
        saveDatabaseToDisk();
    } catch (e) {
        db.exec("ROLLBACK");
        console.error("Failed to inject ghost subscriptions:", e);
    }
}
