import React, { useState, useMemo } from 'react';
import { useWorkspaceData } from '../hooks/useWorkspaceData';
import { useWorkspace } from '../context/WorkspaceContext';
import { Link } from 'react-router-dom';
import {
  monthKey,
  monthLabel,
  shiftMonth,
  lastNMonths,
  formatMoney
} from '../lib/finance';
import { DayOverview } from '../components/DayOverview';
import { TransactionFormDialog } from '../components/dialogs/TransactionFormDialog';
import { CustomChartTooltip } from '../components/ui/ChartTooltip';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  Landmark,
  Plus,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Percent,
  Search
} from 'lucide-react';

export function Dashboard() {
  const { accounts, categories, transactions, refetch } = useWorkspaceData();

  const [selectedMonth, setSelectedMonth] = useState(monthKey());
  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter transactions for selected month
  const monthTx = useMemo(() => {
    return transactions.filter(t => t.date && t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // Set of category IDs classified under investment
  const investmentCategoryIds = useMemo(() => {
    return new Set(categories.filter(c => c.type === 'investment').map(c => c.id));
  }, [categories]);

  // Financial Metrics for Selected Month
  const incomeThisMonth = useMemo(() => {
    return monthTx.filter(t => t.transaction_type === 'income').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  }, [monthTx]);

  const expensesThisMonth = useMemo(() => {
    return monthTx.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  }, [monthTx]);

  const savingsThisMonth = useMemo(() => {
    return monthTx.filter(t => t.transaction_type === 'savings').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  }, [monthTx]);

  const investmentsThisMonth = useMemo(() => {
    return monthTx.filter(t => t.transaction_type === 'investment' || investmentCategoryIds.has(t.category_id)).reduce((s, t) => s + (Number(t.amount) || 0), 0);
  }, [monthTx, investmentCategoryIds]);

  // ALL-TIME CUMULATIVE INVESTMENTS (DYNAMICALLY COMPUTED FROM TRANSACTION LEDGER)
  const totalLifetimeInvestments = useMemo(() => {
    return transactions
      .filter(t => t.transaction_type === 'investment' || investmentCategoryIds.has(t.category_id))
      .reduce((s, t) => s + (Number(t.amount) || 0), 0);
  }, [transactions, investmentCategoryIds]);

  // Dynamic Investment breakdown per category
  const investmentBreakdown = useMemo(() => {
    const map = new Map();

    // Initialize map with all investment categories defined in workspace
    categories.filter(c => c.type === 'investment').forEach(c => {
      map.set(c.id, { id: c.id, name: c.name, color: c.color_code || '#eab308', amount: 0 });
    });

    // Sum up transaction amounts for each category
    transactions.forEach(t => {
      if (t.transaction_type === 'investment' || investmentCategoryIds.has(t.category_id)) {
        const catId = t.category_id || 'other';
        if (map.has(catId)) {
          map.get(catId).amount += Number(t.amount) || 0;
        } else {
          const cat = categories.find(c => c.id === catId);
          map.set(catId, {
            id: catId,
            name: cat?.name || 'Other Investments',
            color: cat?.color_code || '#3b82f6',
            amount: Number(t.amount) || 0
          });
        }
      }
    });

    return Array.from(map.values()).filter(item => item.amount > 0 || categories.some(c => c.id === item.id && c.type === 'investment'));
  }, [categories, transactions, investmentCategoryIds]);

  const netCashflow = incomeThisMonth - expensesThisMonth;
  const savingsRate = incomeThisMonth > 0
    ? Math.round(((savingsThisMonth + investmentsThisMonth + netCashflow) / incomeThisMonth) * 100)
    : 0;

  // Total Net Balance across accounts
  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
  }, [accounts]);

  // 6-Month Income vs Expense Bar Chart Data
  const chartData = useMemo(() => {
    const months = lastNMonths(6, selectedMonth);
    return months.map(mKey => {
      const mTx = transactions.filter(t => t.date && t.date.startsWith(mKey));
      const inc = mTx.filter(t => t.transaction_type === 'income').reduce((s, t) => s + (Number(t.amount) || 0), 0);
      const exp = mTx.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + (Number(t.amount) || 0), 0);
      return {
        month: monthLabel(mKey),
        Income: inc,
        Expense: exp
      };
    });
  }, [transactions, selectedMonth]);

  const catMap = new Map(categories.map(c => [c.id, c.name]));
  const accMap = new Map(accounts.map(a => [a.id, a.name]));

  // Search filtered transactions
  const displayedTx = useMemo(() => {
    if (!searchQuery.trim()) return transactions.slice(0, 5);
    const q = searchQuery.toLowerCase();
    return transactions.filter(t => 
      (t.payee && t.payee.toLowerCase().includes(q)) ||
      (catMap.get(t.category_id) && catMap.get(t.category_id).toLowerCase().includes(q))
    ).slice(0, 10);
  }, [transactions, searchQuery, catMap]);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-3xl font-serif font-bold text-foreground">Dashboard</h1>
          <p className="text-xs text-muted-foreground">Personal Workspace</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Month Selector */}
          <div className="flex items-center gap-2 bg-card border border-border p-1 rounded-xl text-xs font-mono">
            <button
              onClick={() => setSelectedMonth(shiftMonth(selectedMonth, -1))}
              className="p-1 hover:bg-muted rounded-lg text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold px-2 text-foreground">{monthLabel(selectedMonth)}</span>
            <button
              onClick={() => setSelectedMonth(shiftMonth(selectedMonth, 1))}
              className="p-1 hover:bg-muted rounded-lg text-foreground transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Purple Add Transaction Button */}
          <button
            onClick={() => setShowAddTxModal(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* 2. SEARCH BAR */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search transactions by payee or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-indigo-500 focus:outline-none"
        />
      </div>

      {/* 3. TOP 6 KPI CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {/* Total Balance */}
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Total Balance</p>
            <p className="text-2xl font-serif font-bold text-foreground">{formatMoney(totalBalance)}</p>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* Expenses this month */}
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Expenses this month</p>
            <p className="text-2xl font-serif font-bold text-foreground">{formatMoney(expensesThisMonth)}</p>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>

        {/* Income this month */}
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Income this month</p>
            <p className="text-2xl font-serif font-bold text-foreground">{formatMoney(incomeThisMonth)}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        {/* Savings this month */}
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Savings this month</p>
            <p className="text-2xl font-serif font-bold text-foreground">{formatMoney(savingsThisMonth)}</p>
          </div>
          <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400">
            <PiggyBank className="w-5 h-5" />
          </div>
        </div>

        {/* Investments this month */}
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Investments this month</p>
            <p className="text-2xl font-serif font-bold text-foreground">{formatMoney(investmentsThisMonth)}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
            <Landmark className="w-5 h-5" />
          </div>
        </div>

        {/* Savings rate */}
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Savings rate</p>
            <p className="text-2xl font-serif font-bold text-foreground">{savingsRate}%</p>
            <p className="text-[10px] text-muted-foreground font-mono">{formatMoney(savingsThisMonth + investmentsThisMonth)} saved & invested</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/60 text-muted-foreground">
            <Percent className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 4. DAY OVERVIEW SECTION */}
      <DayOverview
        transactions={transactions}
        accounts={accounts}
        categories={categories}
        onOpenAddTx={() => setShowAddTxModal(true)}
      />

      {/* 5. INCOME VS EXPENSES CHART */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
        <h2 className="text-lg font-serif font-bold text-foreground">Income vs Expense — last 6 months</h2>
        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.08} />
              <XAxis dataKey="month" stroke="currentColor" className="text-[10px] text-muted-foreground" />
              <YAxis stroke="currentColor" className="text-[10px] text-muted-foreground font-mono" tickFormatter={(v) => `${v}`} />
              <Tooltip content={<CustomChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="Income" fill="#6b7280" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Expense" fill="#dc2626" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 6. INVESTMENTS CARD (100% DYNAMIC) */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5 shadow-sm">
        <div className="space-y-0.5">
          <h2 className="text-xl font-serif font-bold text-foreground">Investments</h2>
          <p className="text-xs text-muted-foreground italic">Current total value of investment assets (automatically calculated from transaction ledger)</p>
        </div>

        <p className="text-3xl font-serif font-bold text-foreground font-mono">
          {formatMoney(totalLifetimeInvestments)}
        </p>

        {investmentBreakdown.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2 font-sans">No investment transactions recorded yet.</p>
        ) : (
          <div className="space-y-4 pt-1">
            {investmentBreakdown.map(item => {
              const pct = totalLifetimeInvestments > 0
                ? Math.round((item.amount / totalLifetimeInvestments) * 100)
                : 0;

              return (
                <div key={item.id} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-medium">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-foreground font-semibold">{item.name}</span>
                    </div>
                    <span className="font-mono font-semibold text-foreground">
                      {formatMoney(item.amount)}
                    </span>
                  </div>
                  <div className="w-full bg-muted/40 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ backgroundColor: item.color, width: `${Math.min(100, Math.max(pct, item.amount > 0 ? 4 : 0))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 7. SAVINGS GOALS CARD MATCHING DASHBOARD.PNG */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
        <h2 className="text-xl font-serif font-bold text-foreground">Savings goals</h2>

        <div className="bg-muted/20 border border-border/60 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Emergency fund</h3>
            <span className="font-mono text-xs font-bold text-foreground">6%</span>
          </div>

          <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: '6%' }} />
          </div>

          <div className="space-y-0.5 font-mono text-xs text-muted-foreground pt-1">
            <p className="font-semibold text-foreground">₹5,000.00 of ₹90,000.00</p>
            <p className="text-[11px] text-muted-foreground">By 2027-12-31</p>
          </div>
        </div>
      </div>

      {/* 8. RECENT TRANSACTIONS TABLE MATCHING DASHBOARD.PNG */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-serif font-bold text-foreground">Recent transactions</h2>
          <Link to="/transactions" className="text-xs font-semibold text-foreground hover:underline">
            View all
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-border/60 text-muted-foreground font-mono">
                <th className="py-3 px-2">Date</th>
                <th className="py-3 px-2">Account</th>
                <th className="py-3 px-2">Category</th>
                <th className="py-3 px-2">Payee</th>
                <th className="py-3 px-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-mono">
              {displayedTx.map(tx => {
                const isIncome = tx.transaction_type === 'income';
                return (
                  <tr key={tx.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3.5 px-2 font-semibold text-foreground whitespace-nowrap">{tx.date}</td>
                    <td className="py-3.5 px-2 text-foreground font-sans font-medium">{accMap.get(tx.account_id) || 'Thiru'}</td>
                    <td className="py-3.5 px-2 text-foreground font-sans font-medium">{catMap.get(tx.category_id) || 'Uncategorized'}</td>
                    <td className="py-3.5 px-2 text-muted-foreground font-sans font-normal">{tx.payee || 'Transaction'}</td>
                    <td className={`py-3.5 px-2 text-right font-bold whitespace-nowrap ${
                      isIncome ? 'text-emerald-500' : 'text-rose-600'
                    }`}>
                      {isIncome ? `+${formatMoney(tx.amount)}` : `-${formatMoney(tx.amount)}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD TRANSACTION MODAL */}
      {showAddTxModal && (
        <TransactionFormDialog
          onClose={() => setShowAddTxModal(false)}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}

export default Dashboard;
