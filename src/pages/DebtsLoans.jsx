import React, { useState } from 'react';
import { useWorkspaceData } from '../hooks/useWorkspaceData';
import { useWorkspace } from '../context/WorkspaceContext';
import { storageApi } from '../lib/storage';
import { formatMoney } from '../lib/finance';
import { DebtLoanFormDialog } from '../components/dialogs/DebtLoanFormDialog';
import { Landmark, Plus, Edit2, Trash2, CheckCircle2 } from 'lucide-react';

export function DebtsLoans() {
  const { isWorkspaceAdmin } = useWorkspace();
  const { debts, refetch } = useWorkspaceData();

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this loan record?')) return;
    await storageApi.deleteEntity('debts_loans', id);
    await refetch();
  };

  const totalBorrowed = debts.filter(d => d.type === 'borrowed').reduce((s, d) => s + (Number(d.remaining_amount) || 0), 0);
  const totalLent = debts.filter(d => d.type === 'lent').reduce((s, d) => s + (Number(d.remaining_amount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-heading font-bold text-foreground">Debts, Loans & Liabilities</h1>
          <p className="text-xs text-muted-foreground">Track borrowed bank loans, EMI balances, and personal advances</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { setEditingItem(null); setShowModal(true); }}
            className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-xs flex items-center gap-2 hover:opacity-90 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Debt/Loan</span>
          </button>
        </div>
      </div>

      {/* METRIC TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 space-y-1 shadow-sm">
          <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">Total Liabilities (I Owe)</span>
          <p className="text-2xl font-bold font-mono text-rose-700 dark:text-rose-300">{formatMoney(totalBorrowed)}</p>
        </div>

        <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-1 shadow-sm">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Total Receivables (Owed to Me)</span>
          <p className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300">{formatMoney(totalLent)}</p>
        </div>
      </div>

      {/* DEBTS GRID */}
      {debts.length === 0 ? (
        <div className="bg-card border border-border border-dashed rounded-2xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Landmark className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading font-semibold text-base text-foreground">No Debts or Loans Recorded</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Keep track of bank home loans, vehicle EMIs, personal advances, and money lent out to friends.
            </p>
          </div>
          <button
            onClick={() => { setEditingItem(null); setShowModal(true); }}
            className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-xs inline-flex items-center gap-2 hover:opacity-90 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record First Loan/EMI</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {debts.map(d => {
            const isBorrowed = d.type === 'borrowed';
            const principal = Number(d.principal_amount) || 1;
            const remaining = Number(d.remaining_amount) || 0;
            const paidPercent = Math.min(100, Math.max(0, (((principal - remaining) / principal) * 100)));

            const handleQuickRepay = async () => {
              const amountStr = prompt(`Record EMI / Payment for "${d.title}" (Current remaining: ₹${remaining}):`, '1000');
              if (!amountStr) return;
              const payAmt = Number(amountStr);
              if (isNaN(payAmt) || payAmt <= 0) return alert('Please enter a valid payment amount');

              const newRemaining = Math.max(0, remaining - payAmt);
              await storageApi.saveEntity('debts_loans', {
                ...d,
                remaining_amount: newRemaining,
                status: newRemaining === 0 ? 'settled' : 'active'
              });
              await refetch();
            };

            return (
              <div key={d.id} className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm relative group">
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase ${
                      isBorrowed ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {isBorrowed ? 'Liability (I Owe)' : 'Receivable (Owed to Me)'}
                    </span>
                    <h3 className="font-semibold text-sm text-foreground pt-1.5">{d.title}</h3>
                    <p className="text-[10px] text-muted-foreground font-mono">Counterparty: {d.counterparty}</p>
                  </div>

                  <div className="flex items-center gap-1 opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditingItem(d); setShowModal(true); }}
                      className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
                      title="Edit Record"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors cursor-pointer"
                      title="Delete Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-muted-foreground">Remaining Balance:</span>
                    <span className="font-bold text-foreground">{formatMoney(d.remaining_amount)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                    <div className="bg-primary h-full rounded-full transition-all duration-300" style={{ width: `${paidPercent}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                    <span>Principal: {formatMoney(d.principal_amount)}</span>
                    <span>{paidPercent.toFixed(0)}% Repaid</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {remaining === 0 ? 'Fully Settled 🎉' : `Interest: ${d.interest_rate || 0}% p.a.`}
                  </span>
                  {remaining > 0 && (
                    <button
                      onClick={handleQuickRepay}
                      className="px-3 py-1 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-semibold rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Record EMI / Payment</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <DebtLoanFormDialog
          initialData={editingItem}
          onClose={() => { setShowModal(false); setEditingItem(null); }}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}
