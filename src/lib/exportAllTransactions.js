import { storageApi } from './storage';
import { downloadCSV, todayISO } from './finance';

export async function exportAllTransactionsCSV(workspaceId) {
  const transactions = await storageApi.getEntity('transactions', workspaceId);
  const accounts = await storageApi.getEntity('accounts', workspaceId);
  const categories = await storageApi.getEntity('categories', workspaceId);

  const accMap = new Map(accounts.map(a => [a.id, a.name]));
  const catMap = new Map(categories.map(c => [c.id, c.name]));

  const rows = transactions.map(tx => ({
    ID: tx.id,
    Date: tx.date,
    Type: tx.transaction_type,
    Amount_INR: tx.amount,
    Account: accMap.get(tx.account_id) || tx.account_id,
    To_Account: tx.to_account_id ? (accMap.get(tx.to_account_id) || tx.to_account_id) : '',
    Category: catMap.get(tx.category_id) || tx.category_id || '',
    Payee: tx.payee || '',
    Status: tx.status || 'completed',
    Notes: tx.notes || '',
    Tags: tx.tags ? tx.tags.join(';') : '',
    Receipt_URL: tx.receipt_file_url || ''
  }));

  downloadCSV(`PersonalTracker_Transactions_${todayISO()}.csv`, rows);
}

export async function exportFullDatabaseJSON(workspaceId) {
  const [
    accounts,
    categories,
    transactions,
    budgets,
    savingsGoals,
    recurringRules,
    debts,
    bills
  ] = await Promise.all([
    storageApi.getEntity('accounts', workspaceId),
    storageApi.getEntity('categories', workspaceId),
    storageApi.getEntity('transactions', workspaceId),
    storageApi.getEntity('budgets', workspaceId),
    storageApi.getEntity('savings_goals', workspaceId),
    storageApi.getEntity('recurring_rules', workspaceId),
    storageApi.getEntity('debts_loans', workspaceId),
    storageApi.getEntity('bill_reminders', workspaceId)
  ]);

  const backupData = {
    version: '1.0',
    exported_at: new Date().toISOString(),
    workspaceId,
    accounts,
    categories,
    transactions,
    budgets,
    savingsGoals,
    recurringRules,
    debts,
    bills
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PersonalTracker_Backup_${todayISO()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
