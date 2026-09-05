import { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { storageApi } from '../lib/storage';

export function useWorkspaceData() {
  const { activeWorkspace } = useWorkspace();
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [recurringRules, setRecurringRules] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [debts, setDebts] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  const reloadData = useCallback(async () => {
    if (!activeWorkspace?.id) {
      setAccounts([]);
      setCategories([]);
      setTransactions([]);
      setBudgets([]);
      setSavingsGoals([]);
      setRecurringRules([]);
      setTemplates([]);
      setDebts([]);
      setBills([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const [
      accs,
      cats,
      txs,
      bdgs,
      goals,
      rules,
      tmplts,
      dbts,
      blls
    ] = await Promise.all([
      storageApi.getEntity('accounts', activeWorkspace.id),
      storageApi.getEntity('categories', activeWorkspace.id),
      storageApi.getEntity('transactions', activeWorkspace.id),
      storageApi.getEntity('budgets', activeWorkspace.id),
      storageApi.getEntity('savings_goals', activeWorkspace.id),
      storageApi.getEntity('recurring_rules', activeWorkspace.id),
      storageApi.getEntity('transaction_templates', activeWorkspace.id),
      storageApi.getEntity('debts_loans', activeWorkspace.id),
      storageApi.getEntity('bill_reminders', activeWorkspace.id)
    ]);

    setAccounts(accs || []);
    setCategories(cats || []);
    setTransactions(txs || []);
    setBudgets(bdgs || []);
    setSavingsGoals(goals || []);
    setRecurringRules(rules || []);
    setTemplates(tmplts || []);
    setDebts(dbts || []);
    setBills(blls || []);
    setLoading(false);
  }, [activeWorkspace?.id]);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  return {
    accounts,
    categories,
    transactions,
    budgets,
    savingsGoals,
    recurringRules,
    templates,
    debts,
    bills,
    loading,
    refetch: reloadData
  };
}
