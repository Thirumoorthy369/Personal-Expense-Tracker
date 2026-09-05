import React, { useState } from 'react';
import { useWorkspaceData } from '../hooks/useWorkspaceData';
import { useWorkspace } from '../context/WorkspaceContext';
import { storageApi, migrateLocalStorageToSupabase } from '../lib/storage';
import { exportFullDatabaseJSON } from '../lib/exportAllTransactions';
import { CategoryDialog } from '../components/dialogs/CategoryDialog';
import { LegalTermsModal } from '../components/LegalTermsModal';
import { Sliders, Plus, Edit2, Trash2, Download, Upload, Database, Tag, TrendingDown, TrendingUp, PiggyBank, Landmark, CloudUpload, CheckCircle2, AlertCircle, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';

export function Settings() {
  const { isWorkspaceAdmin, activeWorkspace } = useWorkspace();
  const { categories, templates, refetch } = useWorkspaceData();

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showLegalModal, setShowLegalModal] = useState(false);

  // SUPABASE MIGRATION STATE
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgressMsg, setSyncProgressMsg] = useState('');
  const [syncResult, setSyncResult] = useState(null);
  const [syncError, setSyncError] = useState(null);

  const handleStartSync = async () => {
    setIsSyncing(true);
    setSyncError(null);
    setSyncResult(null);
    try {
      const outcome = await migrateLocalStorageToSupabase((msg) => {
        setSyncProgressMsg(msg);
      });
      if (outcome.success || outcome.totalMigrated > 0) {
        setSyncResult(outcome);
        await refetch();
      } else {
        setSyncError(outcome.message || 'Migration encountered an issue.');
      }
    } catch (err) {
      setSyncError(err.message || 'Failed to migrate data to Supabase.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete category?')) return;
    await storageApi.deleteEntity('categories', id);
    await refetch();
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Delete template?')) return;
    await storageApi.deleteEntity('transaction_templates', id);
    await refetch();
  };

  const expenseCats = categories.filter(c => c.type === 'expense');
  const incomeCats = categories.filter(c => c.type === 'income');
  const savingsCats = categories.filter(c => c.type === 'savings');
  const investmentCats = categories.filter(c => c.type === 'investment');

  const openAddCategory = (defaultType = 'expense') => {
    setEditingCategory({ type: defaultType });
    setShowCategoryModal(true);
  };

  const renderCategoryGrid = (cats, typeTitle, typeBadgeClass, icon, defaultType) => (
    <div className="space-y-3 p-4 rounded-2xl bg-card border border-border shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-heading font-bold text-foreground">{typeTitle}</h3>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${typeBadgeClass}`}>
            {cats.length}
          </span>
        </div>
        <button
          onClick={() => openAddCategory(defaultType)}
          className="px-2.5 py-1 bg-muted hover:bg-muted/80 text-foreground border border-border font-semibold rounded-lg text-xs flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3 h-3" />
          <span>Add</span>
        </button>
      </div>

      {cats.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3 bg-muted/10 rounded-xl border border-dashed border-border">
          No categories added for {typeTitle.toLowerCase()} yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {cats.map(cat => (
            <div key={cat.id} className="p-2.5 rounded-xl border border-border bg-muted/20 flex items-center justify-between text-xs hover:border-muted-foreground/30 transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: cat.color_code }} />
                <span className="font-semibold text-foreground truncate">{cat.name}</span>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  onClick={() => { setEditingCategory(cat); setShowCategoryModal(true); }}
                  className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                  title="Edit category"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                  title="Delete category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* HEADER */}
      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-heading font-bold text-foreground">Vault & App Settings</h1>
          <p className="text-xs text-muted-foreground">Manage categories by type (Expense, Income, Savings, Investment), transaction templates, Supabase migration & full backups</p>
        </div>

        <button
          onClick={() => openAddCategory('expense')}
          className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-xs flex items-center gap-2 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Category</span>
        </button>
      </div>

      {/* SUPABASE CLOUD DATA MIGRATION SECTION */}
      <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900/60 border border-indigo-500/30 rounded-2xl p-6 space-y-4 shadow-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <CloudUpload className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-heading font-bold text-foreground">Migrate LocalStorage to Supabase Storage</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Cloud Sync Ready
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Move all your existing stored local data (Workspaces, Accounts, Categories, Transactions, Budgets, Savings Goals, Recurring Rules, Templates, Debts, Loans & Bill Reminders) directly into Supabase PostgreSQL Cloud Storage.
            </p>
          </div>

          <button
            onClick={handleStartSync}
            disabled={isSyncing}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shrink-0 transition-all active:scale-95 cursor-pointer"
          >
            {isSyncing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>{syncProgressMsg || 'Migrating...'}</span>
              </>
            ) : (
              <>
                <CloudUpload className="w-4 h-4 text-white" />
                <span>Move Local Data to Supabase</span>
              </>
            )}
          </button>
        </div>

        {/* SYNC ERROR NOTICE */}
        {syncError && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{syncError}</span>
          </div>
        )}

        {/* SYNC SUCCESS REPORT */}
        {syncResult && (
          <div className="mt-4 p-4 rounded-xl bg-card/80 border border-emerald-500/30 space-y-3 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Supabase Migration Complete!
              </span>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                {syncResult.totalMigrated} Total Records Synced
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                <span className="text-[10px] text-muted-foreground block">Transactions</span>
                <span className="font-bold text-foreground font-mono text-sm">{syncResult.results?.transactions || 0}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                <span className="text-[10px] text-muted-foreground block">Categories</span>
                <span className="font-bold text-foreground font-mono text-sm">{syncResult.results?.categories || 0}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                <span className="text-[10px] text-muted-foreground block">Accounts</span>
                <span className="font-bold text-foreground font-mono text-sm">{syncResult.results?.accounts || 0}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                <span className="text-[10px] text-muted-foreground block">Workspaces</span>
                <span className="font-bold text-foreground font-mono text-sm">{syncResult.results?.workspaces || 0}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                <span className="text-[10px] text-muted-foreground block">Budgets</span>
                <span className="font-bold text-foreground font-mono text-sm">{syncResult.results?.budgets || 0}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                <span className="text-[10px] text-muted-foreground block">Savings Goals</span>
                <span className="font-bold text-foreground font-mono text-sm">{syncResult.results?.savings_goals || 0}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                <span className="text-[10px] text-muted-foreground block">Recurring Rules</span>
                <span className="font-bold text-foreground font-mono text-sm">{syncResult.results?.recurring_rules || 0}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                <span className="text-[10px] text-muted-foreground block">Templates</span>
                <span className="font-bold text-foreground font-mono text-sm">{syncResult.results?.transaction_templates || 0}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                <span className="text-[10px] text-muted-foreground block">Debts & Loans</span>
                <span className="font-bold text-foreground font-mono text-sm">{syncResult.results?.debts_loans || 0}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                <span className="text-[10px] text-muted-foreground block">Bill Reminders</span>
                <span className="font-bold text-foreground font-mono text-sm">{syncResult.results?.bill_reminders || 0}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CATEGORY MANAGER BY TYPE */}
      <div className="space-y-4">
        <div className="space-y-0.5">
          <h2 className="text-lg font-heading font-bold text-foreground">Categories Manager</h2>
          <p className="text-xs text-muted-foreground">Organized by financial classification. Custom color badges can be set for every category.</p>
        </div>

        <div className="space-y-4">
          {renderCategoryGrid(expenseCats, 'Expense Categories', 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20', <TrendingDown className="w-4 h-4 text-rose-500" />, 'expense')}
          {renderCategoryGrid(incomeCats, 'Income Categories', 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20', <TrendingUp className="w-4 h-4 text-emerald-500" />, 'income')}
          {renderCategoryGrid(savingsCats, 'Savings Categories', 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20', <PiggyBank className="w-4 h-4 text-sky-500" />, 'savings')}
          {renderCategoryGrid(investmentCats, 'Investment Categories', 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20', <Landmark className="w-4 h-4 text-amber-500" />, 'investment')}
        </div>
      </div>

      {/* TEMPLATES MANAGER */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
        <h2 className="text-base font-heading font-semibold text-foreground">Transaction Templates</h2>

        {templates.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No quick templates saved yet.</p>
        ) : (
          <div className="divide-y divide-border/40 text-xs">
            {templates.map(tmpl => (
              <div key={tmpl.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{tmpl.name}</p>
                  <p className="text-[10px] font-mono text-muted-foreground">{tmpl.transaction_type} • ₹{tmpl.amount}</p>
                </div>
                <button onClick={() => handleDeleteTemplate(tmpl.id)} className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DATABASE BACKUP & RESTORE */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          <h2 className="text-base font-heading font-semibold text-foreground">Data Privacy & JSON Backup</h2>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Export your complete workspace database (accounts, categories, transactions, budgets, goals, recurring rules) as a structured JSON file for local backup or offline archiving.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => exportFullDatabaseJSON(activeWorkspace.id)}
            className="px-4 py-2.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Full Workspace Backup (JSON)</span>
          </button>

          <button
            onClick={() => setShowLegalModal(true)}
            className="px-4 py-2.5 bg-muted text-foreground hover:bg-muted/80 border border-border rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>View Privacy Policy & Legal Terms</span>
          </button>
        </div>
      </div>

      {showCategoryModal && (
        <CategoryDialog
          initialData={editingCategory}
          onClose={() => { setShowCategoryModal(false); setEditingCategory(null); }}
          onSuccess={refetch}
        />
      )}

      <LegalTermsModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
      />
    </div>
  );
}
