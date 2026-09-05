import React, { useState, useMemo } from 'react';
import { useWorkspaceData } from '../hooks/useWorkspaceData';
import { formatMoney, formatCompactMoney } from '../lib/finance';
import { FileSpreadsheet, ChevronLeft, ChevronRight } from 'lucide-react';

export function Yearly() {
  const { transactions } = useWorkspaceData();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const yearTx = useMemo(() => {
    return transactions.filter(t => t.date && t.date.startsWith(String(selectedYear)));
  }, [transactions, selectedYear]);

  const yearIncome = yearTx.filter(t => t.transaction_type === 'income').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const yearExpense = yearTx.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const yearSavings = yearTx.filter(t => t.transaction_type === 'savings').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const yearInvestments = yearTx.filter(t => t.transaction_type === 'investment').reduce((s, t) => s + (Number(t.amount) || 0), 0);

  const monthsData = useMemo(() => {
    const result = [];
    for (let m = 1; m <= 12; m++) {
      const mStr = `${selectedYear}-${String(m).padStart(2, '0')}`;
      const mTx = yearTx.filter(t => t.date?.startsWith(mStr));
      const inc = mTx.filter(t => t.transaction_type === 'income').reduce((s, t) => s + (Number(t.amount) || 0), 0);
      const exp = mTx.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + (Number(t.amount) || 0), 0);
      const sav = mTx.filter(t => t.transaction_type === 'savings').reduce((s, t) => s + (Number(t.amount) || 0), 0);
      const inv = mTx.filter(t => t.transaction_type === 'investment').reduce((s, t) => s + (Number(t.amount) || 0), 0);

      const d = new Date(selectedYear, m - 1, 1);
      result.push({
        monthName: d.toLocaleDateString('en-US', { month: 'short' }),
        Income: inc,
        Expense: exp,
        Savings: sav,
        Investments: inv,
        Net: inc - exp
      });
    }
    return result;
  }, [yearTx, selectedYear]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-heading font-bold text-foreground">Annual Financial Statement ({selectedYear})</h1>
          <p className="text-xs text-muted-foreground">Aggregated yearly totals across all months</p>
        </div>

        <div className="flex items-center gap-2 bg-muted/40 border border-border p-1 rounded-xl font-mono text-xs">
          <button onClick={() => setSelectedYear(y => y - 1)} className="p-1.5 hover:bg-muted rounded-lg text-foreground">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold px-3 text-foreground">{selectedYear}</span>
          <button onClick={() => setSelectedYear(y => y + 1)} className="p-1.5 hover:bg-muted rounded-lg text-foreground">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* YEAR KPI METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-1 shadow-sm">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Total Annual Income</span>
          <p className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300">{formatCompactMoney(yearIncome)}</p>
        </div>

        <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 space-y-1 shadow-sm">
          <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">Total Annual Expenses</span>
          <p className="text-xl font-bold font-mono text-rose-700 dark:text-rose-300">{formatCompactMoney(yearExpense)}</p>
        </div>

        <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 space-y-1 shadow-sm">
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Total Annual Savings</span>
          <p className="text-xl font-bold font-mono text-amber-700 dark:text-amber-300">{formatCompactMoney(yearSavings)}</p>
        </div>

        <div className="p-4 rounded-2xl border border-purple-500/20 bg-purple-500/5 space-y-1 shadow-sm">
          <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">Total Annual Investments</span>
          <p className="text-xl font-bold font-mono text-purple-700 dark:text-purple-300">{formatCompactMoney(yearInvestments)}</p>
        </div>
      </div>

      {/* MONTHLY BREAKDOWN TABLE */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
        <h2 className="text-base font-heading font-semibold text-foreground">{selectedYear} Monthly Ledger Summary</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-mono">
                <th className="py-2.5 px-3">Month</th>
                <th className="py-2.5 px-3 text-right">Income</th>
                <th className="py-2.5 px-3 text-right">Expense</th>
                <th className="py-2.5 px-3 text-right">Savings</th>
                <th className="py-2.5 px-3 text-right">Investments</th>
                <th className="py-2.5 px-3 text-right">Net Flow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-mono">
              {monthsData.map(m => (
                <tr key={m.monthName} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-3 font-semibold text-foreground">{m.monthName}</td>
                  <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400">{formatMoney(m.Income)}</td>
                  <td className="py-3 px-3 text-right text-rose-600 dark:text-rose-400">{formatMoney(m.Expense)}</td>
                  <td className="py-3 px-3 text-right text-amber-600 dark:text-amber-400">{formatMoney(m.Savings)}</td>
                  <td className="py-3 px-3 text-right text-purple-600 dark:text-purple-400">{formatMoney(m.Investments)}</td>
                  <td className={`py-3 px-3 text-right font-bold ${m.Net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {formatMoney(m.Net)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
