import { get, run, transaction, all } from './database.js';
import { v4 as uuidv4 } from 'uuid';

const CATEGORIES = [
  // Income
  { name: 'Employment Income',    type: 'income',  color: '#10b981', icon: '💼' },
  { name: 'Freelance / Side Income', type: 'income', color: '#06b6d4', icon: '💻' },
  { name: 'Investment Income',    type: 'income',  color: '#8b5cf6', icon: '📈' },
  { name: 'Government Benefits',  type: 'income',  color: '#f59e0b', icon: '🏛️' },
  { name: 'Other Income',         type: 'income',  color: '#94a3b8', icon: '💰' },

  // Housing
  { name: 'Mortgage / Rent',      type: 'expense', color: '#ef4444', icon: '🏠' },
  { name: 'Property Tax',         type: 'expense', color: '#dc2626', icon: '🏛️' },
  { name: 'Home Insurance',       type: 'expense', color: '#f97316', icon: '🛡️' },
  { name: 'Utilities',            type: 'expense', color: '#f59e0b', icon: '⚡' },
  { name: 'Home Maintenance',     type: 'expense', color: '#84cc16', icon: '🔨' },
  { name: 'Home Improvement',     type: 'expense', color: '#22c55e', icon: '🏗️' },
  { name: 'Cleaning / Household', type: 'expense', color: '#14b8a6', icon: '🧹' },

  // Food
  { name: 'Groceries',            type: 'expense', color: '#10b981', icon: '🛒' },
  { name: 'Restaurants',          type: 'expense', color: '#f59e0b', icon: '🍽️' },
  { name: 'Coffee / Snacks',      type: 'expense', color: '#92400e', icon: '☕' },

  // Transport
  { name: 'Gas',                  type: 'expense', color: '#3b82f6', icon: '⛽' },
  { name: 'Vehicle Insurance',    type: 'expense', color: '#1d4ed8', icon: '🚗' },
  { name: 'Vehicle Maintenance',  type: 'expense', color: '#6366f1', icon: '🔧' },
  { name: 'Parking / Tolls',      type: 'expense', color: '#7c3aed', icon: '🅿️' },
  { name: 'Public Transit',       type: 'expense', color: '#0ea5e9', icon: '🚌' },

  // Kids
  { name: 'School & Tuition',     type: 'expense', color: '#f97316', icon: '🎓' },
  { name: 'School Supplies',      type: 'expense', color: '#fb923c', icon: '📚' },
  { name: 'Kids Sports',          type: 'expense', color: '#0ea5e9', icon: '⚽' },
  { name: 'Kids Activities',      type: 'expense', color: '#ec4899', icon: '🎨' },
  { name: 'Kids Clothing',        type: 'expense', color: '#a855f7', icon: '👕' },
  { name: 'Kids Allowance',       type: 'expense', color: '#8b5cf6', icon: '💵' },
  { name: 'Childcare / Camps',    type: 'expense', color: '#06b6d4', icon: '🏕️' },

  // Health
  { name: 'Dental',               type: 'expense', color: '#ef4444', icon: '🦷' },
  { name: 'Medical / Pharmacy',   type: 'expense', color: '#dc2626', icon: '🏥' },
  { name: 'Vision',               type: 'expense', color: '#f97316', icon: '👓' },
  { name: 'Orthodontics',         type: 'expense', color: '#e11d48', icon: '😁' },
  { name: 'Fitness / Gym',        type: 'expense', color: '#10b981', icon: '💪' },

  // Personal
  { name: 'Clothing / Adults',    type: 'expense', color: '#f472b6', icon: '👗' },
  { name: 'Personal Care',        type: 'expense', color: '#06b6d4', icon: '🪥' },
  { name: 'Hair / Grooming',      type: 'expense', color: '#0891b2', icon: '💇' },

  // Lifestyle
  { name: 'Entertainment',        type: 'expense', color: '#a855f7', icon: '🎬' },
  { name: 'Subscriptions',        type: 'expense', color: '#8b5cf6', icon: '📺' },
  { name: 'Vacation / Travel',    type: 'expense', color: '#14b8a6', icon: '✈️' },
  { name: 'Gifts & Occasions',    type: 'expense', color: '#ec4899', icon: '🎁' },
  { name: 'Pets',                 type: 'expense', color: '#84cc16', icon: '🐾' },

  // Finance
  { name: 'Life Insurance',       type: 'expense', color: '#64748b', icon: '🛡️' },
  { name: 'Savings / TFSA',       type: 'expense', color: '#6366f1', icon: '🏦' },
  { name: 'RRSP',                 type: 'expense', color: '#4f46e5', icon: '📊' },
  { name: 'RESP',                 type: 'expense', color: '#7c3aed', icon: '🎓' },
  { name: 'Debt Repayment',       type: 'expense', color: '#dc2626', icon: '💳' },
  { name: 'Bank Fees',            type: 'expense', color: '#94a3b8', icon: '🏧' },
  { name: 'Miscellaneous',        type: 'expense', color: '#94a3b8', icon: '📦' },
];

const SUBCATEGORIES = {
  'Utilities':           ['Electricity', 'Natural Gas', 'Internet', 'Phone', 'Water'],
  'Groceries':           ['Superstore', 'Costco', 'Safeway', 'Walmart', 'Farmers Market'],
  'Restaurants':         ['Takeout', 'Sit Down', 'Fast Food', 'Pizza'],
  'Kids Sports':         ['Hockey', 'Soccer', 'Basketball', 'Swimming', 'Baseball', 'Registration', 'Equipment', 'Tournament'],
  'Kids Activities':     ['Music Lessons', 'Art Class', 'Drama', 'Tutoring', 'Summer Camp'],
  'School & Tuition':    ['School Fees', 'Field Trips', 'Fundraising', 'Uniforms'],
  'Subscriptions':       ['Netflix', 'Spotify', 'Disney+', 'Amazon Prime', 'Apple', 'YouTube Premium'],
  'Vacation / Travel':   ['Flights', 'Hotel', 'Car Rental', 'Activities', 'Food'],
  'Home Maintenance':    ['Repairs', 'Lawn & Garden', 'Snow Removal', 'Cleaning Supplies'],
  'Savings / TFSA':      ['Emergency Fund', 'Short Term', 'Investments'],
  'Vehicle Maintenance': ['Oil Change', 'Tires', 'Repairs', 'Car Wash'],
  'Medical / Pharmacy':  ['Doctor', 'Pharmacy', 'Specialist', 'Physio'],
};

function ds(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

function md(monthsAgo, day) {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
  return d.toISOString().split('T')[0];
}

export function seed() {
  console.log('Seeding...');

  const catMap = {};
  const subMap = {};

  transaction(({ exec }) => {
    CATEGORIES.forEach((cat, i) => {
      const id = uuidv4();
      catMap[cat.name] = id;
      exec(
        'INSERT INTO categories (id, name, type, color, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
        [id, cat.name, cat.type, cat.color, cat.icon, i]
      );
    });

    Object.entries(SUBCATEGORIES).forEach(([catName, subs]) => {
      const catId = catMap[catName];
      if (!catId) return;
      subs.forEach(sub => {
        const id = uuidv4();
        if (!subMap[catName]) subMap[catName] = {};
        subMap[catName][sub] = id;
        try {
          exec('INSERT INTO subcategories (id, category_id, name) VALUES (?, ?, ?)', [id, catId, sub]);
        } catch {}
      });
    });
  });

  const c = (name) => catMap[name] || null;
  const s = (cat, sub) => (subMap[cat] && subMap[cat][sub]) || null;

  // Transactions: [date, amount, type, category_id, subcategory_id, description, notes, payment_method, is_recurring, recurring_frequency]
  const TX = [
    // ── INCOME ──────────────────────────────────────────────────────────
    [md(0,1),  5800, 'income', c('Employment Income'),    null, 'Paycheque - Partner 1',    null, 'Bank Transfer', 1, 'biweekly'],
    [md(0,15), 5800, 'income', c('Employment Income'),    null, 'Paycheque - Partner 1',    null, 'Bank Transfer', 1, 'biweekly'],
    [md(0,1),  4200, 'income', c('Employment Income'),    null, 'Paycheque - Partner 2',    null, 'Bank Transfer', 1, 'biweekly'],
    [md(0,15), 4200, 'income', c('Employment Income'),    null, 'Paycheque - Partner 2',    null, 'Bank Transfer', 1, 'biweekly'],
    [md(0,20),  327, 'income', c('Government Benefits'),  null, 'CCB Payment',              null, 'Bank Transfer', 1, 'monthly'],

    [md(1,1),  5800, 'income', c('Employment Income'),    null, 'Paycheque - Partner 1',    null, 'Bank Transfer', 1, 'biweekly'],
    [md(1,15), 5800, 'income', c('Employment Income'),    null, 'Paycheque - Partner 1',    null, 'Bank Transfer', 1, 'biweekly'],
    [md(1,1),  4200, 'income', c('Employment Income'),    null, 'Paycheque - Partner 2',    null, 'Bank Transfer', 1, 'biweekly'],
    [md(1,15), 4200, 'income', c('Employment Income'),    null, 'Paycheque - Partner 2',    null, 'Bank Transfer', 1, 'biweekly'],
    [md(1,20),  327, 'income', c('Government Benefits'),  null, 'CCB Payment',              null, 'Bank Transfer', 1, 'monthly'],
    [md(1,10),  850, 'income', c('Freelance / Side Income'), null, 'Freelance project',     null, 'E-Transfer',    0, null],

    [md(2,1),  5800, 'income', c('Employment Income'),    null, 'Paycheque - Partner 1',    null, 'Bank Transfer', 1, 'biweekly'],
    [md(2,15), 5800, 'income', c('Employment Income'),    null, 'Paycheque - Partner 1',    null, 'Bank Transfer', 1, 'biweekly'],
    [md(2,1),  4200, 'income', c('Employment Income'),    null, 'Paycheque - Partner 2',    null, 'Bank Transfer', 1, 'biweekly'],
    [md(2,15), 4200, 'income', c('Employment Income'),    null, 'Paycheque - Partner 2',    null, 'Bank Transfer', 1, 'biweekly'],
    [md(2,20),  327, 'income', c('Government Benefits'),  null, 'CCB Payment',              null, 'Bank Transfer', 1, 'monthly'],

    // ── HOUSING ─────────────────────────────────────────────────────────
    [md(0,1),  2650, 'expense', c('Mortgage / Rent'),     null, 'Mortgage payment',         null, 'Bank Transfer', 1, 'monthly'],
    [md(1,1),  2650, 'expense', c('Mortgage / Rent'),     null, 'Mortgage payment',         null, 'Bank Transfer', 1, 'monthly'],
    [md(2,1),  2650, 'expense', c('Mortgage / Rent'),     null, 'Mortgage payment',         null, 'Bank Transfer', 1, 'monthly'],

    [md(0,15),  420, 'expense', c('Property Tax'),        null, 'Property tax installment', null, 'Bank Transfer', 1, 'monthly'],
    [md(1,15),  420, 'expense', c('Property Tax'),        null, 'Property tax installment', null, 'Bank Transfer', 1, 'monthly'],

    [md(0,5),   185, 'expense', c('Home Insurance'),      null, 'Home insurance',           null, 'Bank Transfer', 1, 'monthly'],
    [md(1,5),   185, 'expense', c('Home Insurance'),      null, 'Home insurance',           null, 'Bank Transfer', 1, 'monthly'],
    [md(2,5),   185, 'expense', c('Home Insurance'),      null, 'Home insurance',           null, 'Bank Transfer', 1, 'monthly'],

    [md(0,10),  145, 'expense', c('Utilities'), s('Utilities','Electricity'), 'Electricity bill', null, 'Bank Transfer', 1, 'monthly'],
    [md(0,10),   89, 'expense', c('Utilities'), s('Utilities','Natural Gas'),  'Gas bill',         null, 'Bank Transfer', 1, 'monthly'],
    [md(0,10),  110, 'expense', c('Utilities'), s('Utilities','Internet'),     'Internet - Bell',  null, 'Bank Transfer', 1, 'monthly'],
    [md(0,10),  185, 'expense', c('Utilities'), s('Utilities','Phone'),        'Family phone plan',null, 'Bank Transfer', 1, 'monthly'],
    [md(1,10),  138, 'expense', c('Utilities'), s('Utilities','Electricity'), 'Electricity bill', null, 'Bank Transfer', 1, 'monthly'],
    [md(1,10),   92, 'expense', c('Utilities'), s('Utilities','Natural Gas'),  'Gas bill',         null, 'Bank Transfer', 1, 'monthly'],
    [md(1,10),  110, 'expense', c('Utilities'), s('Utilities','Internet'),     'Internet - Bell',  null, 'Bank Transfer', 1, 'monthly'],
    [md(1,10),  185, 'expense', c('Utilities'), s('Utilities','Phone'),        'Family phone plan',null, 'Bank Transfer', 1, 'monthly'],
    [md(2,10),  152, 'expense', c('Utilities'), s('Utilities','Electricity'), 'Electricity bill', null, 'Bank Transfer', 1, 'monthly'],
    [md(2,10),   98, 'expense', c('Utilities'), s('Utilities','Natural Gas'),  'Gas bill',         null, 'Bank Transfer', 1, 'monthly'],
    [md(2,10),  110, 'expense', c('Utilities'), s('Utilities','Internet'),     'Internet - Bell',  null, 'Bank Transfer', 1, 'monthly'],
    [md(2,10),  185, 'expense', c('Utilities'), s('Utilities','Phone'),        'Family phone plan',null, 'Bank Transfer', 1, 'monthly'],

    [md(0,18),  320, 'expense', c('Home Maintenance'), s('Home Maintenance','Lawn & Garden'), 'Lawn care', null, 'Cash', 0, null],
    [md(1,22),  175, 'expense', c('Home Maintenance'), s('Home Maintenance','Repairs'),       'Bathroom faucet repair', null, 'Credit Card', 0, null],
    [md(2,8),   240, 'expense', c('Home Maintenance'), s('Home Maintenance','Snow Removal'),  'Snow removal service', null, 'E-Transfer', 0, null],
    [md(0,25), 1850, 'expense', c('Home Improvement'),  null, 'Basement flooring deposit', null, 'Credit Card', 0, null],

    // ── FOOD ────────────────────────────────────────────────────────────
    [md(0,3),   310, 'expense', c('Groceries'), s('Groceries','Costco'),      'Costco run',        null, 'Credit Card', 0, null],
    [md(0,7),   185, 'expense', c('Groceries'), s('Groceries','Superstore'),  'Weekly groceries',  null, 'Credit Card', 0, null],
    [md(0,12),  195, 'expense', c('Groceries'), s('Groceries','Superstore'),  'Weekly groceries',  null, 'Credit Card', 0, null],
    [md(0,17),  290, 'expense', c('Groceries'), s('Groceries','Costco'),      'Costco run',        null, 'Credit Card', 0, null],
    [md(0,21),  170, 'expense', c('Groceries'), s('Groceries','Safeway'),     'Top up shop',       null, 'Debit Card',  0, null],
    [md(0,26),  205, 'expense', c('Groceries'), s('Groceries','Superstore'),  'Weekly groceries',  null, 'Credit Card', 0, null],
    [md(1,4),   325, 'expense', c('Groceries'), s('Groceries','Costco'),      'Costco run',        null, 'Credit Card', 0, null],
    [md(1,9),   180, 'expense', c('Groceries'), s('Groceries','Superstore'),  'Weekly groceries',  null, 'Credit Card', 0, null],
    [md(1,14),  175, 'expense', c('Groceries'), s('Groceries','Superstore'),  'Weekly groceries',  null, 'Credit Card', 0, null],
    [md(1,19),  295, 'expense', c('Groceries'), s('Groceries','Costco'),      'Costco run',        null, 'Credit Card', 0, null],
    [md(1,24),  165, 'expense', c('Groceries'), s('Groceries','Walmart'),     'Grocery pickup',    null, 'Credit Card', 0, null],
    [md(2,5),   305, 'expense', c('Groceries'), s('Groceries','Costco'),      'Costco run',        null, 'Credit Card', 0, null],
    [md(2,11),  190, 'expense', c('Groceries'), s('Groceries','Superstore'),  'Weekly groceries',  null, 'Credit Card', 0, null],
    [md(2,18),  178, 'expense', c('Groceries'), s('Groceries','Superstore'),  'Weekly groceries',  null, 'Credit Card', 0, null],
    [md(2,24),  285, 'expense', c('Groceries'), s('Groceries','Costco'),      'Costco run',        null, 'Credit Card', 0, null],

    [md(0,6),    87, 'expense', c('Restaurants'), s('Restaurants','Takeout'),    'Thai takeout',       null, 'Credit Card', 0, null],
    [md(0,13),  145, 'expense', c('Restaurants'), s('Restaurants','Sit Down'),   'Family dinner out',  null, 'Credit Card', 0, null],
    [md(0,20),   54, 'expense', c('Restaurants'), s('Restaurants','Pizza'),      'Pizza night',        null, 'Credit Card', 0, null],
    [md(1,8),    92, 'expense', c('Restaurants'), s('Restaurants','Takeout'),    'Sushi takeout',      null, 'Credit Card', 0, null],
    [md(1,16),  168, 'expense', c('Restaurants'), s('Restaurants','Sit Down'),   'Anniversary dinner', null, 'Credit Card', 0, null],
    [md(1,23),   48, 'expense', c('Restaurants'), s('Restaurants','Fast Food'),  'McDonalds after game', null, 'Cash',       0, null],
    [md(2,12),   76, 'expense', c('Restaurants'), s('Restaurants','Takeout'),    'Chinese takeout',    null, 'Credit Card', 0, null],
    [md(2,20),  125, 'expense', c('Restaurants'), s('Restaurants','Sit Down'),   'Family birthday dinner', null, 'Credit Card', 0, null],

    [md(0,2),    18, 'expense', c('Coffee / Snacks'), null, 'Starbucks',    null, 'Credit Card', 0, null],
    [md(0,9),    22, 'expense', c('Coffee / Snacks'), null, 'Tim Hortons',  null, 'Debit Card',  0, null],
    [md(0,16),   15, 'expense', c('Coffee / Snacks'), null, 'Starbucks',    null, 'Credit Card', 0, null],
    [md(1,7),    19, 'expense', c('Coffee / Snacks'), null, 'Tim Hortons',  null, 'Debit Card',  0, null],

    // ── TRANSPORT ───────────────────────────────────────────────────────
    [md(0,8),   145, 'expense', c('Gas'),              null, 'Gas fill up',         null, 'Credit Card', 0, null],
    [md(0,19),  138, 'expense', c('Gas'),              null, 'Gas fill up',         null, 'Credit Card', 0, null],
    [md(1,6),   152, 'expense', c('Gas'),              null, 'Gas fill up',         null, 'Credit Card', 0, null],
    [md(1,18),  141, 'expense', c('Gas'),              null, 'Gas fill up',         null, 'Credit Card', 0, null],
    [md(2,7),   148, 'expense', c('Gas'),              null, 'Gas fill up',         null, 'Credit Card', 0, null],
    [md(2,19),  144, 'expense', c('Gas'),              null, 'Gas fill up',         null, 'Credit Card', 0, null],

    [md(0,1),   245, 'expense', c('Vehicle Insurance'), null, 'Auto insurance - 2 vehicles', null, 'Bank Transfer', 1, 'monthly'],
    [md(1,1),   245, 'expense', c('Vehicle Insurance'), null, 'Auto insurance - 2 vehicles', null, 'Bank Transfer', 1, 'monthly'],
    [md(2,1),   245, 'expense', c('Vehicle Insurance'), null, 'Auto insurance - 2 vehicles', null, 'Bank Transfer', 1, 'monthly'],

    [md(0,14),  110, 'expense', c('Vehicle Maintenance'), s('Vehicle Maintenance','Oil Change'), 'Oil change - SUV', null, 'Credit Card', 0, null],
    [md(1,20),  890, 'expense', c('Vehicle Maintenance'), s('Vehicle Maintenance','Tires'),      'Winter tires swap & storage', null, 'Credit Card', 0, null],
    [md(2,10),   65, 'expense', c('Vehicle Maintenance'), s('Vehicle Maintenance','Car Wash'),   'Car wash',         null, 'Cash', 0, null],

    // ── KIDS ────────────────────────────────────────────────────────────
    [md(0,1),   350, 'expense', c('Kids Sports'), s('Kids Sports','Hockey'),       'Hockey - monthly ice fees',   null, 'Bank Transfer', 1, 'monthly'],
    [md(1,1),   350, 'expense', c('Kids Sports'), s('Kids Sports','Hockey'),       'Hockey - monthly ice fees',   null, 'Bank Transfer', 1, 'monthly'],
    [md(2,1),   350, 'expense', c('Kids Sports'), s('Kids Sports','Hockey'),       'Hockey - monthly ice fees',   null, 'Bank Transfer', 1, 'monthly'],
    [md(0,1),   180, 'expense', c('Kids Sports'), s('Kids Sports','Soccer'),       'Soccer - 2 kids registration',null, 'Bank Transfer', 1, 'monthly'],
    [md(1,1),   180, 'expense', c('Kids Sports'), s('Kids Sports','Soccer'),       'Soccer - 2 kids registration',null, 'Bank Transfer', 1, 'monthly'],
    [md(2,1),   180, 'expense', c('Kids Sports'), s('Kids Sports','Soccer'),       'Soccer - 2 kids registration',null, 'Bank Transfer', 1, 'monthly'],
    [md(0,22),  485, 'expense', c('Kids Sports'), s('Kids Sports','Equipment'),    'Hockey equipment - new skates & helmet', null, 'Credit Card', 0, null],
    [md(1,14),  320, 'expense', c('Kids Sports'), s('Kids Sports','Tournament'),   'Hockey tournament - out of town', 'Hotel + meals', 'Credit Card', 0, null],
    [md(2,18),  275, 'expense', c('Kids Sports'), s('Kids Sports','Swimming'),     'Swim team registration',      null, 'E-Transfer', 0, null],

    [md(0,1),   160, 'expense', c('Kids Activities'), s('Kids Activities','Music Lessons'), 'Guitar lessons x2',  null, 'E-Transfer', 1, 'monthly'],
    [md(1,1),   160, 'expense', c('Kids Activities'), s('Kids Activities','Music Lessons'), 'Guitar lessons x2',  null, 'E-Transfer', 1, 'monthly'],
    [md(2,1),   160, 'expense', c('Kids Activities'), s('Kids Activities','Music Lessons'), 'Guitar lessons x2',  null, 'E-Transfer', 1, 'monthly'],
    [md(0,5),   120, 'expense', c('Kids Activities'), s('Kids Activities','Tutoring'),      'Math tutoring',      null, 'E-Transfer', 1, 'monthly'],
    [md(1,5),   120, 'expense', c('Kids Activities'), s('Kids Activities','Tutoring'),      'Math tutoring',      null, 'E-Transfer', 1, 'monthly'],
    [md(2,5),   120, 'expense', c('Kids Activities'), s('Kids Activities','Tutoring'),      'Math tutoring',      null, 'E-Transfer', 1, 'monthly'],

    [md(0,1),   185, 'expense', c('School & Tuition'), s('School & Tuition','School Fees'), 'School fees x3 kids', null, 'Bank Transfer', 1, 'monthly'],
    [md(1,1),   185, 'expense', c('School & Tuition'), s('School & Tuition','School Fees'), 'School fees x3 kids', null, 'Bank Transfer', 1, 'monthly'],
    [md(2,1),   185, 'expense', c('School & Tuition'), s('School & Tuition','School Fees'), 'School fees x3 kids', null, 'Bank Transfer', 1, 'monthly'],
    [md(0,12),   95, 'expense', c('School & Tuition'), s('School & Tuition','Field Trips'),  'Field trip x2',      null, 'E-Transfer', 0, null],
    [md(1,18),   45, 'expense', c('School & Tuition'), s('School & Tuition','Fundraising'),  'School fundraiser',  null, 'Cash', 0, null],

    [md(0,4),   145, 'expense', c('School Supplies'), null, 'Back to school supplies',   null, 'Credit Card', 0, null],
    [md(1,8),    38, 'expense', c('School Supplies'), null, 'Binders & notebooks',       null, 'Credit Card', 0, null],

    [md(0,10),  240, 'expense', c('Kids Clothing'),   null, 'Spring clothes - 3 kids',  null, 'Credit Card', 0, null],
    [md(1,15),  185, 'expense', c('Kids Clothing'),   null, 'Shoes & gym clothes',      null, 'Credit Card', 0, null],
    [md(2,20),  320, 'expense', c('Kids Clothing'),   null, 'Winter jackets & boots',   null, 'Credit Card', 0, null],

    [md(0,28),  150, 'expense', c('Kids Allowance'),  null, 'Monthly allowance x3',     null, 'Cash', 1, 'monthly'],
    [md(1,28),  150, 'expense', c('Kids Allowance'),  null, 'Monthly allowance x3',     null, 'Cash', 1, 'monthly'],
    [md(2,28),  150, 'expense', c('Kids Allowance'),  null, 'Monthly allowance x3',     null, 'Cash', 1, 'monthly'],

    // ── HEALTH ──────────────────────────────────────────────────────────
    [md(0,14),  380, 'expense', c('Dental'),           null, 'Dental checkups x2',       null, 'Credit Card', 0, null],
    [md(1,20),  220, 'expense', c('Dental'),           null, 'Filling',                  null, 'Credit Card', 0, null],
    [md(0,1),   295, 'expense', c('Orthodontics'),     null, 'Braces monthly payment',   null, 'Bank Transfer', 1, 'monthly'],
    [md(1,1),   295, 'expense', c('Orthodontics'),     null, 'Braces monthly payment',   null, 'Bank Transfer', 1, 'monthly'],
    [md(2,1),   295, 'expense', c('Orthodontics'),     null, 'Braces monthly payment',   null, 'Bank Transfer', 1, 'monthly'],
    [md(0,8),    85, 'expense', c('Medical / Pharmacy'), s('Medical / Pharmacy','Pharmacy'), 'Prescriptions',    null, 'Credit Card', 0, null],
    [md(0,22),  145, 'expense', c('Medical / Pharmacy'), s('Medical / Pharmacy','Physio'),   'Physio x2 sessions', null, 'Credit Card', 0, null],
    [md(1,12),   65, 'expense', c('Vision'),           null, 'Eye exam',                 null, 'Credit Card', 0, null],
    [md(2,5),   385, 'expense', c('Vision'),           null, 'Glasses x2 kids',          null, 'Credit Card', 0, null],
    [md(0,1),   120, 'expense', c('Fitness / Gym'),    null, 'Family gym membership',    null, 'Bank Transfer', 1, 'monthly'],
    [md(1,1),   120, 'expense', c('Fitness / Gym'),    null, 'Family gym membership',    null, 'Bank Transfer', 1, 'monthly'],
    [md(2,1),   120, 'expense', c('Fitness / Gym'),    null, 'Family gym membership',    null, 'Bank Transfer', 1, 'monthly'],

    // ── PERSONAL ────────────────────────────────────────────────────────
    [md(0,16),  245, 'expense', c('Clothing / Adults'), null, 'Clothing',                null, 'Credit Card', 0, null],
    [md(1,22),  185, 'expense', c('Clothing / Adults'), null, 'Work clothes',            null, 'Credit Card', 0, null],
    [md(0,9),    95, 'expense', c('Hair / Grooming'),   null, 'Haircuts x5',             null, 'Cash', 0, null],
    [md(1,10),  105, 'expense', c('Hair / Grooming'),   null, 'Haircuts x5',             null, 'Cash', 0, null],
    [md(2,11),   98, 'expense', c('Hair / Grooming'),   null, 'Haircuts x5',             null, 'Cash', 0, null],
    [md(0,18),   55, 'expense', c('Personal Care'),     null, 'Toiletries & personal care', null, 'Credit Card', 0, null],
    [md(1,17),   62, 'expense', c('Personal Care'),     null, 'Toiletries & personal care', null, 'Credit Card', 0, null],

    // ── LIFESTYLE ───────────────────────────────────────────────────────
    [md(0,1),    18, 'expense', c('Subscriptions'), s('Subscriptions','Netflix'),         'Netflix',          null, 'Credit Card', 1, 'monthly'],
    [md(0,1),    11, 'expense', c('Subscriptions'), s('Subscriptions','Spotify'),         'Spotify Family',   null, 'Credit Card', 1, 'monthly'],
    [md(0,1),    14, 'expense', c('Subscriptions'), s('Subscriptions','Disney+'),         'Disney+',          null, 'Credit Card', 1, 'monthly'],
    [md(0,1),    22, 'expense', c('Subscriptions'), s('Subscriptions','Amazon Prime'),    'Amazon Prime',     null, 'Credit Card', 1, 'monthly'],
    [md(0,1),    25, 'expense', c('Subscriptions'), s('Subscriptions','Apple'),           'Apple One Family', null, 'Credit Card', 1, 'monthly'],
    [md(1,1),    18, 'expense', c('Subscriptions'), s('Subscriptions','Netflix'),         'Netflix',          null, 'Credit Card', 1, 'monthly'],
    [md(1,1),    11, 'expense', c('Subscriptions'), s('Subscriptions','Spotify'),         'Spotify Family',   null, 'Credit Card', 1, 'monthly'],
    [md(1,1),    14, 'expense', c('Subscriptions'), s('Subscriptions','Disney+'),         'Disney+',          null, 'Credit Card', 1, 'monthly'],
    [md(1,1),    22, 'expense', c('Subscriptions'), s('Subscriptions','Amazon Prime'),    'Amazon Prime',     null, 'Credit Card', 1, 'monthly'],
    [md(1,1),    25, 'expense', c('Subscriptions'), s('Subscriptions','Apple'),           'Apple One Family', null, 'Credit Card', 1, 'monthly'],
    [md(2,1),    18, 'expense', c('Subscriptions'), s('Subscriptions','Netflix'),         'Netflix',          null, 'Credit Card', 1, 'monthly'],
    [md(2,1),    11, 'expense', c('Subscriptions'), s('Subscriptions','Spotify'),         'Spotify Family',   null, 'Credit Card', 1, 'monthly'],
    [md(2,1),    14, 'expense', c('Subscriptions'), s('Subscriptions','Disney+'),         'Disney+',          null, 'Credit Card', 1, 'monthly'],
    [md(2,1),    22, 'expense', c('Subscriptions'), s('Subscriptions','Amazon Prime'),    'Amazon Prime',     null, 'Credit Card', 1, 'monthly'],
    [md(2,1),    25, 'expense', c('Subscriptions'), s('Subscriptions','Apple'),           'Apple One Family', null, 'Credit Card', 1, 'monthly'],

    [md(0,15),  185, 'expense', c('Entertainment'),    null, 'Movie night + arcade',     null, 'Credit Card', 0, null],
    [md(1,22),  145, 'expense', c('Entertainment'),    null, 'Go-karts family outing',   null, 'Credit Card', 0, null],
    [md(2,14),   75, 'expense', c('Entertainment'),    null, 'Bowling night',            null, 'Cash', 0, null],

    [md(0,12),  125, 'expense', c('Gifts & Occasions'), null, 'Birthday gift',           null, 'Credit Card', 0, null],
    [md(1,18),   85, 'expense', c('Gifts & Occasions'), null, 'Teacher gifts',           null, 'Credit Card', 0, null],
    [md(2,20),  245, 'expense', c('Gifts & Occasions'), null, 'Christmas gifts',         null, 'Credit Card', 0, null],

    [md(0,1),   145, 'expense', c('Pets'),              null, 'Pet food & supplies',     null, 'Credit Card', 1, 'monthly'],
    [md(0,15),  285, 'expense', c('Pets'),              null, 'Vet checkup',             null, 'Credit Card', 0, null],
    [md(1,1),   145, 'expense', c('Pets'),              null, 'Pet food & supplies',     null, 'Credit Card', 1, 'monthly'],
    [md(2,1),   145, 'expense', c('Pets'),              null, 'Pet food & supplies',     null, 'Credit Card', 1, 'monthly'],

    // ── FINANCE / SAVINGS ───────────────────────────────────────────────
    [md(0,1),   500, 'expense', c('Savings / TFSA'), s('Savings / TFSA','Emergency Fund'), 'Emergency fund contribution', null, 'Bank Transfer', 1, 'monthly'],
    [md(1,1),   500, 'expense', c('Savings / TFSA'), s('Savings / TFSA','Emergency Fund'), 'Emergency fund contribution', null, 'Bank Transfer', 1, 'monthly'],
    [md(2,1),   500, 'expense', c('Savings / TFSA'), s('Savings / TFSA','Emergency Fund'), 'Emergency fund contribution', null, 'Bank Transfer', 1, 'monthly'],
    [md(0,1),   800, 'expense', c('RRSP'),             null, 'RRSP contribution',        null, 'Bank Transfer', 1, 'monthly'],
    [md(1,1),   800, 'expense', c('RRSP'),             null, 'RRSP contribution',        null, 'Bank Transfer', 1, 'monthly'],
    [md(2,1),   800, 'expense', c('RRSP'),             null, 'RRSP contribution',        null, 'Bank Transfer', 1, 'monthly'],
    [md(0,1),   300, 'expense', c('RESP'),              null, 'RESP x3 kids',            null, 'Bank Transfer', 1, 'monthly'],
    [md(1,1),   300, 'expense', c('RESP'),              null, 'RESP x3 kids',            null, 'Bank Transfer', 1, 'monthly'],
    [md(2,1),   300, 'expense', c('RESP'),              null, 'RESP x3 kids',            null, 'Bank Transfer', 1, 'monthly'],

    [md(0,1),   185, 'expense', c('Life Insurance'),    null, 'Life insurance premium',  null, 'Bank Transfer', 1, 'monthly'],
    [md(1,1),   185, 'expense', c('Life Insurance'),    null, 'Life insurance premium',  null, 'Bank Transfer', 1, 'monthly'],
    [md(2,1),   185, 'expense', c('Life Insurance'),    null, 'Life insurance premium',  null, 'Bank Transfer', 1, 'monthly'],
  ];

  transaction(({ exec }) => {
    TX.forEach(([date, amount, type, catId, subId, desc, notes, method, recurring, freq]) => {
      if (!catId) return;
      try {
        exec(
          'INSERT INTO transactions (id,date,amount,type,category_id,subcategory_id,description,notes,payment_method,is_recurring,recurring_frequency) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
          [uuidv4(), date, amount, type, catId, subId, desc, notes, method, recurring, freq]
        );
      } catch (e) {
        console.error('TX insert error:', e.message);
      }
    });

    // Default settings
    const defaults = [
      ['family_name', 'Our Family'],
      ['currency_code', 'CAD'],
      ['currency_symbol', '$'],
    ];
    defaults.forEach(([key, value]) => {
      try { exec('INSERT INTO settings (key, value) VALUES (?, ?)', [key, value]); } catch {}
    });
  });

  // Budgets for current month
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const BUDGETS = [
    ['Mortgage / Rent',     2650],
    ['Property Tax',         420],
    ['Home Insurance',       185],
    ['Utilities',            550],
    ['Home Maintenance',     200],
    ['Groceries',           1400],
    ['Restaurants',          300],
    ['Coffee / Snacks',       80],
    ['Gas',                  320],
    ['Vehicle Insurance',    245],
    ['Vehicle Maintenance',  150],
    ['Kids Sports',          600],
    ['Kids Activities',      300],
    ['School & Tuition',     200],
    ['Kids Clothing',        150],
    ['Kids Allowance',       150],
    ['Dental',               150],
    ['Orthodontics',         295],
    ['Medical / Pharmacy',   100],
    ['Fitness / Gym',        120],
    ['Clothing / Adults',    150],
    ['Hair / Grooming',      110],
    ['Personal Care',         60],
    ['Subscriptions',        100],
    ['Entertainment',        200],
    ['Gifts & Occasions',    100],
    ['Pets',                 200],
    ['Life Insurance',       185],
    ['Savings / TFSA',       500],
    ['RRSP',                 800],
    ['RESP',                 300],
  ];

  transaction(({ exec }) => {
    BUDGETS.forEach(([catName, amount]) => {
      const catId = catMap[catName];
      if (!catId) return;
      try {
        exec(
          'INSERT INTO budgets (id, category_id, amount, year, month) VALUES (?, ?, ?, ?, ?)',
          [uuidv4(), catId, amount, year, month]
        );
      } catch {}
    });
  });

  console.log('✅ Seeded successfully');
}

export function seedIfEmpty() {
  const count = get('SELECT COUNT(*) as n FROM categories');
  if (count && count.n > 0) {
    console.log(`📦 Database ready (${count.n} categories found)`);
    return;
  }
  console.log('🌱 Empty database — seeding with sample data...');
  seed();
}
