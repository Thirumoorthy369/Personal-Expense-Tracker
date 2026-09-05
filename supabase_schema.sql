-- =====================================================================
-- PERSONAL TRACKER — PRODUCTION SUPABASE POSTGRESQL SCHEMA (UPDATED)
-- Decoupled profiles FK & open RLS policies for instant sync
-- =====================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('super_admin', 'user')),
  is_suspended BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. WORKSPACES
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  currency TEXT DEFAULT 'INR',
  created_by_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. WORKSPACE MEMBERS
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_email TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
  created_by_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- 4. ACCOUNTS
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'checking' CHECK (type IN ('checking', 'savings', 'cash', 'credit_card')),
  balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  initial_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  currency TEXT DEFAULT 'INR',
  created_by_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'expense' CHECK (type IN ('income', 'expense', 'investment', 'savings')),
  color_code TEXT DEFAULT '#6366f1',
  created_by_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  to_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  amount NUMERIC(15, 2) NOT NULL,
  original_amount NUMERIC(15, 2),
  original_currency TEXT,
  exchange_rate NUMERIC(10, 6) DEFAULT 1.000000,
  transaction_type TEXT NOT NULL DEFAULT 'expense' CHECK (transaction_type IN ('income', 'expense', 'transfer', 'investment', 'savings')),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending')),
  date DATE NOT NULL,
  payee TEXT,
  notes TEXT,
  receipt_file_url TEXT,
  tags TEXT[] DEFAULT '{}',
  created_by_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TRANSACTION SPLITS
CREATE TABLE IF NOT EXISTS public.transaction_splits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  amount NUMERIC(15, 2) NOT NULL,
  notes TEXT
);

-- 8. BUDGETS
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  monthly_limit NUMERIC(15, 2) NOT NULL,
  alert_threshold_percentage NUMERIC(5, 2) DEFAULT 80.00,
  created_by_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, category_id)
);

-- 9. SAVINGS GOALS
CREATE TABLE IF NOT EXISTS public.savings_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_amount NUMERIC(15, 2) NOT NULL,
  current_amount NUMERIC(15, 2) DEFAULT 0.00,
  target_date DATE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_by_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TRANSACTION TEMPLATES
CREATE TABLE IF NOT EXISTS public.transaction_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  transaction_type TEXT DEFAULT 'expense' CHECK (transaction_type IN ('income', 'expense', 'transfer')),
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  to_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  amount NUMERIC(15, 2),
  payee TEXT,
  notes TEXT,
  "foreign" BOOLEAN DEFAULT FALSE,
  original_currency TEXT,
  original_amount NUMERIC(15, 2),
  exchange_rate NUMERIC(10, 6) DEFAULT 1.0,
  created_by_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. RECURRING RULES
CREATE TABLE IF NOT EXISTS public.recurring_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  amount NUMERIC(15, 2) NOT NULL,
  transaction_type TEXT DEFAULT 'expense' CHECK (transaction_type IN ('income', 'expense')),
  payee TEXT,
  frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  next_run_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. DEBTS & LOANS
CREATE TABLE IF NOT EXISTS public.debts_loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('borrowed', 'lent')),
  counterparty TEXT NOT NULL,
  principal_amount NUMERIC(15, 2) NOT NULL,
  remaining_amount NUMERIC(15, 2) NOT NULL,
  interest_rate NUMERIC(5, 2) DEFAULT 0.00,
  start_date DATE NOT NULL,
  due_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'settled')),
  created_by_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. BILL REMINDERS
CREATE TABLE IF NOT EXISTS public.bill_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  due_date DATE NOT NULL,
  frequency TEXT DEFAULT 'monthly' CHECK (frequency IN ('one_time', 'weekly', 'monthly', 'yearly')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_by_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES — OPEN PERMISSIONS FOR SYNC
-- =====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- DROP EXISTING RESTRICTIVE POLICIES IF PRESENT
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Members view workspace" ON public.workspaces;
DROP POLICY IF EXISTS "User create workspace" ON public.workspaces;
DROP POLICY IF EXISTS "Owner update workspace" ON public.workspaces;
DROP POLICY IF EXISTS "Owner delete workspace" ON public.workspaces;

-- PROFILES POLICIES
CREATE POLICY "Public profiles SELECT" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public profiles INSERT" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public profiles UPDATE" ON public.profiles FOR UPDATE USING (true);

-- WORKSPACES POLICIES
CREATE POLICY "Public workspaces SELECT" ON public.workspaces FOR SELECT USING (true);
CREATE POLICY "Public workspaces INSERT" ON public.workspaces FOR INSERT WITH CHECK (true);
CREATE POLICY "Public workspaces UPDATE" ON public.workspaces FOR UPDATE USING (true);
CREATE POLICY "Public workspaces DELETE" ON public.workspaces FOR DELETE USING (true);

-- WORKSPACE MEMBERS POLICIES
CREATE POLICY "Public members SELECT" ON public.workspace_members FOR SELECT USING (true);
CREATE POLICY "Public members INSERT" ON public.workspace_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Public members UPDATE" ON public.workspace_members FOR UPDATE USING (true);
CREATE POLICY "Public members DELETE" ON public.workspace_members FOR DELETE USING (true);

-- ACCOUNTS POLICIES
CREATE POLICY "Public accounts SELECT" ON public.accounts FOR SELECT USING (true);
CREATE POLICY "Public accounts INSERT" ON public.accounts FOR INSERT WITH CHECK (true);
CREATE POLICY "Public accounts UPDATE" ON public.accounts FOR UPDATE USING (true);
CREATE POLICY "Public accounts DELETE" ON public.accounts FOR DELETE USING (true);

-- CATEGORIES POLICIES
CREATE POLICY "Public categories SELECT" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public categories INSERT" ON public.categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Public categories UPDATE" ON public.categories FOR UPDATE USING (true);
CREATE POLICY "Public categories DELETE" ON public.categories FOR DELETE USING (true);

-- TRANSACTIONS POLICIES
CREATE POLICY "Public transactions SELECT" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Public transactions INSERT" ON public.transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public transactions UPDATE" ON public.transactions FOR UPDATE USING (true);
CREATE POLICY "Public transactions DELETE" ON public.transactions FOR DELETE USING (true);

-- BUDGETS POLICIES
CREATE POLICY "Public budgets SELECT" ON public.budgets FOR SELECT USING (true);
CREATE POLICY "Public budgets INSERT" ON public.budgets FOR INSERT WITH CHECK (true);
CREATE POLICY "Public budgets UPDATE" ON public.budgets FOR UPDATE USING (true);
CREATE POLICY "Public budgets DELETE" ON public.budgets FOR DELETE USING (true);

-- SAVINGS GOALS POLICIES
CREATE POLICY "Public savings SELECT" ON public.savings_goals FOR SELECT USING (true);
CREATE POLICY "Public savings INSERT" ON public.savings_goals FOR INSERT WITH CHECK (true);
CREATE POLICY "Public savings UPDATE" ON public.savings_goals FOR UPDATE USING (true);
CREATE POLICY "Public savings DELETE" ON public.savings_goals FOR DELETE USING (true);

-- RECURRING RULES POLICIES
CREATE POLICY "Public recurring SELECT" ON public.recurring_rules FOR SELECT USING (true);
CREATE POLICY "Public recurring INSERT" ON public.recurring_rules FOR INSERT WITH CHECK (true);
CREATE POLICY "Public recurring UPDATE" ON public.recurring_rules FOR UPDATE USING (true);
CREATE POLICY "Public recurring DELETE" ON public.recurring_rules FOR DELETE USING (true);

-- TEMPLATES POLICIES
CREATE POLICY "Public templates SELECT" ON public.transaction_templates FOR SELECT USING (true);
CREATE POLICY "Public templates INSERT" ON public.transaction_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Public templates UPDATE" ON public.transaction_templates FOR UPDATE USING (true);
CREATE POLICY "Public templates DELETE" ON public.transaction_templates FOR DELETE USING (true);

-- DEBTS & LOANS POLICIES
CREATE POLICY "Public debts SELECT" ON public.debts_loans FOR SELECT USING (true);
CREATE POLICY "Public debts INSERT" ON public.debts_loans FOR INSERT WITH CHECK (true);
CREATE POLICY "Public debts UPDATE" ON public.debts_loans FOR UPDATE USING (true);
CREATE POLICY "Public debts DELETE" ON public.debts_loans FOR DELETE USING (true);

-- BILL REMINDERS POLICIES
CREATE POLICY "Public bills SELECT" ON public.bill_reminders FOR SELECT USING (true);
CREATE POLICY "Public bills INSERT" ON public.bill_reminders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public bills UPDATE" ON public.bill_reminders FOR UPDATE USING (true);
CREATE POLICY "Public bills DELETE" ON public.bill_reminders FOR DELETE USING (true);
