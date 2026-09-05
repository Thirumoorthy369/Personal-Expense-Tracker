import React, { useState } from 'react';
import { useWorkspaceData } from '../../hooks/useWorkspaceData';
import { useWorkspace } from '../../context/WorkspaceContext';
import { storageApi } from '../../lib/storage';
import { CATEGORY_TYPES } from '../../lib/finance';
import { X } from 'lucide-react';
import { CustomSelect } from '../ui/CustomSelect';

const PRESET_COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444',
  '#059669', '#2563eb', '#7c3aed', '#db2777', '#d97706', '#dc2626',
  '#06b6d4', '#6366f1', '#a855f7', '#14b8a6', '#f43f5e', '#64748b'
];

export function CategoryDialog({ initialData = null, onClose, onSuccess }) {
  const { activeWorkspace } = useWorkspace();
  const { refetch } = useWorkspaceData();

  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState(initialData?.type || 'expense');
  const [colorCode, setColorCode] = useState(initialData?.color_code || PRESET_COLORS[0]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Please enter a category name');

    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...initialData,
        workspace_id: activeWorkspace.id,
        name: name.trim(),
        type,
        color_code: colorCode
      };

      await storageApi.saveEntity('categories', payload);
      await refetch();
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const typeOptions = CATEGORY_TYPES.map(t => ({
    value: t.value,
    label: t.label,
    type: t.value
  }));

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
    >
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
          <h2 className="text-base font-heading font-semibold text-foreground">
            {initialData?.id ? 'Edit Category' : 'Add New Category'}
          </h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && <div className="p-3 rounded-xl bg-destructive/10 text-destructive">{error}</div>}

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Category Name</label>
            <input
              type="text"
              placeholder="e.g. Mutual Funds, Petrol, Rent"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 bg-background border border-border rounded-xl text-foreground"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Type</label>
            <CustomSelect
              options={typeOptions}
              value={type}
              onChange={setType}
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">Category Color (Preset or Custom)</label>
            <div className="flex items-center gap-3">
              <div className="flex flex-wrap gap-2 p-2.5 bg-muted/30 border border-border rounded-xl flex-1">
                {PRESET_COLORS.map(c => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setColorCode(c)}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      colorCode.toLowerCase() === c.toLowerCase() ? 'scale-110 border-white ring-2 ring-primary shadow-md' : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
              <div className="flex flex-col items-center gap-1 shrink-0 p-2 bg-muted/30 border border-border rounded-xl">
                <input
                  type="color"
                  value={colorCode}
                  onChange={(e) => setColorCode(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-border cursor-pointer bg-transparent p-0"
                  title="Pick custom color"
                />
                <span className="text-[9px] font-mono text-muted-foreground uppercase">{colorCode}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border hover:bg-muted text-foreground">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold">
              {saving ? 'Saving...' : initialData?.id ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
