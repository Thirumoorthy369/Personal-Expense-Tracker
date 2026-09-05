import React, { useState } from 'react';
import { useWorkspaceData } from '../../hooks/useWorkspaceData';
import { useWorkspace } from '../../context/WorkspaceContext';
import { storageApi } from '../../lib/storage';
import { todayISO } from '../../lib/finance';
import { X } from 'lucide-react';
import { CustomSelect } from '../ui/CustomSelect';

export function DebtLoanFormDialog({ initialData = null, onClose, onSuccess }) {
  const { activeWorkspace } = useWorkspace();
  const { refetch } = useWorkspaceData();

  const [title, setTitle] = useState(initialData?.title || '');
  const [type, setType] = useState(initialData?.type || 'borrowed');
  const [counterparty, setCounterparty] = useState(initialData?.counterparty || '');
  const [principalAmount, setPrincipalAmount] = useState(initialData?.principal_amount || '');
  const [remainingAmount, setRemainingAmount] = useState(initialData?.remaining_amount || '');
  const [interestRate, setInterestRate] = useState(initialData?.interest_rate || 0);
  const [startDate, setStartDate] = useState(initialData?.start_date || todayISO());
  const [dueDate, setDueDate] = useState(initialData?.due_date || '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return setError('Please enter a debt title');
    if (!principalAmount || Number(principalAmount) <= 0) return setError('Please enter principal amount');

    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...initialData,
        workspace_id: activeWorkspace?.id || 'ws-default-001',
        title: title.trim(),
        type,
        counterparty,
        principal_amount: Number(principalAmount),
        remaining_amount: remainingAmount ? Number(remainingAmount) : Number(principalAmount),
        interest_rate: Number(interestRate) || 0,
        start_date: startDate,
        due_date: dueDate || null,
        status: (Number(remainingAmount) === 0) ? 'settled' : 'active'
      };

      await storageApi.saveEntity('debts_loans', payload);
      await refetch();
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save record');
    } finally {
      setSaving(false);
    }
  };

  const recordTypeOptions = [
    { value: 'borrowed', label: 'Borrowed (Liability / I Owe)', type: 'expense' },
    { value: 'lent', label: 'Lent Out (Asset / Owed to Me)', type: 'income' }
  ];

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
    >
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
          <h2 className="text-base font-heading font-semibold text-foreground">
            {initialData ? 'Edit Debt / Loan' : 'Record New Debt or Loan'}
          </h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && <div className="p-3 rounded-xl bg-destructive/10 text-destructive">{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Record Type</label>
              <CustomSelect
                options={recordTypeOptions}
                value={type}
                onChange={setType}
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Counterparty / Bank</label>
              <input
                type="text"
                placeholder="e.g. HDFC Bank, Friend"
                value={counterparty}
                onChange={(e) => setCounterparty(e.target.value)}
                className="w-full p-2.5 bg-background border border-border rounded-xl text-foreground"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Title / Purpose</label>
            <input
              type="text"
              placeholder="e.g. Home Loan, Personal Advance"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 bg-background border border-border rounded-xl text-foreground"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Principal (₹)</label>
              <input
                type="number"
                step="100"
                value={principalAmount}
                onChange={(e) => {
                  setPrincipalAmount(e.target.value);
                  if (!initialData) setRemainingAmount(e.target.value);
                }}
                onWheel={(e) => e.target.blur()}
                className="w-full p-2.5 bg-background border border-border rounded-xl font-mono text-foreground"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Remaining Balance (₹)</label>
              <input
                type="number"
                step="100"
                value={remainingAmount}
                onChange={(e) => setRemainingAmount(e.target.value)}
                onWheel={(e) => e.target.blur()}
                className="w-full p-2.5 bg-background border border-border rounded-xl font-mono text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="font-semibold text-foreground">Interest % p.a.</label>
              <input
                type="number"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                onWheel={(e) => e.target.blur()}
                className="w-full p-2 bg-background border border-border rounded-xl font-mono text-foreground"
              />
            </div>
            <div>
              <label className="font-semibold text-foreground">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 bg-background border border-border rounded-xl font-mono text-foreground"
              />
            </div>
            <div>
              <label className="font-semibold text-foreground">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2 bg-background border border-border rounded-xl font-mono text-foreground"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border hover:bg-muted text-foreground">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold">
              {saving ? 'Saving...' : initialData ? 'Update Record' : 'Save Loan Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
