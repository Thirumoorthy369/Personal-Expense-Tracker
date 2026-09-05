// =====================================================================
// PERSONAL TRACKER — HYBRID STORAGE ENGINE (SUPABASE + LOCALSTORAGE)
// Enables instant offline/demo capability + seamless live Supabase DB
// =====================================================================

import { supabase, isSupabaseConfigured } from './supabaseClient';
import { todayISO, calculateBalanceAdjustments } from './finance';

const STORAGE_KEY_PREFIX = 'personal_tracker_v1_';

function getItem(key, defaultValue) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

function setItem(key, value) {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error('LocalStorage write error', e);
  }
}

// DETERMINISTIC UUID CONVERTER (Ensures standard v4 UUID string format for Supabase PostgreSQL UUID columns)
export function toValidUuid(str) {
  if (!str) return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(str)) return str;

  let hash = 0;
  let hash2 = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
    hash2 = (hash2 << 7) - hash2 + char;
    hash2 = hash2 & hash2;
  }

  let hex = '';
  for (let i = 0; i < str.length; i++) {
    hex += str.charCodeAt(i).toString(16);
  }
  const seed = (Math.abs(hash).toString(16) + Math.abs(hash2).toString(16) + '00000000000000000000000000000000').slice(0, 32);
  hex = (hex + seed).slice(0, 32);

  const part1 = hex.slice(0, 8);
  const part2 = hex.slice(8, 12);
  const part3 = '4' + hex.slice(13, 16);
  const part4 = (('89ab'[Math.abs(hash) % 4]) || '8') + hex.slice(17, 20);
  const part5 = hex.slice(20, 32);

  return `${part1}-${part2}-${part3}-${part4}-${part5}`.toLowerCase();
}

// DEFAULT INITIAL REAL DATA FOR USER THIRUMOORTHY S
const DEFAULT_USER = {
  id: 'user-default-001',
  email: 'mr.thirumoorthys@gmail.com',
  display_name: 'Thirumoorthy S',
  role: 'super_admin',
  created_at: new Date().toISOString()
};

const DEFAULT_WORKSPACE = {
  id: 'ws-default-001',
  name: "Thiru's Primary Vault",
  owner_id: DEFAULT_USER.id,
  currency: 'INR',
  created_at: new Date().toISOString()
};

const DEFAULT_MEMBERS = [
  { id: 'm-1', workspace_id: DEFAULT_WORKSPACE.id, user_id: DEFAULT_USER.id, user_email: DEFAULT_USER.email, role: 'admin' }
];

const DEFAULT_ACCOUNTS = [
  { id: 'acc-thiru', workspace_id: DEFAULT_WORKSPACE.id, name: 'Thiru', type: 'checking', balance: 20656, initial_balance: 0, currency: 'INR' }
];

const DEFAULT_CATEGORIES = [
  { id: 'cat-from-amma', workspace_id: DEFAULT_WORKSPACE.id, name: 'From Amma', type: 'income', color_code: '#10b981' },
  { id: 'cat-salary', workspace_id: DEFAULT_WORKSPACE.id, name: 'Salary', type: 'income', color_code: '#10b981' },
  { id: 'cat-freelancing', workspace_id: DEFAULT_WORKSPACE.id, name: 'Freelance & Projects', type: 'income', color_code: '#3b82f6' },
  { id: 'cat-already-added', workspace_id: DEFAULT_WORKSPACE.id, name: 'Opening Balance', type: 'income', color_code: '#06b6d4' },
  { id: 'cat-housing', workspace_id: DEFAULT_WORKSPACE.id, name: 'Housing', type: 'expense', color_code: '#ef4444' },
  { id: 'cat-food', workspace_id: DEFAULT_WORKSPACE.id, name: 'Food', type: 'expense', color_code: '#f59e0b' },
  { id: 'cat-digital-products', workspace_id: DEFAULT_WORKSPACE.id, name: 'Digital Products', type: 'expense', color_code: '#3b82f6' },
  { id: 'cat-medical', workspace_id: DEFAULT_WORKSPACE.id, name: 'Medical Expenses', type: 'expense', color_code: '#ec4899' },
  { id: 'cat-loan', workspace_id: DEFAULT_WORKSPACE.id, name: 'Loans & Personal', type: 'expense', color_code: '#8b5cf6' },
  { id: 'cat-subscription', workspace_id: DEFAULT_WORKSPACE.id, name: 'Subscriptions', type: 'expense', color_code: '#a855f7' },
  { id: 'cat-petrol', workspace_id: DEFAULT_WORKSPACE.id, name: 'Petrol & Travel', type: 'expense', color_code: '#d97706' },
  { id: 'cat-emergency-fund', workspace_id: DEFAULT_WORKSPACE.id, name: 'Emergency fund', type: 'savings', color_code: '#059669' },
  { id: 'cat-digital-gold', workspace_id: DEFAULT_WORKSPACE.id, name: 'Digital Gold', type: 'investment', color_code: '#eab308' },
  { id: 'cat-mutual-fund', workspace_id: DEFAULT_WORKSPACE.id, name: 'Mutual Fund', type: 'investment', color_code: '#6366f1' },
  { id: 'cat-stock-market', workspace_id: DEFAULT_WORKSPACE.id, name: 'Stock Market', type: 'investment', color_code: '#10b981' }
];

const DEFAULT_TRANSACTIONS = [
  { id: 'csv-tx-1', workspace_id: DEFAULT_WORKSPACE.id, account_id: 'acc-thiru', category_id: 'cat-from-amma', amount: 6500, transaction_type: 'income', status: 'completed', date: '2026-09-04', payee: 'Amma', notes: '', tags: ['#imported'] },
  { id: 'csv-tx-2', workspace_id: DEFAULT_WORKSPACE.id, account_id: 'acc-thiru', category_id: 'cat-housing', amount: 2200, transaction_type: 'expense', status: 'completed', date: '2026-09-04', payee: 'For amma from 6.5', notes: 'from 6500 it takes, now bal - 4300 rs', tags: ['#family'] },
  { id: 'csv-tx-3', workspace_id: DEFAULT_WORKSPACE.id, account_id: 'acc-thiru', category_id: 'cat-food', amount: 40, transaction_type: 'expense', status: 'completed', date: '2026-09-04', payee: 'Kings bakery - T', notes: '', tags: ['#food'] },
  { id: 'csv-tx-4', workspace_id: DEFAULT_WORKSPACE.id, account_id: 'acc-thiru', category_id: 'cat-housing', amount: 1000, transaction_type: 'expense', status: 'completed', date: '2026-09-04', payee: 'Amma Greentrends', notes: '', tags: ['#family'] },
  { id: 'csv-tx-5', workspace_id: DEFAULT_WORKSPACE.id, account_id: 'acc-thiru', category_id: 'cat-food', amount: 65, transaction_type: 'expense', status: 'completed', date: '2026-09-03', payee: 'Kings bakery - t+roll', notes: '', tags: ['#food'] },
  { id: 'csv-tx-6', workspace_id: DEFAULT_WORKSPACE.id, account_id: 'acc-thiru', category_id: 'cat-digital-products', amount: 600, transaction_type: 'expense', status: 'completed', date: '2026-09-03', payee: 'Airpods', notes: '', tags: ['#gadgets'] },
  { id: 'csv-tx-7', workspace_id: DEFAULT_WORKSPACE.id, account_id: 'acc-thiru', category_id: 'cat-housing', amount: 65, transaction_type: 'expense', status: 'completed', date: '2026-09-03', payee: 'Idly vaanguna', notes: '', tags: ['#food'] },
  { id: 'csv-tx-8', workspace_id: DEFAULT_WORKSPACE.id, account_id: 'acc-thiru', category_id: 'cat-housing', amount: 4195, transaction_type: 'expense', status: 'completed', date: '2026-09-03', payee: 'Amma - Cover sales', notes: '', tags: ['#business'] },
  { id: 'csv-tx-9', workspace_id: DEFAULT_WORKSPACE.id, account_id: 'acc-thiru', category_id: 'cat-digital-gold', amount: 1000, transaction_type: 'investment', status: 'completed', date: '2026-09-03', payee: 'Auro Gold- Gold', notes: '', tags: ['#gold'] },
  { id: 'csv-tx-10', workspace_id: DEFAULT_WORKSPACE.id, account_id: 'acc-thiru', category_id: 'cat-mutual-fund', amount: 500, transaction_type: 'investment', status: 'completed', date: '2026-09-02', payee: 'HDFC MF', notes: '', tags: ['#mf'] },
  { id: 'csv-tx-11', workspace_id: DEFAULT_WORKSPACE.id, account_id: 'acc-thiru', category_id: 'cat-food', amount: 21, transaction_type: 'expense', status: 'completed', date: '2026-09-02', payee: 'tea', notes: '', tags: ['#tea'] },
  { id: 'csv-tx-12', workspace_id: DEFAULT_WORKSPACE.id, account_id: 'acc-thiru', category_id: 'cat-housing', amount: 905, transaction_type: 'expense', status: 'completed', date: '2026-09-02', payee: 'Lotion and facewash', notes: '', tags: ['#personal'] },
  { id: 'csv-tx-13', workspace_id: DEFAULT_WORKSPACE.id, account_id: 'acc-thiru', category_id: 'cat-food', amount: 450, transaction_type: 'expense', status: 'completed', date: '2026-09-02', payee: 'Kings, Brownie and Shawarma', notes: '', tags: ['#food'] },
  { id: 'csv-tx-14', workspace_id: DEFAULT_WORKSPACE.id, account_id: 'acc-thiru', category_id: 'cat-housing', amount: 310, transaction_type: 'expense', status: 'completed', date: '2026-09-02', payee: 'Food @RHR', notes: '', tags: ['#dining'] },
  { id: 'csv-tx-15', workspace_id: DEFAULT_WORKSPACE.id, account_id: 'acc-thiru', category_id: 'cat-loan', amount: 500, transaction_type: 'expense', status: 'completed', date: '2026-09-01', payee: 'To harini akka', notes: 'Paid', tags: ['#loan'] },
  { id: 'csv-tx-16', workspace_id: DEFAULT_WORKSPACE.id, account_id: 'acc-thiru', category_id: 'cat-housing', amount: 39, transaction_type: 'expense', status: 'completed', date: '2026-09-01', payee: 'For thatha kadai', notes: '', tags: ['#family'] },
  { id: 'csv-tx-17', workspace_id: DEFAULT_WORKSPACE.id, account_id: 'acc-thiru', category_id: 'cat-food', amount: 80, transaction_type: 'expense', status: 'completed', date: '2026-09-01', payee: 'brownie', notes: '', tags: ['#snacks'] },
  { id: 'csv-tx-18', workspace_id: DEFAULT_WORKSPACE.id, account_id: 'acc-thiru', category_id: 'cat-housing', amount: 115, transaction_type: 'expense', status: 'completed', date: '2026-09-01', payee: 'Maligai,paruthipaal', notes: '', tags: ['#groceries'] },
  { id: 'csv-tx-19', workspace_id: DEFAULT_WORKSPACE.id, account_id: 'acc-thiru', category_id: 'cat-stock-market', amount: 500, transaction_type: 'investment', status: 'completed', date: '2026-09-01', payee: 'stocks', notes: '', tags: ['#stocks'] },
  { id: 'csv-tx-20', workspace_id: DEFAULT_WORKSPACE.id, account_id: 'acc-thiru', category_id: 'cat-mutual-fund', amount: 500, transaction_type: 'investment', status: 'completed', date: '2026-09-01', payee: 'SIP on motilal', notes: '', tags: ['#sip'] },
  { id: 'csv-tx-21', workspace_id: DEFAULT_WORKSPACE.id, account_id: 'acc-thiru', category_id: 'cat-medical', amount: 60, transaction_type: 'expense', status: 'completed', date: '2026-08-31', payee: 'Tablet fro me', notes: '', tags: ['#health'] },
  { id: 'csv-tx-22', workspace_id: DEFAULT_WORKSPACE.id, account_id: 'acc-thiru', category_id: 'cat-food', amount: 145, transaction_type: 'expense', status: 'completed', date: '2026-08-31', payee: 'Kalan, Puff and Dairymilk and omam water and IDLY', notes: '', tags: ['#food'] },
  { id: 'csv-tx-23', workspace_id: DEFAULT_WORKSPACE.id, account_id: 'acc-thiru', category_id: 'cat-digital-gold', amount: 1000, transaction_type: 'investment', status: 'completed', date: '2026-08-31', payee: 'Aura Gold => G-500, S-500', notes: '', tags: ['#gold'] },
  { id: 'csv-tx-24', workspace_id: DEFAULT_WORKSPACE.id, account_id: 'acc-thiru', category_id: 'cat-mutual-fund', amount: 1000, transaction_type: 'investment', status: 'completed', date: '2026-08-31', payee: 'SIP', notes: '', tags: ['#sip'] },
  { id: 'csv-tx-25', workspace_id: DEFAULT_WORKSPACE.id, account_id: 'acc-thiru', category_id: 'cat-emergency-fund', amount: 5000, transaction_type: 'savings', status: 'completed', date: '2026-08-31', payee: 'EMF', notes: 'For need', tags: ['#emergency-fund'] },
  { id: 'csv-tx-26', workspace_id: DEFAULT_WORKSPACE.id, account_id: 'acc-thiru', category_id: 'cat-housing', amount: 1570, transaction_type: 'expense', status: 'completed', date: '2026-08-30', payee: 'Mother-exp', notes: 'purchase', tags: ['#family'] },
  { id: 'csv-tx-27', workspace_id: DEFAULT_WORKSPACE.id, account_id: 'acc-thiru', category_id: 'cat-salary', amount: 21000, transaction_type: 'income', status: 'completed', date: '2026-08-30', payee: 'BHS = Salary', notes: '', tags: ['#salary'] },
  { id: 'csv-tx-28', workspace_id: DEFAULT_WORKSPACE.id, account_id: 'acc-thiru', category_id: 'cat-food', amount: 40, transaction_type: 'expense', status: 'completed', date: '2026-08-29', payee: 'Food Item', notes: '', tags: ['#food'] },
  { id: 'csv-tx-29', workspace_id: DEFAULT_WORKSPACE.id, account_id: 'acc-thiru', category_id: 'cat-freelancing', amount: 15000, transaction_type: 'income', status: 'completed', date: '2026-08-29', payee: 'Freelanccing Project', notes: '', tags: ['#freelance'] },
  { id: 'csv-tx-30', workspace_id: DEFAULT_WORKSPACE.id, account_id: 'acc-thiru', category_id: 'cat-subscription', amount: 550, transaction_type: 'expense', status: 'completed', date: '2026-08-28', payee: 'Subscription Plan', notes: '', tags: ['#subscription'] },
  { id: 'csv-tx-31', workspace_id: DEFAULT_WORKSPACE.id, account_id: 'acc-thiru', category_id: 'cat-petrol', amount: 100, transaction_type: 'expense', status: 'completed', date: '2026-08-28', payee: 'Petrol Refill', notes: '', tags: ['#fuel'] },
  { id: 'csv-tx-32', workspace_id: DEFAULT_WORKSPACE.id, account_id: 'acc-thiru', category_id: 'cat-already-added', amount: 706, transaction_type: 'income', status: 'completed', date: '2026-08-24', payee: 'Opening Balance Adjustment', notes: '', tags: ['#initial'] }
];

const DEFAULT_BUDGETS = [
  { id: 'b-1', workspace_id: DEFAULT_WORKSPACE.id, category_id: 'cat-housing', monthly_limit: 10000, alert_threshold_percentage: 80 }
];

const DEFAULT_SAVINGS_GOALS = [
  { id: 'sg-1', workspace_id: DEFAULT_WORKSPACE.id, title: 'Emergency fund', target_amount: 90000, current_amount: 5000, target_date: '2027-12-31', category_id: 'cat-emergency-fund' }
];

const DEFAULT_RECURRING_RULES = [
  { id: 'rr-1', workspace_id: DEFAULT_WORKSPACE.id, account_id: 'acc-thiru', category_id: 'cat-mutual-fund', amount: 1000, transaction_type: 'expense', payee: 'SIP Motilal Mutual Fund', frequency: 'monthly', next_run_date: todayISO(), is_active: true },
  { id: 'rr-2', workspace_id: DEFAULT_WORKSPACE.id, account_id: 'acc-thiru', category_id: 'cat-digital-gold', amount: 1000, transaction_type: 'expense', payee: 'Aura Gold SIP', frequency: 'monthly', next_run_date: todayISO(), is_active: true }
];

const DEFAULT_DEBTS = [];

const DEFAULT_BILLS = [];

// Initialize Storage with REAL DATA
export function initializeStorage(forceReset = false) {
  if (forceReset || !getItem('initialized_csv_v12', false)) {
    setItem('users', [DEFAULT_USER]);
    setItem('workspaces', [DEFAULT_WORKSPACE]);
    setItem('workspace_members', DEFAULT_MEMBERS);
    setItem('accounts', DEFAULT_ACCOUNTS);
    setItem('categories', DEFAULT_CATEGORIES);
    setItem('transactions', DEFAULT_TRANSACTIONS);
    setItem('budgets', DEFAULT_BUDGETS);
    setItem('savings_goals', DEFAULT_SAVINGS_GOALS);
    setItem('recurring_rules', DEFAULT_RECURRING_RULES);
    setItem('transaction_templates', []);
    setItem('debts_loans', DEFAULT_DEBTS);
    setItem('bill_reminders', DEFAULT_BILLS);
    setItem('audit_logs', [{ id: 'al-1', workspace_id: DEFAULT_WORKSPACE.id, user_id: DEFAULT_USER.id, action: 'IMPORT_CSV_REAL_DATA', entity_type: 'workspace', created_at: new Date().toISOString() }]);
    setItem('initialized_csv_v12', true);
  }
}

// Seed run on startup (do NOT force reset so user edits persist on hard refresh)
initializeStorage(false);

// STORAGE API LAYER
export const storageApi = {
  // WORKSPACES
  getWorkspaces: async (userId) => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('workspaces').select('*');
      if (!error && data && data.length > 0) return data;
    }
    initializeStorage();
    const workspaces = getItem('workspaces', [DEFAULT_WORKSPACE]);
    const members = getItem('workspace_members', DEFAULT_MEMBERS);
    const userMemberWsIds = members.filter(m => m.user_id === userId).map(m => m.workspace_id);
    const matched = workspaces.filter(w => w.owner_id === userId || userMemberWsIds.includes(w.id));
    if (matched.length > 0) return matched;
    // Fallback: return default seed workspace so user always has access to seed data
    return workspaces.length > 0 ? workspaces : [DEFAULT_WORKSPACE];
  },

  createWorkspace: async (workspaceData) => {
    const newWs = {
      id: 'ws-' + Date.now(),
      created_at: new Date().toISOString(),
      ...workspaceData
    };
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('workspaces').insert([{
        ...newWs,
        id: toValidUuid(newWs.id),
        owner_id: toValidUuid(newWs.owner_id)
      }]).select().single();
      if (!error && data) return data;
    }
    const workspaces = getItem('workspaces', []);
    workspaces.push(newWs);
    setItem('workspaces', workspaces);
    
    // Add owner as admin member
    const members = getItem('workspace_members', []);
    members.push({
      id: 'm-' + Date.now(),
      workspace_id: newWs.id,
      user_id: newWs.owner_id,
      role: 'admin',
      created_at: new Date().toISOString()
    });
    setItem('workspace_members', members);

    // Seed default categories & transactions for new workspace
    const categories = getItem('categories', []);
    const defaultCats = DEFAULT_CATEGORIES.map(c => ({
      ...c,
      id: 'cat-' + Math.random().toString(36).substring(2, 9),
      workspace_id: newWs.id
    }));
    setItem('categories', [...categories, ...defaultCats]);

    return newWs;
  },

  // ENTITY CRUD FACTORY
  getEntity: async (entityName, workspaceId) => {
    initializeStorage();
    const targetWsId = workspaceId || DEFAULT_WORKSPACE.id;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from(entityName).select('*').eq('workspace_id', toValidUuid(targetWsId));
        if (!error && data && data.length > 0) return data;
      } catch (e) {
        console.warn(`Supabase getEntity failed for ${entityName}`, e);
      }
    }

    const items = getItem(entityName, []);
    return items.filter(i => (i.workspace_id || DEFAULT_WORKSPACE.id) === targetWsId);
  },

  saveEntity: async (entityName, item) => {
    initializeStorage();
    const isNew = !item.id;
    const rawId = item.id || `${entityName.slice(0, 3)}-${Date.now()}`;
    const payload = {
      ...item,
      workspace_id: item.workspace_id || DEFAULT_WORKSPACE.id,
      id: rawId,
      updated_at: new Date().toISOString()
    };
    if (isNew) payload.created_at = new Date().toISOString();

    if (isSupabaseConfigured) {
      try {
        const supaPayload = {
          ...payload,
          id: toValidUuid(rawId),
          workspace_id: toValidUuid(payload.workspace_id)
        };
        if (supaPayload.category_id) supaPayload.category_id = toValidUuid(supaPayload.category_id);
        if (supaPayload.account_id) supaPayload.account_id = toValidUuid(supaPayload.account_id);
        if (supaPayload.to_account_id) supaPayload.to_account_id = toValidUuid(supaPayload.to_account_id);

        const query = isNew
          ? supabase.from(entityName).insert([supaPayload])
          : supabase.from(entityName).update(supaPayload).eq('id', supaPayload.id);
        await query;
      } catch (e) {
        console.warn(`Supabase saveEntity failed for ${entityName}`, e);
      }
    }

    const items = getItem(entityName, []);
    const existingIdx = items.findIndex(i => i.id === rawId);
    if (existingIdx >= 0) {
      items[existingIdx] = payload;
    } else {
      items.push(payload);
    }
    setItem(entityName, items);
    return payload;
  },

  deleteEntity: async (entityName, id) => {
    initializeStorage();
    if (isSupabaseConfigured) {
      await supabase.from(entityName).delete().eq('id', toValidUuid(id));
    }
    const items = getItem(entityName, []);
    const filtered = items.filter(i => i.id !== id);
    setItem(entityName, filtered);
  },

  // TRANSACTIONS WITH BALANCE RECONCILIATION
  saveTransaction: async (tx) => {
    initializeStorage();
    const transactions = getItem('transactions', []);
    const accounts = getItem('accounts', []);
    const isNew = !tx.id;

    // Reverse old balance effect if editing
    if (!isNew) {
      const oldTx = transactions.find(t => t.id === tx.id);
      if (oldTx) {
        const oldReversals = calculateBalanceAdjustments(oldTx, true);
        for (const [accId, delta] of Object.entries(oldReversals)) {
          const acc = accounts.find(a => a.id === accId);
          if (acc) acc.balance = Number(acc.balance || 0) + delta;
        }
      }
    }

    // Save transaction
    const savedTx = await storageApi.saveEntity('transactions', tx);

    // Apply new balance effect
    const newAdjustments = calculateBalanceAdjustments(savedTx, false);
    for (const [accId, delta] of Object.entries(newAdjustments)) {
      const acc = accounts.find(a => a.id === accId);
      if (acc) {
        acc.balance = Number(acc.balance || 0) + delta;
        if (isSupabaseConfigured) {
          await supabase.from('accounts').update({ balance: acc.balance }).eq('id', toValidUuid(accId));
        }
      }
    }

    setItem('accounts', accounts);
    return savedTx;
  },

  deleteTransaction: async (id) => {
    initializeStorage();
    const transactions = getItem('transactions', []);
    const accounts = getItem('accounts', []);
    const oldTx = transactions.find(t => t.id === id);

    if (oldTx) {
      const reversals = calculateBalanceAdjustments(oldTx, true);
      for (const [accId, delta] of Object.entries(reversals)) {
        const acc = accounts.find(a => a.id === accId);
        if (acc) {
          acc.balance = Number(acc.balance || 0) + delta;
          if (isSupabaseConfigured) {
            await supabase.from('accounts').update({ balance: acc.balance }).eq('id', toValidUuid(accId));
          }
        }
      }
      setItem('accounts', accounts);
    }

    await storageApi.deleteEntity('transactions', id);
  },

  // USERS & ADMIN
  getUsers: async () => {
    initializeStorage();
    return getItem('users', [DEFAULT_USER]);
  },

  saveUser: async (user) => {
    initializeStorage();
    const users = getItem('users', []);
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) users[idx] = { ...users[idx], ...user };
    else users.push(user);
    setItem('users', users);
    return user;
  },

  deleteUser: async (id) => {
    initializeStorage();
    const users = getItem('users', []);
    const filtered = users.filter(u => u.id !== id);
    setItem('users', filtered);
  },

  // WORKSPACE MEMBERS
  getWorkspaceMembers: async (workspaceId) => {
    initializeStorage();
    const members = getItem('workspace_members', []);
    const users = getItem('users', []);
    return members
      .filter(m => m.workspace_id === workspaceId)
      .map(m => {
        const u = users.find(usr => usr.id === m.user_id || usr.email === m.user_email);
        return { ...m, display_name: u?.display_name || m.user_email || 'Member' };
      });
  }
};

// FULL MIGRATION ENGINE: Moves all local storage entities into Supabase Storage
export async function migrateLocalStorageToSupabase(progressCallback = null) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      success: false,
      message: 'Supabase is not configured in .env environment variables.'
    };
  }

  let activeUserId = null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      activeUserId = session.user.id;
    }
  } catch (e) {
    console.warn('Could not check Supabase session:', e);
  }

  const results = {
    profiles: 0,
    workspaces: 0,
    workspace_members: 0,
    accounts: 0,
    categories: 0,
    transactions: 0,
    budgets: 0,
    savings_goals: 0,
    recurring_rules: 0,
    transaction_templates: 0,
    debts_loans: 0,
    bill_reminders: 0,
    errors: []
  };

  const idMap = {};
  function getMappedUuid(id) {
    if (!id) return null;
    if (idMap[id]) return idMap[id];
    const uuid = toValidUuid(id);
    idMap[id] = uuid;
    return uuid;
  }

  if (activeUserId) {
    idMap[DEFAULT_USER.id] = activeUserId;
    idMap['user-default-001'] = activeUserId;
  }

  // 1. PROFILES
  if (progressCallback) progressCallback('Migrating Profiles...');
  const users = getItem('users', [DEFAULT_USER]);
  for (const u of users) {
    const pId = activeUserId || getMappedUuid(u.id);
    const pPayload = {
      id: pId,
      email: u.email || 'user@example.com',
      display_name: u.display_name || 'Thirumoorthy S',
      role: u.role || 'super_admin',
      is_suspended: Boolean(u.is_suspended),
      updated_at: new Date().toISOString()
    };
    try {
      const { error } = await supabase.from('profiles').upsert([pPayload], { onConflict: 'id' });
      if (!error) results.profiles++;
      else console.warn('Profiles upsert note:', error.message);
    } catch (e) {}
  }

  // 2. WORKSPACES
  if (progressCallback) progressCallback('Migrating Workspaces...');
  const workspaces = getItem('workspaces', [DEFAULT_WORKSPACE]);
  for (const ws of workspaces) {
    const wsId = getMappedUuid(ws.id);
    const ownerId = activeUserId || getMappedUuid(ws.owner_id || DEFAULT_USER.id);
    const wsPayload = {
      id: wsId,
      name: ws.name || "Thiru's Primary Vault",
      owner_id: ownerId,
      currency: ws.currency || 'INR',
      created_by_id: ownerId,
      updated_at: new Date().toISOString()
    };
    try {
      const { error } = await supabase.from('workspaces').upsert([wsPayload], { onConflict: 'id' });
      if (!error) results.workspaces++;
      else results.errors.push(`Workspaces: ${error.message}`);
    } catch (e) {
      results.errors.push(`Workspaces error: ${e.message}`);
    }
  }

  // 3. WORKSPACE MEMBERS
  if (progressCallback) progressCallback('Migrating Workspace Members...');
  const members = getItem('workspace_members', DEFAULT_MEMBERS);
  for (const m of members) {
    const mPayload = {
      id: getMappedUuid(m.id),
      workspace_id: getMappedUuid(m.workspace_id || DEFAULT_WORKSPACE.id),
      user_id: activeUserId || getMappedUuid(m.user_id || DEFAULT_USER.id),
      user_email: m.user_email || DEFAULT_USER.email,
      role: m.role || 'admin',
      created_by_id: activeUserId || getMappedUuid(DEFAULT_USER.id),
      updated_at: new Date().toISOString()
    };
    try {
      const { error } = await supabase.from('workspace_members').upsert([mPayload], { onConflict: 'id' });
      if (!error) results.workspace_members++;
    } catch (e) {}
  }

  // 4. ACCOUNTS
  if (progressCallback) progressCallback('Migrating Accounts...');
  const accounts = getItem('accounts', DEFAULT_ACCOUNTS);
  for (const acc of accounts) {
    const accPayload = {
      id: getMappedUuid(acc.id),
      workspace_id: getMappedUuid(acc.workspace_id || DEFAULT_WORKSPACE.id),
      name: acc.name,
      type: acc.type || 'checking',
      balance: Number(acc.balance || 0),
      initial_balance: Number(acc.initial_balance || 0),
      currency: acc.currency || 'INR',
      created_by_id: activeUserId || getMappedUuid(DEFAULT_USER.id),
      updated_at: new Date().toISOString()
    };
    try {
      const { error } = await supabase.from('accounts').upsert([accPayload], { onConflict: 'id' });
      if (!error) results.accounts++;
      else results.errors.push(`Accounts (${acc.name}): ${error.message}`);
    } catch (e) {
      results.errors.push(`Accounts error: ${e.message}`);
    }
  }

  // 5. CATEGORIES
  if (progressCallback) progressCallback('Migrating Categories...');
  const categories = getItem('categories', DEFAULT_CATEGORIES);
  for (const cat of categories) {
    const catPayload = {
      id: getMappedUuid(cat.id),
      workspace_id: getMappedUuid(cat.workspace_id || DEFAULT_WORKSPACE.id),
      name: cat.name,
      type: cat.type || 'expense',
      color_code: cat.color_code || '#6366f1',
      created_by_id: activeUserId || getMappedUuid(DEFAULT_USER.id),
      updated_at: new Date().toISOString()
    };
    try {
      const { error } = await supabase.from('categories').upsert([catPayload], { onConflict: 'id' });
      if (!error) results.categories++;
      else results.errors.push(`Categories (${cat.name}): ${error.message}`);
    } catch (e) {
      results.errors.push(`Categories error: ${e.message}`);
    }
  }

  // 6. TRANSACTIONS
  if (progressCallback) progressCallback('Migrating Transactions...');
  const transactions = getItem('transactions', DEFAULT_TRANSACTIONS);
  const txList = transactions.map(tx => ({
    id: getMappedUuid(tx.id),
    workspace_id: getMappedUuid(tx.workspace_id || DEFAULT_WORKSPACE.id),
    account_id: getMappedUuid(tx.account_id),
    to_account_id: tx.to_account_id ? getMappedUuid(tx.to_account_id) : null,
    category_id: tx.category_id ? getMappedUuid(tx.category_id) : null,
    amount: Number(tx.amount || 0),
    original_amount: tx.original_amount ? Number(tx.original_amount) : null,
    original_currency: tx.original_currency || null,
    exchange_rate: tx.exchange_rate ? Number(tx.exchange_rate) : 1.0,
    transaction_type: tx.transaction_type || 'expense',
    status: tx.status || 'completed',
    date: tx.date,
    payee: tx.payee || '',
    notes: tx.notes || '',
    receipt_file_url: tx.receipt_file_url || null,
    tags: Array.isArray(tx.tags) ? tx.tags : (tx.tags ? [tx.tags] : []),
    created_by_id: activeUserId || getMappedUuid(DEFAULT_USER.id),
    updated_at: new Date().toISOString()
  }));

  if (txList.length > 0) {
    try {
      const { error } = await supabase.from('transactions').upsert(txList, { onConflict: 'id' });
      if (!error) results.transactions = txList.length;
      else results.errors.push(`Transactions: ${error.message}`);
    } catch (e) {
      results.errors.push(`Transactions error: ${e.message}`);
    }
  }

  // 7. BUDGETS
  if (progressCallback) progressCallback('Migrating Budgets...');
  const budgets = getItem('budgets', DEFAULT_BUDGETS);
  for (const b of budgets) {
    const bPayload = {
      id: getMappedUuid(b.id),
      workspace_id: getMappedUuid(b.workspace_id || DEFAULT_WORKSPACE.id),
      category_id: getMappedUuid(b.category_id),
      monthly_limit: Number(b.monthly_limit || 0),
      alert_threshold_percentage: Number(b.alert_threshold_percentage || 80),
      created_by_id: activeUserId || getMappedUuid(DEFAULT_USER.id),
      updated_at: new Date().toISOString()
    };
    try {
      const { error } = await supabase.from('budgets').upsert([bPayload], { onConflict: 'id' });
      if (!error) results.budgets++;
      else results.errors.push(`Budgets: ${error.message}`);
    } catch (e) {}
  }

  // 8. SAVINGS GOALS
  if (progressCallback) progressCallback('Migrating Savings Goals...');
  const savings = getItem('savings_goals', DEFAULT_SAVINGS_GOALS);
  for (const sg of savings) {
    const sgPayload = {
      id: getMappedUuid(sg.id),
      workspace_id: getMappedUuid(sg.workspace_id || DEFAULT_WORKSPACE.id),
      title: sg.title,
      target_amount: Number(sg.target_amount || 0),
      current_amount: Number(sg.current_amount || 0),
      target_date: sg.target_date || null,
      category_id: sg.category_id ? getMappedUuid(sg.category_id) : null,
      created_by_id: activeUserId || getMappedUuid(DEFAULT_USER.id),
      updated_at: new Date().toISOString()
    };
    try {
      const { error } = await supabase.from('savings_goals').upsert([sgPayload], { onConflict: 'id' });
      if (!error) results.savings_goals++;
      else results.errors.push(`Savings Goals: ${error.message}`);
    } catch (e) {}
  }

  // 9. RECURRING RULES
  if (progressCallback) progressCallback('Migrating Recurring Rules...');
  const recurring = getItem('recurring_rules', DEFAULT_RECURRING_RULES);
  for (const rr of recurring) {
    const rrPayload = {
      id: getMappedUuid(rr.id),
      workspace_id: getMappedUuid(rr.workspace_id || DEFAULT_WORKSPACE.id),
      account_id: getMappedUuid(rr.account_id),
      category_id: rr.category_id ? getMappedUuid(rr.category_id) : null,
      amount: Number(rr.amount || 0),
      transaction_type: rr.transaction_type || 'expense',
      payee: rr.payee || '',
      frequency: rr.frequency || 'monthly',
      next_run_date: rr.next_run_date,
      is_active: Boolean(rr.is_active),
      created_by_id: activeUserId || getMappedUuid(DEFAULT_USER.id),
      updated_at: new Date().toISOString()
    };
    try {
      const { error } = await supabase.from('recurring_rules').upsert([rrPayload], { onConflict: 'id' });
      if (!error) results.recurring_rules++;
      else results.errors.push(`Recurring Rules: ${error.message}`);
    } catch (e) {}
  }

  // 10. TRANSACTION TEMPLATES
  if (progressCallback) progressCallback('Migrating Templates...');
  const templates = getItem('transaction_templates', []);
  for (const tmpl of templates) {
    const tmplPayload = {
      id: getMappedUuid(tmpl.id),
      workspace_id: getMappedUuid(tmpl.workspace_id || DEFAULT_WORKSPACE.id),
      name: tmpl.name,
      transaction_type: tmpl.transaction_type || 'expense',
      account_id: tmpl.account_id ? getMappedUuid(tmpl.account_id) : null,
      to_account_id: tmpl.to_account_id ? getMappedUuid(tmpl.to_account_id) : null,
      category_id: tmpl.category_id ? getMappedUuid(tmpl.category_id) : null,
      amount: tmpl.amount ? Number(tmpl.amount) : null,
      payee: tmpl.payee || null,
      notes: tmpl.notes || null,
      "foreign": Boolean(tmpl.foreign),
      original_currency: tmpl.original_currency || null,
      original_amount: tmpl.original_amount ? Number(tmpl.original_amount) : null,
      exchange_rate: tmpl.exchange_rate ? Number(tmpl.exchange_rate) : 1.0,
      created_by_id: activeUserId || getMappedUuid(DEFAULT_USER.id),
      updated_at: new Date().toISOString()
    };
    try {
      const { error } = await supabase.from('transaction_templates').upsert([tmplPayload], { onConflict: 'id' });
      if (!error) results.transaction_templates++;
      else results.errors.push(`Templates: ${error.message}`);
    } catch (e) {}
  }

  // 11. DEBTS & LOANS
  if (progressCallback) progressCallback('Migrating Debts & Loans...');
  const debts = getItem('debts_loans', DEFAULT_DEBTS);
  for (const dl of debts) {
    const dlPayload = {
      id: getMappedUuid(dl.id),
      workspace_id: getMappedUuid(dl.workspace_id || DEFAULT_WORKSPACE.id),
      title: dl.title,
      type: dl.type || 'borrowed',
      counterparty: dl.counterparty,
      principal_amount: Number(dl.principal_amount || 0),
      remaining_amount: Number(dl.remaining_amount || 0),
      interest_rate: Number(dl.interest_rate || 0),
      start_date: dl.start_date,
      due_date: dl.due_date || null,
      status: dl.status || 'active',
      created_by_id: activeUserId || getMappedUuid(DEFAULT_USER.id),
      updated_at: new Date().toISOString()
    };
    try {
      const { error } = await supabase.from('debts_loans').upsert([dlPayload], { onConflict: 'id' });
      if (!error) results.debts_loans++;
      else results.errors.push(`Debts & Loans: ${error.message}`);
    } catch (e) {}
  }

  // 12. BILL REMINDERS
  if (progressCallback) progressCallback('Migrating Bill Reminders...');
  const bills = getItem('bill_reminders', DEFAULT_BILLS);
  for (const br of bills) {
    const brPayload = {
      id: getMappedUuid(br.id),
      workspace_id: getMappedUuid(br.workspace_id || DEFAULT_WORKSPACE.id),
      title: br.title,
      amount: Number(br.amount || 0),
      due_date: br.due_date,
      frequency: br.frequency || 'monthly',
      status: br.status || 'pending',
      category_id: br.category_id ? getMappedUuid(br.category_id) : null,
      created_by_id: activeUserId || getMappedUuid(DEFAULT_USER.id),
      updated_at: new Date().toISOString()
    };
    try {
      const { error } = await supabase.from('bill_reminders').upsert([brPayload], { onConflict: 'id' });
      if (!error) results.bill_reminders++;
      else results.errors.push(`Bill Reminders: ${error.message}`);
    } catch (e) {}
  }

  const totalMigrated =
    results.workspaces +
    results.accounts +
    results.categories +
    results.transactions +
    results.budgets +
    results.savings_goals +
    results.recurring_rules +
    results.transaction_templates +
    results.debts_loans +
    results.bill_reminders;

  if (progressCallback) progressCallback('Migration Completed!');

  return {
    success: results.errors.length === 0,
    totalMigrated,
    results
  };
}
