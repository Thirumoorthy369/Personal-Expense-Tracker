import React, { useState, useMemo } from 'react';
import { useWorkspaceData } from '../hooks/useWorkspaceData';
import { formatMoney, monthKey, monthLabel, shiftMonth, todayISO } from '../lib/finance';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Tag, TrendingDown, TrendingUp, Landmark, PiggyBank } from 'lucide-react';

export function CalendarPage() {
  const { transactions, categories, accounts } = useWorkspaceData();

  const [selectedMonth, setSelectedMonth] = useState(monthKey());
  const [selectedDay, setSelectedDay] = useState(todayISO());

  const catMap = new Map(categories.map(c => [c.id, c.name]));
  const accMap = new Map(accounts.map(a => [a.id, a.name]));

  const investmentCategoryIds = useMemo(() => {
    return new Set(categories.filter(c => c.type === 'investment').map(c => c.id));
  }, [categories]);

  const savingsCategoryIds = useMemo(() => {
    return new Set(categories.filter(c => c.type === 'savings').map(c => c.id));
  }, [categories]);

  // Calendar Grid Data Computation
  const { daysGrid, dailyData } = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const firstDayIndex = new Date(y, m - 1, 1).getDay(); // 0 = Sun
    const totalDays = new Date(y, m, 0).getDate();

    const data = {};
    transactions
      .filter(t => t.date?.startsWith(selectedMonth))
      .forEach(t => {
        const d = t.date;
        if (!data[d]) {
          data[d] = { expenses: 0, income: 0, investments: 0, savings: 0, total: 0, count: 0 };
        }
        const amt = Number(t.amount) || 0;
        data[d].total += amt;
        data[d].count += 1;

        const isInvestment = t.transaction_type === 'investment' || investmentCategoryIds.has(t.category_id);
        const isSavings = t.transaction_type === 'savings' || savingsCategoryIds.has(t.category_id);

        if (t.transaction_type === 'income') data[d].income += amt;
        else if (isInvestment) data[d].investments += amt;
        else if (isSavings) data[d].savings += amt;
        else data[d].expenses += amt;
      });

    const grid = [];
    for (let i = 0; i < firstDayIndex; i++) grid.push(null);
    for (let d = 1; d <= totalDays; d++) {
      const dayStr = `${selectedMonth}-${String(d).padStart(2, '0')}`;
      const dayInfo = data[dayStr] || { expenses: 0, income: 0, investments: 0, savings: 0, total: 0, count: 0 };
      grid.push({
        dayNumber: d,
        dateStr: dayStr,
        ...dayInfo
      });
    }

    return { daysGrid: grid, dailyData: data };
  }, [selectedMonth, transactions, investmentCategoryIds, savingsCategoryIds]);

  // Max expense in month for red intensity calculation
  const maxExpenseInMonth = useMemo(() => {
    const values = Object.values(dailyData).map(d => d.expenses);
    return Math.max(1, ...values);
  }, [dailyData]);

  const dayTransactions = useMemo(() => {
    return transactions.filter(t => t.date === selectedDay);
  }, [transactions, selectedDay]);

  const daySummary = useMemo(() => {
    let income = 0, expenses = 0, investments = 0, savings = 0;
    dayTransactions.forEach(t => {
      const amt = Number(t.amount) || 0;
      const isInv = t.transaction_type === 'investment' || investmentCategoryIds.has(t.category_id);
      const isSav = t.transaction_type === 'savings' || savingsCategoryIds.has(t.category_id);

      if (t.transaction_type === 'income') income += amt;
      else if (isInv) investments += amt;
      else if (isSav) savings += amt;
      else expenses += amt;
    });
    return { income, expenses, investments, savings };
  }, [dayTransactions, investmentCategoryIds, savingsCategoryIds]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-rose-500" />
            <h1 className="text-2xl font-heading font-bold text-foreground">Transaction Calendar</h1>
          </div>
          <p className="text-xs text-muted-foreground">Expense days highlighted in Red, Income in Green, Investments in Yellow. Click any day for full item breakdown.</p>
        </div>

        <div className="flex items-center gap-2 bg-muted/40 border border-border p-1.5 rounded-xl font-mono text-xs">
          <button onClick={() => setSelectedMonth(shiftMonth(selectedMonth, -1))} className="p-1.5 hover:bg-muted rounded-lg text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold px-3 text-foreground">{monthLabel(selectedMonth)}</span>
          <button onClick={() => setSelectedMonth(shiftMonth(selectedMonth, 1))} className="p-1.5 hover:bg-muted rounded-lg text-foreground transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* LEGEND BAR */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-2.5 bg-card border border-border rounded-xl text-xs">
        <span className="font-semibold text-foreground">Calendar Heatmap Colors:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-rose-500" />
          <span className="text-muted-foreground">Expense (Red)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">Income (Green)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-muted-foreground">Investment (Yellow)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-sky-500" />
          <span className="text-muted-foreground">Savings (Blue)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* HEATMAP CALENDAR GRID */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-mono font-bold text-muted-foreground border-b border-border/80 pb-2">
            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {daysGrid.map((item, idx) => {
              if (!item) return <div key={`empty-${idx}`} className="h-16 rounded-xl bg-transparent" />;

              const isSelected = item.dateStr === selectedDay;

              // Color determination: Expense -> Red, Income -> Green, Investment -> Amber, Savings -> Sky
              let cellBg = 'hsl(var(--muted) / 0.2)';
              let borderStyle = 'border-border/60 hover:border-muted-foreground/40';

              if (item.expenses > 0) {
                const ratio = item.expenses / maxExpenseInMonth;
                const alpha = Math.max(0.18, Math.min(0.85, ratio));
                cellBg = `rgba(239, 68, 68, ${alpha})`;
              } else if (item.income > 0) {
                cellBg = 'rgba(16, 185, 129, 0.25)';
              } else if (item.investments > 0) {
                cellBg = 'rgba(245, 158, 11, 0.25)';
              } else if (item.savings > 0) {
                cellBg = 'rgba(14, 165, 233, 0.25)';
              }

              return (
                <button
                  key={item.dateStr}
                  onClick={() => setSelectedDay(item.dateStr)}
                  className={`h-16 p-2 rounded-xl border transition-all text-left flex flex-col justify-between ${
                    isSelected
                      ? 'ring-2 ring-primary border-primary shadow-md'
                      : borderStyle
                  }`}
                  style={{ backgroundColor: cellBg }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-foreground">{item.dayNumber}</span>
                    {item.count > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-foreground/60" />
                    )}
                  </div>

                  {item.expenses > 0 ? (
                    <span className="font-mono text-[10px] font-bold text-rose-700 dark:text-rose-300 truncate">
                      -{formatMoney(item.expenses)}
                    </span>
                  ) : item.income > 0 ? (
                    <span className="font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-300 truncate">
                      +{formatMoney(item.income)}
                    </span>
                  ) : item.investments > 0 ? (
                    <span className="font-mono text-[10px] font-bold text-amber-700 dark:text-amber-300 truncate">
                      {formatMoney(item.investments)}
                    </span>
                  ) : item.savings > 0 ? (
                    <span className="font-mono text-[10px] font-bold text-sky-700 dark:text-sky-300 truncate">
                      {formatMoney(item.savings)}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* DAY INSPECTOR SIDE PANEL */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="border-b border-border/80 pb-3 flex items-center justify-between">
            <div>
              <h2 className="font-heading font-semibold text-base text-foreground">Day Inspector</h2>
              <p className="text-xs font-mono text-muted-foreground">{selectedDay}</p>
            </div>
            <span className="text-xs bg-primary/10 text-primary font-mono px-2.5 py-0.5 rounded-full font-bold">
              {dayTransactions.length} Items
            </span>
          </div>

          {/* DAY SUMMARY PILLS */}
          {dayTransactions.length > 0 && (
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              {daySummary.income > 0 && (
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <span className="text-[9px] uppercase font-bold block text-muted-foreground">Income</span>
                  <span className="font-bold">+{formatMoney(daySummary.income)}</span>
                </div>
              )}
              {daySummary.expenses > 0 && (
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
                  <span className="text-[9px] uppercase font-bold block text-muted-foreground">Expense</span>
                  <span className="font-bold">-{formatMoney(daySummary.expenses)}</span>
                </div>
              )}
              {daySummary.investments > 0 && (
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                  <span className="text-[9px] uppercase font-bold block text-muted-foreground">Investment</span>
                  <span className="font-bold">{formatMoney(daySummary.investments)}</span>
                </div>
              )}
              {daySummary.savings > 0 && (
                <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400">
                  <span className="text-[9px] uppercase font-bold block text-muted-foreground">Savings</span>
                  <span className="font-bold">{formatMoney(daySummary.savings)}</span>
                </div>
              )}
            </div>
          )}

          {/* TRANSACTIONS LIST FOR SELECTED DATE */}
          <div className="space-y-3 max-h-[50vh] overflow-y-auto divide-y divide-border/40">
            {dayTransactions.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8 font-medium">No transactions recorded on this date.</p>
            ) : (
              dayTransactions.map(tx => {
                const isInv = tx.transaction_type === 'investment' || investmentCategoryIds.has(tx.category_id);
                const isSav = tx.transaction_type === 'savings' || savingsCategoryIds.has(tx.category_id);
                const isInc = tx.transaction_type === 'income';

                let badgeClass = 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
                let amountClass = 'text-rose-600 dark:text-rose-400';
                let prefix = '-';
                let label = 'Expense';

                if (isInc) {
                  badgeClass = 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
                  amountClass = 'text-emerald-600 dark:text-emerald-400';
                  prefix = '+';
                  label = 'Income';
                } else if (isInv) {
                  badgeClass = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
                  amountClass = 'text-amber-600 dark:text-amber-400';
                  prefix = '';
                  label = 'Investment';
                } else if (isSav) {
                  badgeClass = 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30';
                  amountClass = 'text-sky-600 dark:text-sky-400';
                  prefix = '';
                  label = 'Savings';
                }

                return (
                  <div key={tx.id} className="pt-3 first:pt-0 space-y-1.5 text-xs">
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-foreground">{tx.payee || 'Ledger Item'}</span>
                      <span className={`font-mono font-bold ${amountClass}`}>
                        {prefix}{formatMoney(tx.amount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-muted-foreground text-[11px]">
                        {catMap.get(tx.category_id) || 'Uncategorized'} • {accMap.get(tx.account_id) || 'Account'}
                      </p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badgeClass}`}>
                        {label}
                      </span>
                    </div>

                    {tx.notes && <p className="text-muted-foreground italic text-[10px] pt-0.5">{tx.notes}</p>}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
