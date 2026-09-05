import { storageApi } from './storage';

export async function fetchPaginatedTransactions({
  workspaceId,
  page = 1,
  pageSize = 20,
  search = '',
  type = 'all',
  accountId = 'all',
  categoryId = 'all',
  status = 'all',
  startDate = null,
  endDate = null,
  tag = 'all',
  sortBy = 'date',
  sortOrder = 'desc'
}) {
  const allTx = await storageApi.getEntity('transactions', workspaceId);

  let filtered = allTx.filter(tx => {
    // Type filter
    if (type !== 'all' && tx.transaction_type !== type) return false;
    // Account filter
    if (accountId !== 'all' && tx.account_id !== accountId && tx.to_account_id !== accountId) return false;
    // Category filter
    if (categoryId !== 'all' && tx.category_id !== categoryId) return false;
    // Status filter
    if (status !== 'all' && tx.status !== status) return false;
    // Tag filter
    if (tag !== 'all' && (!tx.tags || !tx.tags.includes(tag))) return false;
    // Date range filter
    if (startDate && tx.date < startDate) return false;
    if (endDate && tx.date > endDate) return false;
    // Search query filter (payee, notes, tags)
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchPayee = tx.payee && tx.payee.toLowerCase().includes(q);
      const matchNotes = tx.notes && tx.notes.toLowerCase().includes(q);
      const matchAmount = tx.amount && tx.amount.toString().includes(q);
      const matchTags = tx.tags && tx.tags.some(t => t.toLowerCase().includes(q));
      if (!matchPayee && !matchNotes && !matchAmount && !matchTags) return false;
    }
    return true;
  });

  // Sort
  filtered.sort((a, b) => {
    let valA = a[sortBy];
    let valB = b[sortBy];

    if (sortBy === 'amount') {
      valA = Number(valA) || 0;
      valB = Number(valB) || 0;
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filtered.slice(startIndex, startIndex + pageSize);

  return {
    data: paginatedData,
    totalCount,
    page: currentPage,
    totalPages,
    pageSize
  };
}
