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
