import React, { useState } from 'react';
import { useWorkspaceData } from '../../hooks/useWorkspaceData';
import { useWorkspace } from '../../context/WorkspaceContext';
import { storageApi } from '../../lib/storage';
import { todayISO } from '../../lib/finance';
import { X } from 'lucide-react';
import { CustomSelect } from '../ui/CustomSelect';

export function RecurringFormDialog({ initialData = null, onClose, onSuccess }) {
  const { activeWorkspace } = useWorkspace();
  const { accounts, categories, refetch } = useWorkspaceData();

  const [accountId, setAccountId] = useState(initialData?.account_id || accounts[0]?.id || '');
  const [categoryId, setCategoryId] = useState(initialData?.category_id || categories[0]?.id || '');
  const [amount, setAmount] = useState(initialData?.amount || '');
  const [transactionType, setTransactionType] = useState(initialData?.transaction_type || 'expense');
  const [payee, setPayee] = useState(initialData?.payee || '');
  const [frequency, setFrequency] = useState(initialData?.frequency || 'monthly');
  const [nextRunDate, setNextRunDate] = useState(initialData?.next_run_date || todayISO());
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Auto-select first account if not set
  React.useEffect(() => {
    if (!accountId && accounts.length > 0) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  // Auto-select first category if not set
  React.useEffect(() => {
    if (!categoryId && categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const effectiveAccount = accountId || accounts[0]?.id;
    if (!effectiveAccount) return setError('Please create or select an account first');
    if (!amount || Number(amount) <= 0) return setError('Please enter a valid positive amount');
    if (!nextRunDate) return setError('Please specify the next run date');

    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...initialData,
        workspace_id: activeWorkspace.id,
        account_id: effectiveAccount,
        category_id: categoryId || categories[0]?.id || '',
        amount: Number(amount),
        transaction_type: transactionType,
        payee: payee.trim() || 'Recurring Payment',
        frequency,
        next_run_date: nextRunDate,
        is_active: isActive
      };

      await storageApi.saveEntity('recurring_rules', payload);
      await refetch();
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save recurring rule');
    } finally {
      setSaving(false);
    }
  };

  const typeOptions = [
    { value: 'expense', label: 'Expense', type: 'expense' },
    { value: 'income', label: 'Income', type: 'income' },
    { value: 'savings', label: 'Savings', type: 'savings' },
    { value: 'investment', label: 'Investment', type: 'investment' }
  ];

  const frequencyOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  const accountOptions = accounts.map(a => ({
    value: a.id,
    label: `${a.name} (Bal: ₹${(Number(a.balance) || 0).toLocaleString('en-IN')})`
  }));

  const categoryOptions = categories.map(c => ({
    value: c.id,
    label: c.name,
    type: c.type,
    color: c.color
  }));

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
    >
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
          <h2 className="text-base font-heading font-semibold text-foreground">
            {initialData?.id ? 'Edit Recurring Rule' : 'Create Recurring Payment Rule'}
          </h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && <div className="p-3 rounded-xl bg-destructive/10 text-destructive">{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Type</label>
              <CustomSelect
                options={typeOptions}
                value={transactionType}
                onChange={setTransactionType}
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Frequency</label>
              <CustomSelect
                options={frequencyOptions}
                value={frequency}
                onChange={setFrequency}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Account</label>
            <CustomSelect
              options={accountOptions}
              value={accountId || accounts[0]?.id || ''}
              onChange={setAccountId}
              placeholder="Select Account..."
              searchable
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Category</label>
              <CustomSelect
                options={categoryOptions}
                value={categoryId || categories[0]?.id || ''}
                onChange={setCategoryId}
                placeholder="Select Category..."
                searchable
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onWheel={(e) => e.target.blur()}
                className="w-full p-2.5 bg-background border border-border rounded-xl font-mono text-foreground font-bold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Payee / Description</label>
              <input
                type="text"
                placeholder="e.g. Netflix, Rent"
                value={payee}
                onChange={(e) => setPayee(e.target.value)}
                className="w-full p-2.5 bg-background border border-border rounded-xl text-foreground"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Next Run Date</label>
              <input
                type="date"
                value={nextRunDate}
                onChange={(e) => setNextRunDate(e.target.value)}
                className="w-full p-2.5 bg-background border border-border rounded-xl font-mono text-foreground"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="ruleActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
            />
            <label htmlFor="ruleActive" className="font-medium text-foreground cursor-pointer">
              Rule Active (Scheduled for execution)
            </label>
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border hover:bg-muted text-foreground">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold">
              {saving ? 'Saving...' : initialData ? 'Update Rule' : 'Create Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
