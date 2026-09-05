import React, { useState } from 'react';
import { useWorkspaceData } from '../../hooks/useWorkspaceData';
import { useWorkspace } from '../../context/WorkspaceContext';
import { storageApi } from '../../lib/storage';
import { todayISO } from '../../lib/finance';
import { X } from 'lucide-react';
import { CustomSelect } from '../ui/CustomSelect';

export function BillReminderFormDialog({ initialData = null, onClose, onSuccess }) {
  const { activeWorkspace } = useWorkspace();
  const { categories, refetch } = useWorkspaceData();

  const [title, setTitle] = useState(initialData?.title || '');
  const [amount, setAmount] = useState(initialData?.amount || '');
  const [dueDate, setDueDate] = useState(initialData?.due_date || todayISO());
  const [frequency, setFrequency] = useState(initialData?.frequency || 'monthly');
  const [status, setStatus] = useState(initialData?.status || 'pending');
  const [categoryId, setCategoryId] = useState(initialData?.category_id || categories[0]?.id || '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return setError('Please enter a bill title');
    if (!amount || Number(amount) <= 0) return setError('Please enter a valid bill amount');

    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...initialData,
        workspace_id: activeWorkspace?.id || 'ws-default-001',
        title: title.trim(),
        amount: Number(amount),
        due_date: dueDate,
        frequency,
        status,
        category_id: categoryId || categories[0]?.id || ''
      };

      await storageApi.saveEntity('bill_reminders', payload);
      await refetch();
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save bill reminder');
    } finally {
      setSaving(false);
    }
  };

  const frequencyOptions = [
    { value: 'one_time', label: 'One Time' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' }
  ];

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
            {initialData ? 'Edit Bill Reminder' : 'Add Bill / Subscription'}
          </h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && <div className="p-3 rounded-xl bg-destructive/10 text-destructive">{error}</div>}

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Bill Title</label>
            <input
              type="text"
              placeholder="e.g. Electricity, Health Insurance"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 bg-background border border-border rounded-xl text-foreground"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onWheel={(e) => e.target.blur()}
                className="w-full p-2.5 bg-background border border-border rounded-xl font-mono text-foreground"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2.5 bg-background border border-border rounded-xl font-mono text-foreground"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Frequency</label>
              <CustomSelect
                options={frequencyOptions}
                value={frequency}
                onChange={setFrequency}
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Status</label>
              <CustomSelect
                options={statusOptions}
                value={status}
                onChange={setStatus}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Category</label>
            <CustomSelect
              options={categoryOptions}
              value={categoryId}
              onChange={setCategoryId}
              placeholder="Select Category..."
              searchable
            />
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border hover:bg-muted text-foreground">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold">
              {saving ? 'Saving...' : initialData ? 'Update Bill' : 'Save Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
