import React, { useState, useEffect } from 'react';
import { useWorkspaceData } from '../hooks/useWorkspaceData';
import { useWorkspace } from '../context/WorkspaceContext';
import { storageApi } from '../lib/storage';
import { formatMoney, todayISO } from '../lib/finance';
import { RecurringFormDialog } from '../components/dialogs/RecurringFormDialog';
import { Repeat, Plus, Edit2, Trash2, CheckCircle2, Bell, Send, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';

export function Recurring() {
  const { isWorkspaceAdmin } = useWorkspace();
  const { recurringRules, accounts, categories, refetch } = useWorkspaceData();

  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [executingId, setExecutingId] = useState(null);
  const [executedMsg, setExecutedMsg] = useState(null);
  const [notifPermission, setNotifPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  const accMap = new Map(accounts.map(a => [a.id, a.name]));
  const catMap = new Map(categories.map(c => [c.id, c.name]));

  // Request browser & mobile device notification permission
  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm === 'granted') {
        new Notification('3-Stage Payment Notifications Enabled', {
          body: 'You will receive 3 reminders (Evening before, Night before, Morning of due date) for all recurring payments.',
          icon: '/pwa-192x192.png'
        });
      }
    }
  };

  const handleTestNotification = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return alert('Browser notifications are not supported on this browser.');
    }

    let perm = Notification.permission;
    if (perm !== 'granted') {
      perm = await Notification.requestPermission();
      setNotifPermission(perm);
    }

    if (perm === 'granted') {
      new Notification('🔔 Notifications Working Perfectly!', {
        body: 'Your mobile phone & laptop are connected! 3-Stage pre-reminders and payment posting confirmations will pop up here.',
        icon: '/pwa-192x192.png'
      });
      setExecutedMsg('Test notification fired! Check your laptop notification center or phone notification shade.');
    } else {
      alert('Notification permission was denied. Please allow notifications in site settings for this app.');
    }
  };

  // Automated 3-Stage Pre-Reminder Scheduler (Evening Before, Night Before, Morning Of)
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return;

    const today = todayISO();
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    const tomISO = tom.toISOString().split('T')[0];
    const hour = new Date().getHours();

    recurringRules.filter(r => r.is_active).forEach(rule => {
      const stage = hour >= 21 ? 'night' : hour >= 18 ? 'evening' : 'morning';
      const notifKey = `notif_sent_${rule.id}_${today}_${stage}`;

      if (!sessionStorage.getItem(notifKey)) {
        if (rule.next_run_date === tomISO && hour >= 18 && hour < 21) {
          new Notification('Upcoming Payment Reminder (Evening)', {
            body: `₹${rule.amount} for "${rule.payee || 'Recurring Payment'}" is due tomorrow (${tomISO}).`,
            icon: '/pwa-192x192.png'
          });
          sessionStorage.setItem(notifKey, 'true');
        } else if (rule.next_run_date === tomISO && hour >= 21) {
          new Notification('Upcoming Payment Alert (Night)', {
            body: `Reminder: ₹${rule.amount} for "${rule.payee || 'Recurring Payment'}" is due tomorrow morning.`,
            icon: '/pwa-192x192.png'
          });
          sessionStorage.setItem(notifKey, 'true');
        } else if (rule.next_run_date === today) {
          new Notification('Payment Due Today!', {
            body: `₹${rule.amount} for "${rule.payee || 'Recurring Payment'}" requires your review. Click "Post Payment Now" or "Delete".`,
            icon: '/pwa-192x192.png'
          });
          sessionStorage.setItem(notifKey, 'true');
        }
      }
    });
  }, [recurringRules]);

  const handleToggleActive = async (rule) => {
    await storageApi.saveEntity('recurring_rules', {
      ...rule,
      is_active: !rule.is_active
    });
    await refetch();
  };

  const handleDelete = async (id, payee = '') => {
    if (!window.confirm(`Delete/Remove recurring payment rule for "${payee || 'Item'}"?`)) return;
    await storageApi.deleteEntity('recurring_rules', id);
    
    setExecutedMsg(`Removed recurring payment rule for "${payee || 'Item'}".`);
    
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Payment Rule Deleted', {
        body: `Recurring payment rule for "${payee || 'Item'}" was removed.`,
        icon: '/pwa-192x192.png'
      });
    }

    await refetch();
  };

  const handleExecuteNow = async (rule) => {
    setExecutingId(rule.id);
    setExecutedMsg(null);

    try {
      // 1. Post transaction directly into ledger
      const tx = {
        workspace_id: rule.workspace_id,
        account_id: rule.account_id,
        category_id: rule.category_id,
        amount: Number(rule.amount),
        transaction_type: rule.transaction_type || 'expense',
        status: 'completed',
        date: todayISO(),
        payee: rule.payee || 'Recurring Payment',
        notes: `Manually posted from recurring rule (${rule.frequency})`,
        tags: ['#recurring']
      };
      await storageApi.saveTransaction(tx);

      // 2. Advance next_run_date
      const currentNext = new Date(rule.next_run_date + 'T00:00:00');
      if (rule.frequency === 'daily') currentNext.setDate(currentNext.getDate() + 1);
      else if (rule.frequency === 'weekly') currentNext.setDate(currentNext.getDate() + 7);
      else if (rule.frequency === 'monthly') currentNext.setMonth(currentNext.getMonth() + 1);

      const year = currentNext.getFullYear();
      const month = String(currentNext.getMonth() + 1).padStart(2, '0');
      const day = String(currentNext.getDate()).padStart(2, '0');
      const newNextDate = `${year}-${month}-${day}`;

      await storageApi.saveEntity('recurring_rules', {
        ...rule,
        next_run_date: newNextDate
      });

      const successText = `Posted ₹${rule.amount} for "${rule.payee || 'Recurring Payment'}" to ledger! Next run date updated to ${newNextDate}.`;
      setExecutedMsg(successText);

      // 3. Post-execution Confirmation Notification
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Payment Successfully Posted!', {
          body: `₹${rule.amount} for "${rule.payee || 'Recurring Payment'}" posted to ledger. Account balance updated.`,
          icon: '/pwa-192x192.png'
        });
      }

      await refetch();
    } catch (err) {
      alert('Execution error: ' + err.message);
    } finally {
      setExecutingId(null);
    }
  };

  const getDueStatus = (nextRunDate) => {
    const today = todayISO();
    if (nextRunDate === today) {
      return { label: 'Payment Due Today!', color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' };
    }
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    const tomISO = tom.toISOString().split('T')[0];
    if (nextRunDate === tomISO) {
      return { label: 'Due Tomorrow', color: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30' };
    }
    if (nextRunDate < today) {
      return { label: 'Overdue — Pending Review', color: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30' };
    }
    return { label: `Scheduled: ${nextRunDate}`, color: 'bg-muted text-muted-foreground border-border' };
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-500" />
            <h1 className="text-2xl font-heading font-bold text-foreground">Manual Recurring Payments</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Payments are <strong>NEVER auto-posted</strong> without your explicit approval. Receive 3 pre-reminder notifications (Evening before, Night before, Morning of) and click "Post Payment Now" or "Delete".
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleTestNotification}
            className="px-3.5 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs"
            title="Fire an instant test notification to check browser and mobile phone notification shade"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Test Notification</span>
          </button>

          {notifPermission !== 'granted' && (
            <button
              onClick={requestNotificationPermission}
              className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs"
              title="Enable 3-stage pre-reminder notifications on mobile & laptop"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Enable 3-Stage Notifications</span>
            </button>
          )}

          <button
            onClick={() => { setEditingRule(null); setShowModal(true); }}
            className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-xs flex items-center gap-2 hover:opacity-90 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Rule</span>
          </button>
        </div>
      </div>

      {executedMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-medium">{executedMsg}</span>
          </div>
          <button onClick={() => setExecutedMsg(null)} className="text-xs hover:underline opacity-80">Dismiss</button>
        </div>
      )}

      {/* RULES GRID */}
      {recurringRules.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center space-y-3">
          <Repeat className="w-8 h-8 text-muted-foreground mx-auto" />
          <h3 className="font-heading font-bold text-base text-foreground">No Recurring Payment Rules</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Set up rules for subscriptions, bills, or SIPs. You will receive 3 pre-reminders before any payment date and control when to post or delete.
          </p>
          <button
            onClick={() => { setEditingRule(null); setShowModal(true); }}
            className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-xs inline-flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Rule</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {recurringRules.map(rule => {
            const dueInfo = getDueStatus(rule.next_run_date);

            return (
              <div key={rule.id} className={`bg-card border rounded-2xl p-5 space-y-4 shadow-sm relative transition-all ${
                rule.is_active ? 'border-border' : 'border-border/40 opacity-60'
              }`}>
                {/* DUE BADGE */}
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${dueInfo.color}`}>
                    {dueInfo.label}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setEditingRule(rule); setShowModal(true); }}
                      className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                      title="Edit rule"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id, rule.payee)}
                      className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                      title="Delete / Remove payment rule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                    {rule.frequency} • {rule.transaction_type}
                  </span>
                  <h3 className="font-semibold text-base text-foreground">{rule.payee || 'Recurring Payment'}</h3>
                  <p className="text-2xl font-bold font-mono text-foreground pt-1">{formatMoney(rule.amount)}</p>
                  <p className="text-xs text-muted-foreground">
                    {accMap.get(rule.account_id) || 'Account'} • {catMap.get(rule.category_id) || 'Uncategorized'}
                  </p>
                </div>

                {/* MANUAL ACTION BUTTONS */}
                <div className="pt-3 border-t border-border flex items-center justify-between gap-2 text-xs">
                  <button
                    onClick={() => handleToggleActive(rule)}
                    className={`px-2.5 py-1 rounded-lg font-mono text-[10px] font-semibold ${
                      rule.is_active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {rule.is_active ? 'ACTIVE' : 'PAUSED'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDelete(rule.id, rule.payee)}
                      className="px-2.5 py-1.5 border border-destructive/30 hover:bg-destructive/10 text-destructive rounded-xl font-medium text-[11px] transition-colors"
                      title="If payment was not made, remove it"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => handleExecuteNow(rule)}
                      disabled={executingId === rule.id}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] active:scale-95"
                      title="Manually post this payment to ledger and advance next run date"
                    >
                      <Send className="w-3 h-3" />
                      <span>Post Payment Now</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <RecurringFormDialog
          initialData={editingRule}
          onClose={() => { setShowModal(false); setEditingRule(null); }}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}
