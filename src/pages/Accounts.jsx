import React, { useState } from 'react';
import { useWorkspaceData } from '../hooks/useWorkspaceData';
import { useWorkspace } from '../context/WorkspaceContext';
import { storageApi } from '../lib/storage';
import { formatMoney, ACCOUNT_TYPES } from '../lib/finance';
import { AccountFormDialog } from '../components/dialogs/AccountFormDialog';
import { Wallet, PiggyBank, Banknote, CreditCard, Plus, Edit2, Trash2, Shield } from 'lucide-react';

export function Accounts() {
  const { isWorkspaceAdmin } = useWorkspace();
  const { accounts, refetch } = useWorkspaceData();

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  const getAccountIcon = (type) => {
    switch (type) {
      case 'savings': return PiggyBank;
      case 'cash': return Banknote;
      case 'credit_card': return CreditCard;
      default: return Wallet;
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this financial account?')) return;
    await storageApi.deleteEntity('accounts', id);
    await refetch();
  };

  const totalBalance = accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-heading font-bold text-foreground">Accounts & Vaults</h1>
          <p className="text-xs text-muted-foreground">Manage liquid bank accounts, cash wallets, savings reserves, and credit cards</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right px-4 py-2 bg-muted/40 rounded-xl border border-border">
            <span className="text-[10px] font-mono text-muted-foreground uppercase">Net Total Balance</span>
            <p className="text-lg font-bold font-mono text-primary">{formatMoney(totalBalance)}</p>
          </div>

          <button
            onClick={() => { setEditingAccount(null); setShowFormModal(true); }}
            className="px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-xs flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      {/* ACCOUNTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {accounts.map(acc => {
          const Icon = getAccountIcon(acc.type);
          const isCredit = acc.type === 'credit_card';

          return (
            <div key={acc.id} className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm relative group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${
                    isCredit ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-primary/10 text-primary'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">{acc.name}</h3>
                    <p className="text-[10px] font-mono text-muted-foreground capitalize">{acc.type.replace('_', ' ')} • {acc.currency || 'INR'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setEditingAccount(acc); setShowFormModal(true); }}
                    className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(acc.id)}
                    className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-border/40">
                <span className="text-[10px] font-mono text-muted-foreground">Current Balance</span>
                <p className={`text-2xl font-bold font-mono ${
                  Number(acc.balance) < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'
                }`}>
                  {formatMoney(acc.balance, acc.currency)}
                </p>
              </div>

              <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono">
                <span>Initial: {formatMoney(acc.initial_balance, acc.currency)}</span>
                <span className="bg-muted px-2 py-0.5 rounded-full">{acc.type}</span>
              </div>
            </div>
          );
        })}
      </div>

      {showFormModal && (
        <AccountFormDialog
          initialData={editingAccount}
          onClose={() => { setShowFormModal(false); setEditingAccount(null); }}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}
