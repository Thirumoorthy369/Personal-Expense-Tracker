import React, { useState } from 'react';
import { todayISO, formatMoney } from '../lib/finance';
import { Wallet, ArrowDownRight, ArrowUpRight, PiggyBank, Landmark, Percent, ChevronLeft, ChevronRight } from 'lucide-react';

export function DayOverview({ transactions = [], accounts = [], categories = [] }) {
  const [selectedDate, setSelectedDate] = useState(todayISO());

  const handleShiftDay = (deltaDays) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + deltaDays);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${day}`);
  };

  const dayTx = transactions.filter(t => t.date === selectedDate);

  const dayIncome = dayTx.filter(t => t.transaction_type === 'income').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const dayExpense = dayTx.filter(t => t.transaction_type === 'expense').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const daySavings = dayTx.filter(t => t.transaction_type === 'savings').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const dayInvestment = dayTx.filter(t => t.transaction_type === 'investment').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalBalance = accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
  const dayNet = dayIncome - dayExpense;
  const daySavingsRate = dayIncome > 0 ? Math.round(((daySavings + dayInvestment + dayNet) / dayIncome) * 100) : 0;

  // Format DD-MM-YYYY
  const [y, m, d] = selectedDate.split('-');
  const displayDate = `${d}-${m}-${y}`;

  return (
    <div className="space-y-4 border-t border-border/40 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-foreground">Day overview</h2>
          <p className="text-xs text-muted-foreground">Income, expenses, savings & investments for a specific date</p>
        </div>

        {/* Date Selector Navigation & Quick Add */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-card border border-border p-1 rounded-xl text-xs font-mono">
            <button onClick={() => handleShiftDay(-1)} className="p-1 hover:bg-muted rounded-lg text-foreground">
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="relative flex items-center px-1">
              <span className="font-semibold text-foreground mr-1.5">{displayDate}</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="opacity-0 absolute inset-0 cursor-pointer w-full"
              />
              <span className="text-muted-foreground text-xs">📅</span>
            </div>

            <button onClick={() => handleShiftDay(1)} className="p-1 hover:bg-muted rounded-lg text-foreground">
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setSelectedDate(todayISO())}
              className="px-2.5 py-1 bg-muted/60 hover:bg-muted text-foreground rounded-lg font-medium text-xs ml-1"
            >
              Today
            </button>
          </div>
        </div>
      </div>

      {/* 6 DAY KPI CARDS MATCHING DASHBOARD.PNG */}
      <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
        {/* Total Balance */}
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Total balance</p>
            <p className="text-xl font-serif font-bold text-foreground">{formatMoney(totalBalance)}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Expenses</p>
            <p className="text-xl font-serif font-bold text-foreground">{formatMoney(dayExpense)}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>

        {/* Income */}
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Income</p>
            <p className="text-xl font-serif font-bold text-foreground">{formatMoney(dayIncome)}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        {/* Savings */}
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Savings</p>
            <p className="text-xl font-serif font-bold text-foreground">{formatMoney(daySavings)}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400">
            <PiggyBank className="w-5 h-5" />
          </div>
        </div>

        {/* Investments */}
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Investments</p>
            <p className="text-xl font-serif font-bold text-foreground">{formatMoney(dayInvestment)}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
            <Landmark className="w-5 h-5" />
          </div>
        </div>

        {/* Savings Rate */}
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Savings rate</p>
            <p className="text-xl font-serif font-bold text-foreground">{daySavingsRate}%</p>
          </div>
          <div className="p-2.5 rounded-xl bg-muted/60 text-muted-foreground">
            <Percent className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
}
