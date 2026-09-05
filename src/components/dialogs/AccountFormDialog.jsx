import React, { useState } from 'react';
import { useWorkspaceData } from '../../hooks/useWorkspaceData';
import { useWorkspace } from '../../context/WorkspaceContext';
import { storageApi } from '../../lib/storage';
import { ACCOUNT_TYPES } from '../../lib/finance';
import { X } from 'lucide-react';
import { CustomSelect } from '../ui/CustomSelect';

export function AccountFormDialog({ initialData = null, onClose, onSuccess }) {
  const { activeWorkspace } = useWorkspace();
  const { refetch } = useWorkspaceData();

  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState(initialData?.type || 'checking');
  const [initialBalance, setInitialBalance] = useState(initialData?.initial_balance || 0);
  const [currency, setCurrency] = useState(initialData?.currency || activeWorkspace?.currency || 'INR');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Please provide an account name');

    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...initialData,
        workspace_id: activeWorkspace.id,
        name: name.trim(),
        type,
        initial_balance: Number(initialBalance) || 0,
        balance: initialData ? initialData.balance : (Number(initialBalance) || 0),
        currency
      };

      await storageApi.saveEntity('accounts', payload);
      await refetch();
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save account');
    } finally {
      setSaving(false);
    }
  };

  const accountTypeOptions = ACCOUNT_TYPES.map(t => ({
    value: t.value,
    label: t.label
  }));

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
    >
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
          <h2 className="text-base font-heading font-semibold text-foreground">
            {initialData ? 'Edit Financial Account' : 'Create Financial Account'}
          </h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && <div className="p-3 rounded-xl bg-destructive/10 text-destructive">{error}</div>}

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Account Name</label>
            <input
              type="text"
              placeholder="e.g. HDFC Salary Account, Cash Wallet"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 bg-background border border-border rounded-xl text-foreground"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Account Type</label>
            <CustomSelect
              options={accountTypeOptions}
              value={type}
              onChange={setType}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Initial Balance (₹)</label>
              <input
                type="number"
                step="0.01"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                onWheel={(e) => e.target.blur()}
                className="w-full p-2.5 bg-background border border-border rounded-xl font-mono text-foreground"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Currency</label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                className="w-full p-2.5 bg-background border border-border rounded-xl font-mono text-foreground"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border hover:bg-muted text-foreground">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold">
              {saving ? 'Saving...' : initialData ? 'Update' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
