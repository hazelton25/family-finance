// Detect the app's base path from the current URL
// e.g. if served at /finance/dashboard, base is /finance
// If served at /, base is empty string
function getBase() {
  const path = window.location.pathname;
  // Find the app's mount point by looking for known routes
  const routes = ['/dashboard', '/transactions', '/budgets', '/reports', '/categories', '/settings'];
  for (const route of routes) {
    if (path.includes(route)) {
      return path.substring(0, path.indexOf(route));
    }
  }
  // Fallback: strip trailing slash from pathname up to first segment
  const parts = path.split('/').filter(Boolean);
  return parts.length > 1 ? '/' + parts[0] : '';
}

const BASE = (typeof window !== 'undefined' ? getBase() : '') + '/api';

async function req(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Transactions
  getTransactions: (params = {}) => req('/transactions?' + new URLSearchParams(params)),
  getSummary: (params = {}) => req('/transactions/summary?' + new URLSearchParams(params)),
  createTransaction: (data) => req('/transactions', { method: 'POST', body: data }),
  updateTransaction: (id, data) => req(`/transactions/${id}`, { method: 'PUT', body: data }),
  deleteTransaction: (id) => req(`/transactions/${id}`, { method: 'DELETE' }),
  deleteTransactions: (ids) => req('/transactions', { method: 'DELETE', body: { ids } }),

  // Categories
  getCategories: () => req('/categories'),
  createCategory: (data) => req('/categories', { method: 'POST', body: data }),
  updateCategory: (id, data) => req(`/categories/${id}`, { method: 'PUT', body: data }),
  deleteCategory: (id) => req(`/categories/${id}`, { method: 'DELETE' }),
  createSubcategory: (catId, data) => req(`/categories/${catId}/subcategories`, { method: 'POST', body: data }),
  deleteSubcategory: (id) => req(`/categories/subcategories/${id}`, { method: 'DELETE' }),

  // Budgets
  getBudgets: (params = {}) => req('/budgets?' + new URLSearchParams(params)),
  getBudgetPerformance: (params = {}) => req('/budgets/performance?' + new URLSearchParams(params)),
  createBudget: (data) => req('/budgets', { method: 'POST', body: data }),
  updateBudget: (id, data) => req(`/budgets/${id}`, { method: 'PUT', body: data }),
  deleteBudget: (id) => req(`/budgets/${id}`, { method: 'DELETE' }),
  copyBudgets: (data) => req('/budgets/copy', { method: 'POST', body: data }),

  // Settings
  getSettings: () => req('/settings'),
  updateSettings: (data) => req('/settings', { method: 'PUT', body: data }),
  reseed: () => req('/settings/reseed', { method: 'POST' }),
};

export const fmt = {
  currency: (n) => '$' + Math.abs(n || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  percent: (n) => `${(n || 0).toFixed(1)}%`,
  date: (d) => {
    if (!d) return '';
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
  },
  shortDate: (d) => {
    if (!d) return '';
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
  },
  monthYear: (d) => {
    if (!d) return '';
    const [y, m] = d.split('-');
    return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString('en-CA', { month: 'long', year: 'numeric' });
  },
  shortMonth: (d) => {
    const [y, m] = d.split('-');
    return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString('en-CA', { month: 'short' });
  },
};
