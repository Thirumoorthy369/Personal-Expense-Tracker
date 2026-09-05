import React, { useState } from 'react';
import { useWorkspaceData } from '../hooks/useWorkspaceData';
import { useWorkspace } from '../context/WorkspaceContext';
import { storageApi } from '../lib/storage';
import { formatMoney, monthKey, monthLabel, shiftMonth } from '../lib/finance';
import { BudgetFormDialog } from '../components/dialogs/BudgetFormDialog';
import { SavingsGoalFormDialog } from '../components/dialogs/SavingsGoalFormDialog';
import { PieChart, Target, Plus, ChevronLeft, ChevronRight, AlertTriangle, Edit2, Trash2 } from 'lucide-react';

export function Budgets() {
  const { isWorkspaceAdmin } = useWorkspace();
  const { budgets, savingsGoals, categories, transactions, refetch } = useWorkspaceData();

  const [selectedMonth, setSelectedMonth] = useState(monthKey());
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  const catMap = new Map(categories.map(c => [c.id, c.name]));

  const handleDeleteBudget = async (id) => {
    if (!window.confirm('Delete this budget limit?')) return;
    await storageApi.deleteEntity('budgets', id);
    await refetch();
  };

  const handleDeleteGoal = async (id) => {
    if (!window.confirm('Delete this savings goal target?')) return;
    await storageApi.deleteEntity('savings_goals', id);
    await refetch();
  };

  return (
    <div className="space-y-8">
      {/* HEADER MATCHING SCREENSHOT #1 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-serif font-bold text-foreground">Budgets & Goals</h1>
          <p className="text-sm text-muted-foreground italic">Track spending limits and savings targets</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-background border border-border p-1 rounded-xl font-mono text-xs">
            <button onClick={() => setSelectedMonth(shiftMonth(selectedMonth, -1))} className="p-1 hover:bg-muted rounded-lg text-foreground">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold px-2 text-foreground">{monthLabel(selectedMonth)}</span>
            <button onClick={() => setSelectedMonth(shiftMonth(selectedMonth, 1))} className="p-1 hover:bg-muted rounded-lg text-foreground">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => { setEditingBudget(null); setShowBudgetModal(true); }}
            className="px-4 py-2 border border-border bg-background hover:bg-muted text-foreground font-medium rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add budget</span>
          </button>
        </div>
      </div>

      {/* MONTHLY BUDGETS SECTION */}
      <div className="space-y-4">
        <h2 className="text-xl font-serif font-semibold text-foreground">Monthly Budgets</h2>

        {budgets.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center text-xs text-muted-foreground">
            No monthly budget limits set yet. Click "+ Add budget" to start tracking!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets.map(b => {
              const catName = catMap.get(b.category_id) || 'Category';
              const spent = transactions
                .filter(t => t.category_id === b.category_id && t.transaction_type === 'expense' && t.date?.startsWith(selectedMonth))
                .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

              const limit = Number(b.monthly_limit) || 10000;
              const percent = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
              const isOverThreshold = percent >= (Number(b.alert_threshold_percentage) || 80);

              return (
                <div key={b.id} className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm relative group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-indigo-500 shrink-0" />
                      <h3 className="font-serif font-bold text-lg text-foreground">{catName}</h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditingBudget(b); setShowBudgetModal(true); }}
                        className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBudget(b.id)}
                        className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="text-muted-foreground">Spent {formatMoney(spent)} of {formatMoney(limit)}</span>
                      <span className={`font-mono font-bold ${spent > limit ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>{percent}%</span>
                    </div>

                    <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${spent > limit ? 'bg-rose-500' : 'bg-amber-500'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {isOverThreshold && (
                    <p className={`text-xs flex items-center gap-1 font-medium pt-1 ${spent > limit ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {spent > limit ? 'Over monthly limit!' : 'Above alert threshold'}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SAVINGS & INVESTMENT GOALS SECTION */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-serif font-semibold text-foreground">Savings & Investment Goals</h2>
          <button
            onClick={() => { setEditingGoal(null); setShowGoalModal(true); }}
            className="px-4 py-2 border border-border bg-background hover:bg-muted text-foreground font-medium rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add goal</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savingsGoals.map(goal => {
            const target = Number(goal.target_amount) || 90000;

            // Automatically calculate saved amount from linked savings transactions + current_amount base
            const linkedSavings = transactions
              .filter(t => (t.category_id === goal.category_id || (goal.title && t.payee?.toLowerCase().includes(goal.title.toLowerCase()))) && (t.transaction_type === 'savings' || t.transaction_type === 'investment'))
              .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

            const current = (Number(goal.current_amount) || 0) + linkedSavings;
            const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

            const radius = 38;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (percent / 100) * circumference;

            return (
              <div key={goal.id} className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm relative group">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-lg text-foreground">{goal.title}</h3>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditingGoal(goal); setShowGoalModal(true); }} className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteGoal(goal.id)} className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* CIRCULAR PROGRESS RING */}
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="10"
                        className="text-muted/30"
                        fill="transparent"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="10"
                        className="text-emerald-500"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute font-serif font-bold text-xl text-foreground">
                      {percent}%
                    </span>
                  </div>

                  <div className="text-center font-mono space-y-0.5">
                    <p className="font-bold text-sm text-foreground">{formatMoney(current)} / {formatMoney(target)}</p>
                    <p className="text-xs text-muted-foreground">By {goal.target_date || '2027-12-31'}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODALS */}
      {showBudgetModal && (
        <BudgetFormDialog
          initialData={editingBudget}
          onClose={() => { setShowBudgetModal(false); setEditingBudget(null); }}
          onSuccess={refetch}
        />
      )}

      {showGoalModal && (
        <SavingsGoalFormDialog
          initialData={editingGoal}
          onClose={() => { setShowGoalModal(false); setEditingGoal(null); }}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}
