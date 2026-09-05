import React, { useState } from 'react';
import { useWorkspaceData } from '../../hooks/useWorkspaceData';
import { useWorkspace } from '../../context/WorkspaceContext';
import { storageApi } from '../../lib/storage';
import { X } from 'lucide-react';
import { CustomSelect } from '../ui/CustomSelect';

export function SavingsGoalFormDialog({ initialData = null, onClose, onSuccess }) {
  const { activeWorkspace } = useWorkspace();
  const { categories, refetch } = useWorkspaceData();

  const [title, setTitle] = useState(initialData?.title || '');
  const [targetAmount, setTargetAmount] = useState(initialData?.target_amount || '');
  const [currentAmount, setCurrentAmount] = useState(initialData?.current_amount || 0);
  const [targetDate, setTargetDate] = useState(initialData?.target_date || '');
  const [categoryId, setCategoryId] = useState(initialData?.category_id || categories[0]?.id || '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return setError('Please enter a goal title');
    if (!targetAmount || Number(targetAmount) <= 0) return setError('Please specify a positive target amount');

    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...initialData,
        workspace_id: activeWorkspace.id,
        title: title.trim(),
        target_amount: Number(targetAmount),
        current_amount: Number(currentAmount) || 0,
        target_date: targetDate || null,
        category_id: categoryId
      };

      await storageApi.saveEntity('savings_goals', payload);
      await refetch();
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save savings goal');
    } finally {
      setSaving(false);
    }
  };

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
            {initialData ? 'Edit Savings Target' : 'Create Savings Goal'}
          </h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && <div className="p-3 rounded-xl bg-destructive/10 text-destructive">{error}</div>}

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Goal Title</label>
            <input
              type="text"
              placeholder="e.g. Emergency Shield, New Vehicle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 bg-background border border-border rounded-xl text-foreground"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Target Amount (₹)</label>
              <input
                type="number"
                step="100"
                placeholder="100000"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                onWheel={(e) => e.target.blur()}
                className="w-full p-2.5 bg-background border border-border rounded-xl font-mono text-foreground"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Current Saved (₹)</label>
              <input
                type="number"
                step="100"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                onWheel={(e) => e.target.blur()}
                className="w-full p-2.5 bg-background border border-border rounded-xl font-mono text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Target Completion Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full p-2.5 bg-background border border-border rounded-xl font-mono text-foreground"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Linked Category</label>
              <CustomSelect
                options={categoryOptions}
                value={categoryId}
                onChange={setCategoryId}
                placeholder="Select Category..."
                searchable
              />
            </div>
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border hover:bg-muted text-foreground">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold">
              {saving ? 'Saving...' : initialData ? 'Update Goal' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
