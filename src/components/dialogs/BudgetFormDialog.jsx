import React, { useState } from 'react';
import { useWorkspaceData } from '../../hooks/useWorkspaceData';
import { useWorkspace } from '../../context/WorkspaceContext';
import { storageApi } from '../../lib/storage';
import { X } from 'lucide-react';
import { CustomSelect } from '../ui/CustomSelect';

export function BudgetFormDialog({ initialData = null, onClose, onSuccess }) {
  const { activeWorkspace } = useWorkspace();
  const { categories, refetch } = useWorkspaceData();

  const [categoryId, setCategoryId] = useState(initialData?.category_id || categories[0]?.id || '');
  const [monthlyLimit, setMonthlyLimit] = useState(initialData?.monthly_limit || '');
  const [alertThreshold, setAlertThreshold] = useState(initialData?.alert_threshold_percentage || 80);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryId) return setError('Please select a category');
    if (!monthlyLimit || Number(monthlyLimit) <= 0) return setError('Please specify a positive monthly limit');

    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...initialData,
        workspace_id: activeWorkspace.id,
        category_id: categoryId,
        monthly_limit: Number(monthlyLimit),
        alert_threshold_percentage: Number(alertThreshold)
      };

      await storageApi.saveEntity('budgets', payload);
      await refetch();
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save budget');
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
            {initialData ? 'Edit Budget Limit' : 'Set Category Monthly Budget'}
          </h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && <div className="p-3 rounded-xl bg-destructive/10 text-destructive">{error}</div>}

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Target Expense Category</label>
            <CustomSelect
              options={categoryOptions}
              value={categoryId}
              onChange={setCategoryId}
              placeholder="Select Category..."
              searchable
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Monthly Limit (₹)</label>
            <input
              type="number"
              step="1"
              placeholder="e.g. 15000"
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(e.target.value)}
              onWheel={(e) => e.target.blur()}
              className="w-full p-2.5 bg-background border border-border rounded-xl font-mono text-foreground"
              required
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="font-semibold text-foreground">Alert Warning Threshold</label>
              <span className="font-mono font-semibold text-primary">{alertThreshold}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              step="5"
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(e.target.value)}
              className="w-full accent-primary cursor-pointer"
            />
            <p className="text-[10px] text-muted-foreground">Triggers notification when category spending reaches this percentage.</p>
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border hover:bg-muted text-foreground">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold">
              {saving ? 'Saving...' : initialData ? 'Update Budget' : 'Save Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
