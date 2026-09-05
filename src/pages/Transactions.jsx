import React, { useState, useEffect, useCallback } from 'react';
import { useWorkspaceData } from '../hooks/useWorkspaceData';
import { useWorkspace } from '../context/WorkspaceContext';
import { fetchPaginatedTransactions } from '../lib/transactionLoader';
import { exportAllTransactionsCSV } from '../lib/exportAllTransactions';
import { storageApi } from '../lib/storage';
import { formatMoney, TRANSACTION_TYPES } from '../lib/finance';
import { TransactionFormDialog } from '../components/dialogs/TransactionFormDialog';
import { ImportTransactionsDialog } from '../components/dialogs/ImportTransactionsDialog';
import { CustomSelect } from '../components/ui/CustomSelect';
import {
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  CheckSquare,
  Square,
  Paperclip,
  Tag,
  ArrowUpDown,
  FileSpreadsheet,
  RefreshCw,
  X
} from 'lucide-react';

export function Transactions() {
  const { activeWorkspace, isWorkspaceAdmin } = useWorkspace();
  const { accounts, categories, refetch: refetchWorkspace } = useWorkspaceData();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterAccount, setFilterAccount] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  const [ledgerResult, setLedgerResult] = useState({ data: [], totalCount: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const loadData = useCallback(async () => {
    if (!activeWorkspace?.id) return;
    setLoading(true);
    const res = await fetchPaginatedTransactions({
      workspaceId: activeWorkspace.id,
      page,
      pageSize,
      search,
      type: filterType,
      accountId: filterAccount,
      categoryId: filterCategory,
      startDate: fromDate || null,
      endDate: toDate || null,
      sortBy,
      sortOrder
    });
    setLedgerResult(res);
    setLoading(false);
  }, [activeWorkspace?.id, page, pageSize, search, filterType, filterAccount, filterCategory, fromDate, toDate, sortBy, sortOrder]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const catMap = new Map(categories.map(c => [c.id, c.name]));
  const accMap = new Map(accounts.map(a => [a.id, a.name]));

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(ledgerResult.data.map(t => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDeleteTx = async (id) => {
    if (!window.confirm('Delete this transaction? Account balances will be automatically reconciled.')) return;
    await storageApi.deleteTransaction(id);
    await refetchWorkspace();
    await loadData();
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected transactions?`)) return;

    for (const id of selectedIds) {
      await storageApi.deleteTransaction(id);
    }
    setSelectedIds([]);
    await refetchWorkspace();
    await loadData();
  };

  const clearFilters = () => {
    setSearch('');
    setFilterType('all');
    setFilterAccount('all');
    setFilterCategory('all');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* HEADER MATCHING SCREENSHOT #2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-heading font-bold text-foreground">Transactions</h1>
          <p className="text-xs text-muted-foreground font-mono">Page {ledgerResult.page}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportAllTransactionsCSV(activeWorkspace.id)}
            className="px-3.5 py-2 border border-border hover:bg-muted rounded-xl text-xs flex items-center gap-1.5 font-medium text-foreground transition-colors bg-background"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export all history</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="px-3.5 py-2 border border-border hover:bg-muted rounded-xl text-xs flex items-center gap-1.5 font-medium text-foreground transition-colors bg-background"
          >
            <Upload className="w-3.5 h-3.5 text-primary" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={() => exportAllTransactionsCSV(activeWorkspace.id)}
            className="px-3.5 py-2 border border-border hover:bg-muted rounded-xl text-xs flex items-center gap-1.5 font-medium text-foreground transition-colors bg-background"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Export page</span>
          </button>

          <button
            onClick={() => { setEditingTx(null); setShowAddModal(true); }}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH BAR MATCHING SCREENSHOT #2 */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Input */}
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium">Search</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Payee or notes"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-8 pr-3 py-2 bg-background border border-border rounded-xl text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Account Filter */}
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium">Account</label>
            <CustomSelect
              options={[{ value: 'all', label: 'All accounts' }, ...accounts.map(a => ({ value: a.id, label: a.name }))]}
              value={filterAccount}
              onChange={(val) => { setFilterAccount(val); setPage(1); }}
              searchable
            />
          </div>

          {/* Category Filter */}
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium">Category</label>
            <CustomSelect
              options={[{ value: 'all', label: 'All categories' }, ...categories.map(c => ({ value: c.id, label: c.name, type: c.type, color: c.color }))]}
              value={filterCategory}
              onChange={(val) => { setFilterCategory(val); setPage(1); }}
              searchable
            />
          </div>

          {/* Type Filter */}
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium">Type</label>
            <CustomSelect
              options={[{ value: 'all', label: 'All types' }, ...TRANSACTION_TYPES.map(t => ({ value: t.value, label: t.label, type: t.value }))] }
              value={filterType}
              onChange={(val) => { setFilterType(val); setPage(1); }}
            />
          </div>
        </div>

        {/* Row 2: Date Filters & Clear */}
        <div className="flex flex-wrap items-end gap-4 pt-1">
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
              className="p-2 bg-background border border-border rounded-xl text-foreground font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(1); }}
              className="p-2 bg-background border border-border rounded-xl text-foreground font-mono"
            />
          </div>

          <button
            onClick={clearFilters}
            className="px-3 py-2 border border-border hover:bg-muted rounded-xl text-xs flex items-center gap-1.5 font-medium text-foreground transition-colors"
          >
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Clear</span>
          </button>
        </div>

        {/* BULK ACTION BAR */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between p-2.5 bg-primary/10 border border-primary/20 rounded-xl text-xs mt-2">
            <span className="font-semibold text-primary">{selectedIds.length} Items Selected</span>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1 bg-destructive text-destructive-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              Bulk Delete
            </button>
          </div>
        )}
      </div>

      {/* TRANSACTION TABLE */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-muted/40 border-b border-border text-muted-foreground font-mono">
                <th className="py-3 px-3 w-8">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={ledgerResult.data.length > 0 && selectedIds.length === ledgerResult.data.length}
                    className="rounded text-primary focus:ring-primary"
                  />
                </th>
                <th className="py-3 px-3 cursor-pointer hover:text-foreground" onClick={() => { setSortBy('date'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                  Date {sortBy === 'date' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="py-3 px-3">Account</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Payee</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-mono">
              {ledgerResult.data.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-muted-foreground text-xs">
                    No transactions match your search/filter criteria.
                  </td>
                </tr>
              ) : (
                ledgerResult.data.map(tx => {
                  const isChecked = selectedIds.includes(tx.id);
                  const categoryObj = categories.find(c => c.id === tx.category_id);

                  const getTypeDetails = (type) => {
                    switch (type) {
                      case 'income':
                        return {
                          badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
                          amountClass: 'text-emerald-600 dark:text-emerald-400',
                          label: 'Income',
                          prefix: '+'
                        };
                      case 'savings':
                        return {
                          badgeClass: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30',
                          amountClass: 'text-sky-600 dark:text-sky-400',
                          label: 'Savings',
                          prefix: ''
                        };
                      case 'investment':
                        return {
                          badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30',
                          amountClass: 'text-amber-600 dark:text-amber-400',
                          label: 'Investment',
                          prefix: ''
                        };
                      case 'transfer':
                        return {
                          badgeClass: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30',
                          amountClass: 'text-indigo-600 dark:text-indigo-400',
                          label: 'Transfer',
                          prefix: ''
                        };
                      case 'expense':
                      default:
                        return {
                          badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30',
                          amountClass: 'text-rose-600 dark:text-rose-400',
                          label: 'Expense',
                          prefix: '-'
                        };
                    }
                  };

                  const typeDetails = getTypeDetails(tx.transaction_type);

                  return (
                    <tr key={tx.id} className={`hover:bg-muted/20 transition-colors ${isChecked ? 'bg-primary/5' : ''}`}>
                      <td className="py-3 px-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectOne(tx.id)}
                          className="rounded text-primary focus:ring-primary"
                        />
                      </td>
                      <td className="py-3 px-3 font-semibold text-foreground whitespace-nowrap">{tx.date}</td>
                      <td className="py-3 px-3 text-muted-foreground font-sans font-medium">{accMap.get(tx.account_id) || 'Thiru'}</td>
                      <td className="py-3 px-3 font-sans">
                        {categoryObj ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-muted/40 border border-border">
                            <span className="w-2 h-2 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: categoryObj.color_code || '#94a3b8' }} />
                            <span className="text-foreground font-semibold">{categoryObj.name}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground font-medium">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-sans font-normal text-muted-foreground">
                        <div className="text-foreground font-medium">{tx.payee || 'Transaction'}</div>
                        {tx.notes && <p className="text-[10px] text-muted-foreground/70 font-sans">{tx.notes}</p>}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize font-sans ${typeDetails.badgeClass}`}>
                          {typeDetails.label}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-0.5 rounded-full border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-sans font-medium bg-emerald-500/5">
                          Completed
                        </span>
                      </td>
                      <td className={`py-3 px-3 text-right font-bold whitespace-nowrap font-mono ${typeDetails.amountClass}`}>
                        {typeDetails.prefix}{formatMoney(tx.amount)}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {tx.receipt_file_url && (
                            <button
                              onClick={() => setViewingReceiptUrl(tx.receipt_file_url)}
                              className="p-1 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition-colors"
                              title="View Receipt Attachment"
                            >
                              <Paperclip className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => { setEditingTx(tx); setShowAddModal(true); }}
                            className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTx(tx.id)}
                            className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION BAR */}
        <div className="p-4 border-t border-border flex items-center justify-between text-xs bg-muted/20">
          <span className="text-muted-foreground font-mono">
            Page {ledgerResult.page} of {ledgerResult.totalPages} ({ledgerResult.totalCount} total entries)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 border border-border rounded-lg hover:bg-muted text-foreground disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(ledgerResult.totalPages, p + 1))}
              disabled={page >= ledgerResult.totalPages}
              className="p-1.5 border border-border rounded-lg hover:bg-muted text-foreground disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {showAddModal && (
        <TransactionFormDialog
          initialData={editingTx}
          onClose={() => { setShowAddModal(false); setEditingTx(null); }}
          onSuccess={() => { refetchWorkspace(); loadData(); }}
        />
      )}

      {showImportModal && (
        <ImportTransactionsDialog
          onClose={() => setShowImportModal(false)}
          onSuccess={() => { refetchWorkspace(); loadData(); }}
        />
      )}

      {/* RECEIPT PREVIEW MODAL */}
      {viewingReceiptUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          onClick={() => setViewingReceiptUrl(null)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-6 max-w-xl w-full space-y-4 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-heading font-semibold text-foreground flex items-center gap-2 text-sm">
                <Paperclip className="w-4 h-4 text-primary" />
                <span>Transaction Receipt Attachment</span>
              </h3>
              <button
                onClick={() => setViewingReceiptUrl(null)}
                className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex justify-center p-2 bg-muted/20 rounded-xl overflow-hidden max-h-[70vh]">
              {viewingReceiptUrl.startsWith('data:image/') || viewingReceiptUrl.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                <img src={viewingReceiptUrl} alt="Receipt" className="max-h-[60vh] object-contain rounded-lg" />
              ) : (
                <iframe src={viewingReceiptUrl} title="Receipt PDF" className="w-full h-[50vh] rounded-lg border border-border" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
