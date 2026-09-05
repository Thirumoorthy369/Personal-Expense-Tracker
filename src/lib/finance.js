// =====================================================================
// PERSONAL TRACKER — CORE FINANCIAL BUSINESS LOGIC (DETERMINISTIC)
// =====================================================================

/**
 * Format currency with Indian Rupee (₹) symbol by default
 */
export function formatMoney(amount, currency = 'INR') {
  const num = Number(amount) || 0;
  try {
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency === 'INR' ? 'INR' : currency,
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    }).format(num);
    
    // Ensure standard symbol output
    if (currency === 'INR') {
      return formatted.replace('INR', '₹').trim();
    }
    return formatted;
  } catch (e) {
    return `₹${num.toFixed(2)}`;
  }
}

export function formatCompactMoney(amount) {
  const num = Math.abs(Number(amount) || 0);
  const sign = Number(amount) < 0 ? '-' : '';
  if (num >= 10000000) {
    return `${sign}₹${(num / 10000000).toFixed(2)} Cr`;
  }
  if (num >= 100000) {
    return `${sign}₹${(num / 100000).toFixed(2)} L`;
  }
  if (num >= 1000) {
    return `${sign}₹${(num / 1000).toFixed(1)} k`;
  }
  return `${sign}₹${num.toFixed(0)}`;
}

export const ACCOUNT_TYPES = [
  { value: 'checking', label: 'Checking / Current', icon: 'Wallet' },
  { value: 'savings', label: 'Savings Account', icon: 'PiggyBank' },
  { value: 'cash', label: 'Cash Wallet', icon: 'Banknote' },
  { value: 'credit_card', label: 'Credit Card', icon: 'CreditCard' },
];

export const CATEGORY_TYPES = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
  { value: 'savings', label: 'Savings (Emergency Fund)' },
  { value: 'investment', label: 'Investment (Stocks/Mutual Funds)' },
];

export const TRANSACTION_TYPES = [
  { value: 'expense', label: 'Expense', badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
  { value: 'income', label: 'Income', badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  { value: 'transfer', label: 'Transfer', badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  { value: 'savings', label: 'Savings', badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  { value: 'investment', label: 'Investment', badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
];

/**
 * Calculates net balance adjustment map for accounts affected by a transaction
 * Returns map of { accountId: deltaAmount }
 */
export function calculateBalanceAdjustments(tx, isReversal = false) {
  const factor = isReversal ? -1 : 1;
  const amount = Number(tx.amount) || 0;
  const adjustments = {};

  if (!tx || !tx.account_id || !amount) return adjustments;

  const type = tx.transaction_type || 'expense';

  if (type === 'income') {
    adjustments[tx.account_id] = amount * factor;
  } else if (type === 'expense' || type === 'savings' || type === 'investment') {
    adjustments[tx.account_id] = -amount * factor;
  } else if (type === 'transfer' && tx.to_account_id) {
    adjustments[tx.account_id] = -amount * factor;
    adjustments[tx.to_account_id] = (adjustments[tx.to_account_id] || 0) + (amount * factor);
  }

  return adjustments;
}

/**
 * Local Date Arithmetic Utilities (Strictly no UTC shifts)
 */
export function todayISO() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function monthKey(dateInput = new Date()) {
  const d = typeof dateInput === 'string' ? new Date(dateInput + 'T00:00:00') : dateInput;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function monthLabel(monthKeyStr) {
  if (!monthKeyStr) return '';
  const [y, m] = monthKeyStr.split('-').map(Number);
  const date = new Date(y, m - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function shiftMonth(monthKeyStr, deltaMonths) {
  const [y, m] = monthKeyStr.split('-').map(Number);
  const date = new Date(y, m - 1 + deltaMonths, 1);
  return monthKey(date);
}

export function lastNMonths(n = 6, endMonthKey = monthKey()) {
  const months = [];
  let current = endMonthKey;
  for (let i = 0; i < n; i++) {
    months.unshift(current);
    current = shiftMonth(current, -1);
  }
  return months;
}

/**
 * CSV Generation & Download Helper
 */
export function downloadCSV(filename, rows) {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      headers.map(header => {
        let val = row[header] ?? '';
        if (typeof val === 'string') {
          val = val.replace(/"/g, '""');
          if (val.includes(',') || val.includes('\n') || val.includes('"')) {
            val = `"${val}"`;
          }
        }
        return val;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
