import React, { useState } from 'react';
import { useWorkspaceData } from '../hooks/useWorkspaceData';
import { useWorkspace } from '../context/WorkspaceContext';
import { storageApi } from '../lib/storage';
import { formatMoney, todayISO, TRANSACTION_TYPES } from '../lib/finance';
import { CategoryDialog } from '../components/dialogs/CategoryDialog';
import { CustomSelect } from '../components/ui/CustomSelect';
import {
  Zap,
  Plus,
  Search,
  Edit2,
  Trash2,
  Repeat,
  Bot,
  ArrowRight,
  ArrowLeft,
  SkipForward,
  CheckCircle2,
  FolderPlus,
  Play,
  Layers,
  X
} from 'lucide-react';

export function Automations() {
  const { activeWorkspace, isWorkspaceAdmin } = useWorkspace();
  const { accounts, categories, transactions, recurringRules, refetch } = useWorkspaceData();

  // Active Selected Action: null | 'create' | 'view' | 'edit' | 'delete' | 'recurring'
  const [activeAction, setActiveAction] = useState(null);

  // Wizard state
  const [wizardStep, setWizardStep] = useState(1);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState(null);

  // Form State for Actions
  const [txType, setTxType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || '');
  const [date, setDate] = useState(todayISO());
  const [payee, setPayee] = useState('');
  const [notes, setNotes] = useState('');
  const [frequency, setFrequency] = useState('monthly');

  // Search & Edit Selection state
  const [selectedTxId, setSelectedTxId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const catMap = new Map(categories.map(c => [c.id, c.name]));
  const accMap = new Map(accounts.map(a => [a.id, a.name]));

  const handleSelectAction = (actionKey) => {
    setActiveAction(actionKey);
    setWizardStep(1);
    setActionSuccessMsg(null);
    setSelectedTxId('');
    setAmount('');
    setPayee('');
    setNotes('');
  };

  // CREATE TRANSACTION SUBMIT
  const handleExecuteCreate = async () => {
    if (!amount || Number(amount) <= 0) return alert('Please enter a valid amount');
    try {
      const txPayload = {
        workspace_id: activeWorkspace.id,
        account_id: accountId || accounts[0]?.id,
        to_account_id: (txType === 'transfer' || txType === 'savings') ? toAccountId : null,
        category_id: categoryId || categories[0]?.id,
        amount: Number(amount),
        transaction_type: txType,
        status: 'completed',
        date: date || todayISO(),
        payee: payee || 'Automated Ledger Entry',
        notes: notes || 'Created via Guided Automations',
        tags: ['#automated']
      };

      await storageApi.saveTransaction(txPayload);
      await refetch();
      setActionSuccessMsg(`Success! Posted ₹${amount} (${txType}) to your ledger and reconciled account balance.`);
      setWizardStep(1);
      setAmount('');
      setPayee('');
    } catch (err) {
      alert('Error creating transaction: ' + err.message);
    }
  };

  // RECURRING RULE SUBMIT
  const handleExecuteRecurring = async () => {
    if (!amount || Number(amount) <= 0) return alert('Please enter a valid amount');
    try {
      const rulePayload = {
        workspace_id: activeWorkspace.id,
        account_id: accountId || accounts[0]?.id,
        category_id: categoryId || categories[0]?.id,
        amount: Number(amount),
        transaction_type: txType === 'income' ? 'income' : 'expense',
        payee: payee || 'Recurring Payment',
        frequency,
        next_run_date: date || todayISO(),
        is_active: true
      };

      await storageApi.saveEntity('recurring_rules', rulePayload);
      await refetch();
      setActionSuccessMsg(`Success! Scheduled ${frequency} recurring rule for ₹${amount}.`);
      setWizardStep(1);
    } catch (err) {
      alert('Error saving recurring rule: ' + err.message);
    }
  };

  // DELETE TRANSACTION SUBMIT
  const handleExecuteDelete = async (id) => {
    if (!id) return;
    if (!window.confirm('Delete this transaction and reconcile account balance?')) return;
    await storageApi.deleteTransaction(id);
    await refetch();
    setActionSuccessMsg('Transaction deleted and account balance reconciled.');
    setSelectedTxId('');
  };

  // EXECUTE RECURRING RULE NOW
  const handleExecuteRuleNow = async (rule) => {
    try {
      const tx = {
        workspace_id: rule.workspace_id,
        account_id: rule.account_id,
        category_id: rule.category_id,
        amount: Number(rule.amount),
        transaction_type: rule.transaction_type || 'expense',
        status: 'completed',
        date: todayISO(),
        payee: rule.payee || 'Recurring Auto Post',
        notes: `Executed from recurring rule (${rule.frequency})`,
        tags: ['#recurring']
      };
      await storageApi.saveTransaction(tx);

      const currentNext = new Date(rule.next_run_date + 'T00:00:00');
      if (rule.frequency === 'daily') currentNext.setDate(currentNext.getDate() + 1);
      else if (rule.frequency === 'weekly') currentNext.setDate(currentNext.getDate() + 7);
      else if (rule.frequency === 'monthly') currentNext.setMonth(currentNext.getMonth() + 1);

      const year = currentNext.getFullYear();
      const month = String(currentNext.getMonth() + 1).padStart(2, '0');
      const day = String(currentNext.getDate()).padStart(2, '0');

      await storageApi.saveEntity('recurring_rules', {
        ...rule,
        next_run_date: `${year}-${month}-${day}`
      });

      await refetch();
      setActionSuccessMsg(`Executed rule! Posted transaction and advanced date.`);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const filteredViewTx = transactions.filter(t => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (t.payee && t.payee.toLowerCase().includes(q)) ||
           (t.notes && t.notes.toLowerCase().includes(q)) ||
           (t.amount && t.amount.toString().includes(q));
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. HEADER BANNER MATCHING SCREENSHOT */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-indigo-500 fill-indigo-500" />
          <h1 className="text-3xl font-heading font-bold text-foreground">Automations</h1>
        </div>
        <p className="text-sm font-body text-muted-foreground">
          A guided, rule-based workflow — no AI, just deterministic steps.
        </p>
      </div>

      {actionSuccessMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* 2. TOP ACTION CARDS ROW (5 TILES MATCHING SCREENSHOT EXACTLY) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* CARD 1: CREATE TRANSACTION */}
        <button
          onClick={() => handleSelectAction('create')}
          className={`p-4 rounded-2xl border-2 text-left space-y-3 transition-all ${
            activeAction === 'create'
              ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500'
              : 'border-border/80 bg-card hover:border-border hover:bg-muted/30'
          }`}
        >
          <Plus className="w-6 h-6 text-indigo-500" />
          <p className="font-heading font-semibold text-sm text-foreground leading-tight">Create Transaction</p>
        </button>

        {/* CARD 2: VIEW TRANSACTIONS */}
        <button
          onClick={() => handleSelectAction('view')}
          className={`p-4 rounded-2xl border-2 text-left space-y-3 transition-all ${
            activeAction === 'view'
              ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500'
              : 'border-border/80 bg-card hover:border-border hover:bg-muted/30'
          }`}
        >
          <Search className="w-6 h-6 text-indigo-500" />
          <p className="font-heading font-semibold text-sm text-foreground leading-tight">View Transactions</p>
        </button>

        {/* CARD 3: EDIT TRANSACTION */}
        <button
          onClick={() => handleSelectAction('edit')}
          className={`p-4 rounded-2xl border-2 text-left space-y-3 transition-all ${
            activeAction === 'edit'
              ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500'
              : 'border-border/80 bg-card hover:border-border hover:bg-muted/30'
          }`}
        >
          <Edit2 className="w-6 h-6 text-indigo-500" />
          <p className="font-heading font-semibold text-sm text-foreground leading-tight">Edit Transaction</p>
        </button>

        {/* CARD 4: DELETE TRANSACTION */}
        <button
          onClick={() => handleSelectAction('delete')}
          className={`p-4 rounded-2xl border-2 text-left space-y-3 transition-all ${
            activeAction === 'delete'
              ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500'
              : 'border-border/80 bg-card hover:border-border hover:bg-muted/30'
          }`}
        >
          <Trash2 className="w-6 h-6 text-indigo-500" />
          <p className="font-heading font-semibold text-sm text-foreground leading-tight">Delete Transaction</p>
        </button>

        {/* CARD 5: RECURRING */}
        <button
          onClick={() => handleSelectAction('recurring')}
          className={`p-4 rounded-2xl border-2 text-left space-y-3 transition-all ${
            activeAction === 'recurring'
              ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500'
              : 'border-border/80 bg-card hover:border-border hover:bg-muted/30'
          }`}
        >
          <Repeat className="w-6 h-6 text-indigo-500" />
          <p className="font-heading font-semibold text-sm text-foreground leading-tight">Recurring</p>
        </button>
      </div>

      {/* 3. MAIN GUIDED ASSISTANT PANEL */}
      <div className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-sm">
        {/* STATE A: NO ACTION SELECTED YET (MATCHES REFERENCE IMAGE BOT CARD) */}
        {!activeAction && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="p-3 bg-muted/40 rounded-2xl border border-border/60">
              <Bot className="w-10 h-10 text-muted-foreground" />
            </div>
            <p className="text-sm font-body text-muted-foreground max-w-md">
              Pick an action above to start. I'll guide you through it step by step.
            </p>
          </div>
        )}

        {/* STATE B: + CREATE TRANSACTION STEP WIZARD */}
        {activeAction === 'create' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-heading font-semibold text-foreground flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-500" />
                <span>Guided Transaction Creator — Step {wizardStep} of 4</span>
              </h2>
              <button onClick={() => setActiveAction(null)} className="text-xs text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* STEP 1: TYPE & AMOUNT */}
            {wizardStep === 1 && (
              <div className="space-y-4 text-xs">
                <p className="font-medium text-foreground">Step 1: Choose Transaction Type & Enter Amount</p>

                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {TRANSACTION_TYPES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setTxType(t.value)}
                      className={`py-2 px-2 rounded-xl text-center capitalize border font-semibold ${
                        txType === t.value
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                          : 'bg-muted/40 hover:bg-muted text-muted-foreground border-border'
                      }`}
                    >
                      {t.value}
                    </button>
                  ))}
                </div>

                <div className="space-y-1 pt-2">
                  <label className="font-semibold text-foreground">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 5000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    onWheel={(e) => e.target.blur()}
                    className="w-full p-3 bg-background border border-border rounded-xl font-mono text-base text-foreground font-semibold"
                    required
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl flex items-center gap-1.5 hover:opacity-90 shadow-md"
                  >
                    <span>Next Step</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: CATEGORY (WITH + NEW CATEGORY BUTTON) */}
            {wizardStep === 2 && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-foreground">Step 2: Select Expense/Income Category</p>
                  <button
                    onClick={() => setShowCategoryModal(true)}
                    className="text-xs text-indigo-500 hover:underline font-semibold flex items-center gap-1"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>+ New Category</span>
                  </button>
                </div>

                <CustomSelect
                  options={categories.map(c => ({ value: c.id, label: c.name, type: c.type, color: c.color }))}
                  value={categoryId}
                  onChange={setCategoryId}
                  placeholder="Select Category..."
                  searchable
                />

                <div className="pt-4 flex items-center justify-between">
                  <button onClick={() => setWizardStep(1)} className="px-4 py-2 border rounded-xl hover:bg-muted text-foreground flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    onClick={() => setWizardStep(3)}
                    className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl flex items-center gap-1.5 hover:opacity-90 shadow-md"
                  >
                    <span>Next Step</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: ACCOUNTS (WITH NEXT AND SKIP BUTTONS) */}
            {wizardStep === 3 && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-foreground">Step 3: Assign Bank / Cash Account</p>
                  <span className="text-muted-foreground italic">(Optional - click Skip if default)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Source Account</label>
                    <CustomSelect
                      options={accounts.map(a => ({ value: a.id, label: `${a.name} (₹${a.balance})` }))}
                      value={accountId}
                      onChange={setAccountId}
                      placeholder="Select Source Account..."
                      searchable
                    />
                  </div>

                  {(txType === 'transfer' || txType === 'savings') && (
                    <div className="space-y-1">
                      <label className="font-semibold text-foreground">Destination Account</label>
                      <CustomSelect
                        options={accounts.map(a => ({ value: a.id, label: `${a.name} (₹${a.balance})` }))}
                        value={toAccountId}
                        onChange={setToAccountId}
                        placeholder="Select Destination Account..."
                        searchable
                      />
                    </div>
                  )}
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button onClick={() => setWizardStep(2)} className="px-4 py-2 border rounded-xl hover:bg-muted text-foreground flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setWizardStep(4)} className="px-4 py-2 border border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl flex items-center gap-1">
                      <SkipForward className="w-3.5 h-3.5" /> Skip
                    </button>
                    <button onClick={() => setWizardStep(4)} className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl flex items-center gap-1.5">
                      <span>Next Step</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: PAYEE & EXECUTE */}
            {wizardStep === 4 && (
              <div className="space-y-4 text-xs">
                <p className="font-semibold text-foreground">Step 4: Payee & Notes (Optional)</p>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Payee / Merchant Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Acme Supermarket, Client Payment"
                      value={payee}
                      onChange={(e) => setPayee(e.target.value)}
                      className="w-full p-2.5 bg-background border border-border rounded-xl text-foreground"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full p-2.5 bg-background border border-border rounded-xl font-mono text-foreground"
                    />
                  </div>
                </div>

                <div className="p-4 bg-muted/30 border border-border rounded-2xl space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Summary:</span>
                    <span className="font-bold text-indigo-500 capitalize">{txType} • ₹{amount || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <span>{catMap.get(categoryId) || 'Category'}</span>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button onClick={() => setWizardStep(3)} className="px-4 py-2 border rounded-xl hover:bg-muted text-foreground flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    onClick={handleExecuteCreate}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl flex items-center gap-2 shadow-md hover:opacity-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Post Transaction to Ledger</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STATE C: 🔍 VIEW TRANSACTIONS */}
        {activeAction === 'view' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-heading font-semibold text-foreground flex items-center gap-2">
                <Search className="w-5 h-5 text-indigo-500" />
                <span>View & Filter Ledger Transactions</span>
              </h2>
              <button onClick={() => setActiveAction(null)} className="text-xs text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              placeholder="Search payee, amount, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 bg-background border border-border rounded-xl text-foreground text-xs"
            />

            <div className="divide-y divide-border/40 max-h-72 overflow-y-auto border border-border rounded-xl p-2 bg-background">
              {filteredViewTx.slice(0, 10).map(t => (
                <div key={t.id} className="py-2.5 px-2 flex justify-between items-center hover:bg-muted/20">
                  <div>
                    <p className="font-semibold text-foreground">{t.payee || 'Ledger Item'}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{t.date} • {catMap.get(t.category_id)}</p>
                  </div>
                  <p className={`font-mono font-bold ${
                    t.transaction_type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                  }`}>
                    {t.transaction_type === 'income' ? '+' : '-'}{formatMoney(t.amount)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STATE D: ✏️ EDIT TRANSACTION */}
        {activeAction === 'edit' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-heading font-semibold text-foreground flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-500" />
                <span>Edit Existing Transaction</span>
              </h2>
              <button onClick={() => setActiveAction(null)} className="text-xs text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <label className="font-semibold text-foreground">Select Transaction to Edit</label>
            <CustomSelect
              options={transactions.slice(0, 15).map(t => ({ value: t.id, label: `${t.date} — ${t.payee || 'Item'} (₹${t.amount})` }))}
              value={selectedTxId}
              onChange={(val) => {
                const selected = transactions.find(t => t.id === val);
                if (selected) {
                  setSelectedTxId(selected.id);
                  setAmount(selected.amount);
                  setPayee(selected.payee || '');
                }
              }}
              placeholder="Choose item from ledger..."
              searchable
            />

            {selectedTxId && (
              <div className="space-y-3 pt-2">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onWheel={(e) => e.target.blur()}
                  placeholder="Amount (₹)"
                  className="w-full p-2.5 bg-background border border-border rounded-xl text-foreground font-mono"
                />
                <input
                  type="text"
                  value={payee}
                  onChange={(e) => setPayee(e.target.value)}
                  placeholder="Payee"
                  className="w-full p-2.5 bg-background border border-border rounded-xl text-foreground"
                />
                <button
                  onClick={async () => {
                    const target = transactions.find(t => t.id === selectedTxId);
                    if (target) {
                      await storageApi.saveTransaction({ ...target, amount: Number(amount), payee });
                      await refetch();
                      setActionSuccessMsg('Transaction updated!');
                      setSelectedTxId('');
                    }
                  }}
                  className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>
        )}

        {/* STATE E: 🗑️ DELETE TRANSACTION */}
        {activeAction === 'delete' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-heading font-semibold text-foreground flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-500" />
                <span>Delete Transaction & Reconcile Balances</span>
              </h2>
              <button onClick={() => setActiveAction(null)} className="text-xs text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-border/40 max-h-72 overflow-y-auto border border-border rounded-xl p-2 bg-background">
              {transactions.slice(0, 10).map(t => (
                <div key={t.id} className="py-2.5 px-2 flex justify-between items-center hover:bg-muted/20">
                  <div>
                    <p className="font-semibold text-foreground">{t.payee || 'Ledger Item'}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{t.date} • ₹{t.amount}</p>
                  </div>
                  <button
                    onClick={() => handleExecuteDelete(t.id)}
                    className="px-3 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 font-bold rounded-lg text-xs"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STATE F: 🔁 RECURRING AUTO-DEBITS */}
        {activeAction === 'recurring' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-heading font-semibold text-foreground flex items-center gap-2">
                <Repeat className="w-5 h-5 text-indigo-500" />
                <span>Scheduled Auto-Debit Rules & Subscriptions</span>
              </h2>
              <button onClick={() => setActiveAction(null)} className="text-xs text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Rule Title (e.g. Netflix, Rent)"
                value={payee}
                onChange={(e) => setPayee(e.target.value)}
                className="p-2.5 bg-background border border-border rounded-xl text-foreground"
              />
              <input
                type="number"
                placeholder="Amount (₹)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onWheel={(e) => e.target.blur()}
                className="p-2.5 bg-background border border-border rounded-xl font-mono text-foreground"
              />
              <CustomSelect
                options={[
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'monthly', label: 'Monthly' }
                ]}
                value={frequency}
                onChange={setFrequency}
              />
              <button
                onClick={handleExecuteRecurring}
                className="p-2.5 bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Auto-Debit Rule</span>
              </button>
            </div>

            {/* RECURRING RULES LIST WITH EXECUTE NOW */}
            <div className="space-y-2 pt-3 border-t border-border">
              <h3 className="font-semibold text-foreground">Active Recurring Auto-Debits ({recurringRules.length})</h3>
              <div className="space-y-2">
                {recurringRules.map(rule => (
                  <div key={rule.id} className="p-3 bg-muted/30 border border-border rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{rule.payee || 'Recurring Item'}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">{rule.frequency} • ₹{rule.amount} • Next: {rule.next_run_date}</p>
                    </div>
                    <button
                      onClick={() => handleExecuteRuleNow(rule)}
                      className="px-3 py-1.5 bg-indigo-600 text-white font-bold rounded-lg flex items-center gap-1 hover:opacity-90"
                    >
                      <Play className="w-3 h-3" />
                      <span>Execute Now</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {showCategoryModal && (
        <CategoryDialog
          onClose={() => setShowCategoryModal(false)}
          onSuccess={() => {
            refetch();
            setShowCategoryModal(false);
          }}
        />
      )}
    </div>
  );
}
