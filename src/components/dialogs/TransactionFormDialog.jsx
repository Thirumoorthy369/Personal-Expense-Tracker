import React, { useState, useEffect } from 'react';
import { useWorkspaceData } from '../../hooks/useWorkspaceData';
import { storageApi } from '../../lib/storage';
import { todayISO } from '../../lib/finance';
import { CategoryDialog } from './CategoryDialog';
import { CustomSelect } from '../ui/CustomSelect';
import {
  X,
  Plus,
  Sparkles,
  Upload,
  Tag,
  FolderPlus,
  ArrowDownRight,
  ArrowUpRight,
  PiggyBank,
  Landmark,
  ArrowRightLeft,
  Calendar,
  User,
  FileText,
  Globe,
  CheckCircle2
} from 'lucide-react';

export function TransactionFormDialog({ initialData = null, onClose, onSuccess }) {
  const { accounts, categories, templates, refetch } = useWorkspaceData();

  const [transactionType, setTransactionType] = useState(initialData?.transaction_type || 'expense');
  const [accountId, setAccountId] = useState(initialData?.account_id || accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(initialData?.to_account_id || accounts[1]?.id || accounts[0]?.id || '');
  const [categoryId, setCategoryId] = useState(initialData?.category_id || categories[0]?.id || '');
  const [amount, setAmount] = useState(initialData?.amount || '');
  const [date, setDate] = useState(initialData?.date || todayISO());
  const [payee, setPayee] = useState(initialData?.payee || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [receiptUrl, setReceiptUrl] = useState(initialData?.receipt_file_url || '');
  const [tagsInput, setTagsInput] = useState(initialData?.tags ? initialData.tags.join(', ') : '');

  // Foreign currency state
  const [isForeign, setIsForeign] = useState(Boolean(initialData?.original_currency));
  const [originalCurrency, setOriginalCurrency] = useState(initialData?.original_currency || 'USD');
  const [originalAmount, setOriginalAmount] = useState(initialData?.original_amount || '');
  const [exchangeRate, setExchangeRate] = useState(initialData?.exchange_rate || '83.50');

  const [showInlineCategory, setShowInlineCategory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setReceiptUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (isForeign && originalAmount && exchangeRate) {
      const computed = (Number(originalAmount) || 0) * (Number(exchangeRate) || 1);
      setAmount(computed.toFixed(2));
    }
  }, [isForeign, originalAmount, exchangeRate]);

  const handleApplyTemplate = (tmplId) => {
    const tmpl = templates.find(t => t.id === tmplId);
    if (!tmpl) return;
    setTransactionType(tmpl.transaction_type || 'expense');
    if (tmpl.account_id) setAccountId(tmpl.account_id);
    if (tmpl.to_account_id) setToAccountId(tmpl.to_account_id);
    if (tmpl.category_id) setCategoryId(tmpl.category_id);
    if (tmpl.amount) setAmount(tmpl.amount);
    if (tmpl.payee) setPayee(tmpl.payee);
    if (tmpl.notes) setNotes(tmpl.notes);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accountId) return setError('Please select an account');
    if (!amount || Number(amount) <= 0) return setError('Please enter a valid positive amount');
    if (transactionType === 'transfer' && accountId === toAccountId) {
      return setError('Source and destination accounts must be different');
    }

    setSaving(true);
    setError(null);

    try {
      const parsedTags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)
        .map(t => (t.startsWith('#') ? t : `#${t}`));

      const txPayload = {
        ...initialData,
        workspace_id: accounts.find(a => a.id === accountId)?.workspace_id,
        account_id: accountId,
        to_account_id: (transactionType === 'transfer' || transactionType === 'savings') ? toAccountId : null,
        category_id: categoryId,
        amount: Number(amount),
        original_amount: isForeign ? Number(originalAmount) : null,
        original_currency: isForeign ? originalCurrency : null,
        exchange_rate: isForeign ? Number(exchangeRate) : 1,
        transaction_type: transactionType,
        status: 'completed',
        date,
        payee,
        notes,
        receipt_file_url: receiptUrl,
        tags: parsedTags
      };

      await storageApi.saveTransaction(txPayload);
      await refetch();
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save transaction');
    } finally {
      setSaving(false);
    }
  };

  const typeConfig = [
    { value: 'expense', label: 'Expense', icon: ArrowDownRight, activeBg: 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' },
    { value: 'income', label: 'Income', icon: ArrowUpRight, activeBg: 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' },
    { value: 'savings', label: 'Savings', icon: PiggyBank, activeBg: 'bg-sky-600 text-white shadow-lg shadow-sky-600/30' },
    { value: 'investment', label: 'Investment', icon: Landmark, activeBg: 'bg-amber-600 text-white shadow-lg shadow-amber-600/30' },
    { value: 'transfer', label: 'Transfer', icon: ArrowRightLeft, activeBg: 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' }
  ];

  const templateOptions = templates.map(t => ({
    value: t.id,
    label: `${t.name} (${t.transaction_type})`
  }));

  const accountOptions = accounts.map(a => ({
    value: a.id,
    label: `${a.name} (₹${(Number(a.balance) || 0).toLocaleString('en-IN')})`
  }));

  const categoryOptions = categories.map(c => ({
    value: c.id,
    label: c.name,
    type: c.type,
    color: c.color
  }));

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200 cursor-pointer"
    >
      <div className="bg-[#121318] border border-white/10 rounded-3xl w-full max-w-xl shadow-[0_0_50px_rgba(79,70,229,0.15)] overflow-hidden max-h-[94vh] flex flex-col transition-all transform animate-in zoom-in-95 duration-200">
        {/* TOP MULTI-COLOR ACCENT LINE */}
        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-rose-500 shrink-0" />

        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-card/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-foreground tracking-tight">
                {initialData ? 'Edit Transaction Record' : 'Record Transaction'}
              </h2>
              <p className="text-xs text-muted-foreground">Double-entry real-time accounting record</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL FORM BODY */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs custom-scrollbar">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>{error}</span>
            </div>
          )}

          {/* TEMPLATE QUICK SELECTOR */}
          {templates.length > 0 && !initialData && (
            <div className="flex items-center gap-2.5 p-3 bg-card border border-white/10 rounded-2xl">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="w-full">
                <CustomSelect
                  options={templateOptions}
                  value=""
                  onChange={handleApplyTemplate}
                  placeholder="Apply Saved Preset Template..."
                />
              </div>
            </div>
          )}

          {/* TRANSACTION TYPE SEGMENTED TABS */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
              Transaction Type
            </label>
            <div className="grid grid-cols-5 gap-1.5 p-1.5 bg-card border border-white/10 rounded-2xl">
              {typeConfig.map(t => {
                const Icon = t.icon;
                const isActive = transactionType === t.value;
                return (
                  <button
                    type="button"
                    key={t.value}
                    onClick={() => setTransactionType(t.value)}
                    className={`py-2 px-1 rounded-xl text-center font-medium text-[11px] transition-all duration-200 flex flex-col items-center gap-1 ${
                      isActive ? t.activeBg : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* HERO AMOUNT INPUT WITH INR SYMBOL */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
              Amount
            </label>
            <div className="relative flex items-center bg-card border border-white/10 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/15 rounded-2xl px-4 py-3 transition-all">
              <span className="text-2xl font-serif font-bold text-indigo-400 mr-2">₹</span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onWheel={(e) => e.target.blur()}
                disabled={isForeign}
                className="w-full text-2xl font-mono font-bold bg-transparent text-foreground placeholder:text-muted-foreground/30 focus:outline-none"
                required
                autoFocus
              />
            </div>
          </div>

          {/* ACCOUNTS SELECTION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {transactionType === 'transfer' ? 'From Source Account' : 'Account'}
              </label>
              <CustomSelect
                options={accountOptions}
                value={accountId}
                onChange={(val) => setAccountId(val)}
                placeholder="Select Account..."
                searchable
              />
            </div>

            {(transactionType === 'transfer' || transactionType === 'savings') && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">To Destination Account</label>
                <CustomSelect
                  options={accountOptions}
                  value={toAccountId}
                  onChange={(val) => setToAccountId(val)}
                  placeholder="Select Destination Account..."
                  searchable
                />
              </div>
            )}

            {/* CATEGORY SELECTOR WITH + NEW CATEGORY BUTTON */}
            {transactionType !== 'transfer' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">Category</label>
                  <button
                    type="button"
                    onClick={() => setShowInlineCategory(true)}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>+ New Category</span>
                  </button>
                </div>
                <CustomSelect
                  options={categoryOptions}
                  value={categoryId}
                  onChange={(val) => setCategoryId(val)}
                  placeholder="Select Category..."
                  searchable
                />
              </div>
            )}
          </div>

          {/* DATE & PAYEE ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Date</span>
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                className="w-full p-3 bg-card border border-white/10 rounded-2xl text-foreground font-mono cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Payee / Entity</span>
                <User className="w-3.5 h-3.5 text-muted-foreground" />
              </label>
              <input
                type="text"
                placeholder="Merchant, Amma, Bakery..."
                value={payee}
                onChange={(e) => setPayee(e.target.value)}
                className="w-full p-3 bg-card border border-white/10 rounded-2xl text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-medium"
              />
            </div>
          </div>

          {/* FOREIGN CURRENCY EXPANDABLE TOGGLE */}
          <div className="p-4 bg-card/60 border border-white/10 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Globe className="w-4 h-4 text-indigo-400" />
                <span>Foreign Currency Transaction</span>
              </div>
              <input
                type="checkbox"
                checked={isForeign}
                onChange={(e) => setIsForeign(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-500/30 cursor-pointer accent-indigo-600"
              />
            </div>

            {isForeign && (
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/10">
                <div>
                  <label className="text-[10px] font-mono text-muted-foreground">Currency</label>
                  <input
                    type="text"
                    value={originalCurrency}
                    onChange={(e) => setOriginalCurrency(e.target.value.toUpperCase())}
                    placeholder="USD"
                    className="w-full p-2.5 bg-background border border-white/10 rounded-xl text-foreground font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-muted-foreground">Foreign Amt</label>
                  <input
                    type="number"
                    step="0.01"
                    value={originalAmount}
                    onChange={(e) => setOriginalAmount(e.target.value)}
                    placeholder="100.00"
                    className="w-full p-2.5 bg-background border border-white/10 rounded-xl text-foreground font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-muted-foreground">Rate (to INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(e.target.value)}
                    placeholder="83.50"
                    className="w-full p-2.5 bg-background border border-white/10 rounded-xl text-foreground font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* TAGS & NOTES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-400" />
                <span>Tags</span>
              </label>
              <input
                type="text"
                placeholder="#food, #family, #loan"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full p-3 bg-card border border-white/10 rounded-2xl text-foreground font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>Notes</span>
              </label>
              <input
                type="text"
                placeholder="Optional notes or memos..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 bg-card border border-white/10 rounded-2xl text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-medium"
              />
            </div>
          </div>

          {/* RECEIPT ATTACHMENT */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-indigo-400" />
                <span>Receipt / Invoice Attachment</span>
              </span>
              {receiptUrl && (
                <button
                  type="button"
                  onClick={() => setReceiptUrl('')}
                  className="text-[10px] text-rose-400 hover:underline"
                >
                  Remove Attachment
                </button>
              )}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="w-full text-xs text-muted-foreground file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20 cursor-pointer bg-card border border-white/10 rounded-2xl p-1.5"
              />
            </div>
            {receiptUrl && (
              <div className="mt-2 p-2 bg-card border border-white/10 rounded-xl flex items-center gap-3">
                {receiptUrl.startsWith('data:image/') ? (
                  <img src={receiptUrl} alt="Receipt preview" className="w-12 h-12 object-cover rounded-lg border border-white/10" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                    PDF
                  </div>
                )}
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Attachment ready
                </span>
              </div>
            )}
          </div>

          {/* FOOTER BUTTONS */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-2xl border border-white/10 hover:bg-white/5 text-foreground font-medium text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{initialData ? 'Update Record' : 'Post Transaction'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {showInlineCategory && (
        <CategoryDialog
          onClose={() => setShowInlineCategory(false)}
          onSuccess={() => {
            refetch();
            setShowInlineCategory(false);
          }}
        />
      )}
    </div>
  );
}

export default TransactionFormDialog;
