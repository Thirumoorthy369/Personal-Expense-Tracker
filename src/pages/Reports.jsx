import React, { useState, useMemo } from 'react';
import { useWorkspaceData } from '../hooks/useWorkspaceData';
import { formatMoney, monthKey, monthLabel, shiftMonth } from '../lib/finance';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChevronLeft, ChevronRight, X, ListFilter, ArrowRight, Activity, ShieldCheck, HeartPulse, Wallet } from 'lucide-react';
import { CustomChartTooltip } from '../components/ui/ChartTooltip';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444', '#06b6d4', '#6366f1'];

export function Reports() {
  const { categories, transactions, accounts } = useWorkspaceData();

  const [selectedMonth, setSelectedMonth] = useState(monthKey());
  const [breakdownType, setBreakdownType] = useState('expense'); // expense, income, savings, investment
  const [drilledCategory, setDrilledCategory] = useState(null);

  const catMap = new Map(categories.map(c => [c.id, c.name]));
  const accMap = new Map(accounts.map(a => [a.id, a.name]));

  // Financial Health Metrics Calculation
  const healthMetrics = useMemo(() => {
    const monthTx = transactions.filter(t => t.date?.startsWith(selectedMonth));
    const incomeSum = monthTx.filter(t => t.transaction_type === 'income').reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const expenseSum = monthTx.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const totalLiquid = accounts.reduce((s, a) => s + (Number(a.balance) || 0), 0);

    const savingsRate = incomeSum > 0 ? Math.max(0, Math.round(((incomeSum - expenseSum) / incomeSum) * 100)) : 0;
    const runwayMonths = expenseSum > 0 ? (totalLiquid / expenseSum).toFixed(1) : '∞';
    
    let score = 50;
    if (incomeSum > expenseSum) score += 20;
    if (savingsRate >= 20) score += 15;
    else if (savingsRate >= 10) score += 10;
    if (Number(runwayMonths) >= 6) score += 15;
    else if (Number(runwayMonths) >= 3) score += 10;
    score = Math.min(100, Math.max(0, score));

    return { incomeSum, expenseSum, totalLiquid, savingsRate, runwayMonths, score };
  }, [transactions, selectedMonth, accounts]);

  // Month-scoped transactions for selected breakdown type
  const typeTx = useMemo(() => {
    return transactions.filter(t => t.date?.startsWith(selectedMonth) && t.transaction_type === breakdownType);
  }, [transactions, selectedMonth, breakdownType]);

  // Aggregate Category Totals for Pie Chart & Breakdown Table
  const categoryBreakdown = useMemo(() => {
    const map = new Map();
    typeTx.forEach(t => {
      const catId = t.category_id || 'uncategorized';
      const current = map.get(catId) || { category_id: catId, name: catMap.get(catId) || 'Uncategorized', total: 0, count: 0 };
      current.total += Number(t.amount) || 0;
      current.count += 1;
      map.set(catId, current);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [typeTx, catMap]);

  const totalSum = categoryBreakdown.reduce((sum, c) => sum + c.total, 0);

  // Daily Balance Trend Line Chart Data
  const dailyTrendData = useMemo(() => {
    const daysInMonth = new Date(selectedMonth.split('-')[0], selectedMonth.split('-')[1], 0).getDate();
    const result = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;
      const dayTotal = typeTx
        .filter(t => t.date === dayStr)
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      result.push({ day: String(day), amount: dayTotal });
    }
    return result;
  }, [selectedMonth, typeTx]);

  // Drilled Category Transactions
  const drilledTransactions = useMemo(() => {
    if (!drilledCategory) return [];
    return typeTx.filter(t => (t.category_id || 'uncategorized') === drilledCategory.category_id);
  }, [typeTx, drilledCategory]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-heading font-bold text-foreground">Financial Analytics & Reports</h1>
          <p className="text-xs text-muted-foreground">Deterministic pie chart breakdowns, daily trend lines, and health score analytics</p>
        </div>

        <div className="flex items-center gap-2 bg-muted/40 border border-border p-1 rounded-xl font-mono text-xs">
          <button onClick={() => setSelectedMonth(shiftMonth(selectedMonth, -1))} className="p-1.5 hover:bg-muted rounded-lg text-foreground">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold px-2 text-foreground">{monthLabel(selectedMonth)}</span>
          <button onClick={() => setSelectedMonth(shiftMonth(selectedMonth, 1))} className="p-1.5 hover:bg-muted rounded-lg text-foreground">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* FINANCIAL HEALTH SCORE CARD */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-heading font-semibold text-foreground">Financial Health & Wellness Score</h2>
              <p className="text-xs text-muted-foreground">Calculated runway, savings rate, and cashflow stability index</p>
            </div>
          </div>
          <div className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono border ${
            healthMetrics.score >= 80 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
            healthMetrics.score >= 50 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
            'bg-rose-500/10 text-rose-500 border-rose-500/20'
          }`}>
            Score: {healthMetrics.score} / 100
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span>Monthly Savings Rate</span>
            </div>
            <p className="text-xl font-bold text-foreground font-mono">{healthMetrics.savingsRate}%</p>
            <p className="text-[11px] text-muted-foreground">Target: 20%+ of income saved</p>
          </div>

          <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <ShieldCheck className="w-4 h-4 text-sky-500" />
              <span>Emergency Runway</span>
            </div>
            <p className="text-xl font-bold text-foreground font-mono">{healthMetrics.runwayMonths} months</p>
            <p className="text-[11px] text-muted-foreground">Based on current liquid balances</p>
          </div>

          <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <Wallet className="w-4 h-4 text-indigo-500" />
              <span>Net Balance Flow</span>
            </div>
            <p className={`text-xl font-bold font-mono ${healthMetrics.incomeSum >= healthMetrics.expenseSum ? 'text-emerald-500' : 'text-rose-500'}`}>
              {formatMoney(healthMetrics.incomeSum - healthMetrics.expenseSum)}
            </p>
            <p className="text-[11px] text-muted-foreground">Income vs. Expense difference</p>
          </div>
        </div>
      </div>

      {/* TYPE BREAKDOWN TABS (Wraps to 2x2 grid on mobile!) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-card border border-border p-1.5 rounded-2xl shadow-sm h-auto">
        {[
          { key: 'expense', label: 'Expenses' },
          { key: 'income', label: 'Income' },
          { key: 'savings', label: 'Savings' },
          { key: 'investment', label: 'Investments' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setBreakdownType(tab.key)}
            className={`py-2.5 px-3 rounded-xl text-xs font-semibold capitalize transition-all ${
              breakdownType === tab.key
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'hover:bg-muted text-muted-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PIE CHART */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-heading font-semibold text-foreground capitalize">{breakdownType} Distribution</h2>
            <span className="text-xs font-mono font-bold text-primary">{formatMoney(totalSum)}</span>
          </div>

          {categoryBreakdown.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">
              No {breakdownType} data for {monthLabel(selectedMonth)}.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* DAILY TREND LINE CHART */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-heading font-semibold text-foreground">Daily Trend Line</h2>
            <span className="text-xs font-mono text-muted-foreground">{monthLabel(selectedMonth)}</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="day" stroke="currentColor" className="text-[10px] text-muted-foreground font-mono" />
                <YAxis stroke="currentColor" className="text-[10px] text-muted-foreground font-mono" tickFormatter={(v) => `₹${v}`} />
                <Tooltip content={<CustomChartTooltip />} />
                <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CATEGORY BREAKDOWN TABLE WITH DRILL DOWN */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
        <h2 className="text-base font-heading font-semibold text-foreground">Category Breakdown (Click row to inspect)</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-mono">
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Items Count</th>
                <th className="py-2.5 px-3 text-right">% of Total</th>
                <th className="py-2.5 px-3 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {categoryBreakdown.map((item, idx) => {
                const percent = totalSum > 0 ? ((item.total / totalSum) * 100).toFixed(1) : '0';
                return (
                  <tr
                    key={item.category_id}
                    onClick={() => setDrilledCategory(item)}
                    className="hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3 font-medium text-foreground flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span>{item.name}</span>
                    </td>
                    <td className="py-3 px-3 text-muted-foreground font-mono">{item.count} txns</td>
                    <td className="py-3 px-3 text-right font-mono text-muted-foreground">{percent}%</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-foreground">{formatMoney(item.total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DRILL DOWN MODAL */}
      {drilledCategory && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setDrilledCategory(null); }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="bg-card border border-border rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
              <div>
                <h3 className="font-heading font-semibold text-base text-foreground">
                  Drill-down: {drilledCategory.name}
                </h3>
                <p className="text-xs text-muted-foreground font-mono">
                  {drilledTransactions.length} transactions • Total: {formatMoney(drilledCategory.total)}
                </p>
              </div>
              <button onClick={() => setDrilledCategory(null)} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto divide-y divide-border/40 text-xs">
              {drilledTransactions.map(tx => (
                <div key={tx.id} className="py-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-foreground">{tx.payee || 'Transaction'}</p>
                    <p className="text-muted-foreground font-mono">{tx.date} • {accMap.get(tx.account_id) || 'Account'}</p>
                    {tx.notes && <p className="text-muted-foreground">{tx.notes}</p>}
                  </div>
                  <div className="font-mono font-bold text-foreground">
                    {formatMoney(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
