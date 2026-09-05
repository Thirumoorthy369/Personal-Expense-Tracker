import React, { useState, useMemo } from 'react';
import { useWorkspaceData } from '../hooks/useWorkspaceData';
import { lastNMonths, monthLabel, formatMoney, formatCompactMoney } from '../lib/finance';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, Layers } from 'lucide-react';
import { CustomChartTooltip } from '../components/ui/ChartTooltip';

export function Cashflow() {
  const { transactions } = useWorkspaceData();
  const [spanMonths, setSpanMonths] = useState(12); // 12, 24, 36

  // Multi-month aggregated dataset
  const cashflowData = useMemo(() => {
    const months = lastNMonths(spanMonths);
    return months.map(mKey => {
      const mTx = transactions.filter(t => t.date?.startsWith(mKey));
      const inc = mTx.filter(t => t.transaction_type === 'income').reduce((s, t) => s + (Number(t.amount) || 0), 0);
      const exp = mTx.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + (Number(t.amount) || 0), 0);
      const sav = mTx.filter(t => t.transaction_type === 'savings').reduce((s, t) => s + (Number(t.amount) || 0), 0);
      const inv = mTx.filter(t => t.transaction_type === 'investment').reduce((s, t) => s + (Number(t.amount) || 0), 0);

      return {
        monthKey: mKey,
        month: monthLabel(mKey),
        Income: inc,
        Expense: exp,
        Savings: sav,
        Investments: inv,
        Net: inc - exp
      };
    });
  }, [transactions, spanMonths]);

  // Aggregated totals over selected span
  const totalIncome = cashflowData.reduce((s, d) => s + d.Income, 0);
  const totalExpense = cashflowData.reduce((s, d) => s + d.Expense, 0);
  const totalSavings = cashflowData.reduce((s, d) => s + d.Savings, 0);
  const totalInvestments = cashflowData.reduce((s, d) => s + d.Investments, 0);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-heading font-bold text-foreground">Cashflow Multi-Year Trends</h1>
          <p className="text-xs text-muted-foreground">Month-over-month trajectory comparing income, expenses, savings, and investments</p>
        </div>

        {/* Span Selector */}
        <div className="flex items-center gap-1.5 bg-muted/40 border border-border p-1 rounded-xl text-xs font-mono">
          {[12, 24, 36].map(num => (
            <button
              key={num}
              onClick={() => setSpanMonths(num)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                spanMonths === num ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted text-muted-foreground'
              }`}
            >
              {num} Months
            </button>
          ))}
        </div>
      </div>

      {/* METRIC CARDS (INTERPOLATED LABELS - NO PLACEHOLDER BUGS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-1 shadow-sm">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Income ({spanMonths} mo)</span>
          <p className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300">{formatCompactMoney(totalIncome)}</p>
        </div>

        <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 space-y-1 shadow-sm">
          <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">Expense ({spanMonths} mo)</span>
          <p className="text-xl font-bold font-mono text-rose-700 dark:text-rose-300">{formatCompactMoney(totalExpense)}</p>
        </div>

        <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 space-y-1 shadow-sm">
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Savings ({spanMonths} mo)</span>
          <p className="text-xl font-bold font-mono text-amber-700 dark:text-amber-300">{formatCompactMoney(totalSavings)}</p>
        </div>

        <div className="p-4 rounded-2xl border border-purple-500/20 bg-purple-500/5 space-y-1 shadow-sm">
          <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">Investments ({spanMonths} mo)</span>
          <p className="text-xl font-bold font-mono text-purple-700 dark:text-purple-300">{formatCompactMoney(totalInvestments)}</p>
        </div>
      </div>

      {/* COMPOSED CHART */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-heading font-semibold text-foreground">Composed Multi-Series Trajectory</h2>
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>

        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={cashflowData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="month" stroke="currentColor" className="text-[10px] text-muted-foreground font-mono" interval={0} angle={-30} textAnchor="end" />
              <YAxis stroke="currentColor" className="text-[10px] text-muted-foreground font-mono" tickFormatter={(v) => `₹${v/1000}k`} />
              <Tooltip content={<CustomChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Savings" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Investments" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="Net" stroke="#3b82f6" strokeWidth={3} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* BREAKDOWN TABLE */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
        <h2 className="text-base font-heading font-semibold text-foreground">Monthly Cashflow Breakdown Table</h2>

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
              {cashflowData.map(d => (
                <tr key={d.monthKey} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-3 font-semibold text-foreground">{d.month}</td>
                  <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400">{formatMoney(d.Income)}</td>
                  <td className="py-3 px-3 text-right text-rose-600 dark:text-rose-400">{formatMoney(d.Expense)}</td>
                  <td className="py-3 px-3 text-right text-amber-600 dark:text-amber-400">{formatMoney(d.Savings)}</td>
                  <td className="py-3 px-3 text-right text-purple-600 dark:text-purple-400">{formatMoney(d.Investments)}</td>
                  <td className={`py-3 px-3 text-right font-bold ${d.Net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {formatMoney(d.Net)}
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
