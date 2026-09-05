import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useWorkspaceData } from '../hooks/useWorkspaceData';
import { formatMoney, todayISO } from '../lib/finance';
import { AlertTriangle, Bell, Calendar, Repeat, CheckCircle, X, Trash2 } from 'lucide-react';

export function NotificationsPanel({ onClose, onCountChange }) {
  const { budgets, transactions, categories, bills, recurringRules } = useWorkspaceData();
  const panelRef = useRef(null);

  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      const raw = localStorage.getItem('pt_dismissed_notifs');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose?.();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const rawNotifications = useMemo(() => {
    const list = [];
    const today = todayISO();

    // 1. Budget Alerts
    const catMap = new Map(categories.map(c => [c.id, c.name]));
    budgets.forEach(b => {
      const catName = catMap.get(b.category_id) || 'Category';
      const spent = transactions
        .filter(t => t.category_id === b.category_id && t.transaction_type === 'expense')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      const percent = (spent / (Number(b.monthly_limit) || 1)) * 100;
      if (percent >= (Number(b.alert_threshold_percentage) || 80)) {
        list.push({
          id: 'b-alert-' + b.id,
          type: 'budget',
          title: `Budget Alert: ${catName}`,
          message: `Spent ${percent.toFixed(0)}% of limit (${formatMoney(spent)} / ${formatMoney(b.monthly_limit)})`,
          severity: percent >= 100 ? 'destructive' : 'warning',
          icon: AlertTriangle
        });
      }
    });

    // 2. Bill Reminders
    bills.forEach(bill => {
      if (bill.status !== 'paid') {
        const isOverdue = bill.due_date < today;
        list.push({
          id: 'bill-' + bill.id,
          type: 'bill',
          title: `${isOverdue ? 'Overdue' : 'Due Soon'}: ${bill.title}`,
          message: `${formatMoney(bill.amount)} due on ${bill.due_date}`,
          severity: isOverdue ? 'destructive' : 'info',
          icon: Calendar
        });
      }
    });

    // 3. Recurring Rules Due Today
    recurringRules.forEach(rule => {
      if (rule.is_active && rule.next_run_date <= today) {
        list.push({
          id: 'rec-' + rule.id,
          type: 'recurring',
          title: `Recurring Trigger Due: ${rule.payee || 'Rule'}`,
          message: `${formatMoney(rule.amount)} ready to execute`,
          severity: 'info',
          icon: Repeat
        });
      }
    });

    return list;
  }, [budgets, transactions, categories, bills, recurringRules]);

  const notifications = useMemo(() => {
    return rawNotifications.filter(n => !dismissedIds.includes(n.id));
  }, [rawNotifications, dismissedIds]);

  useEffect(() => {
    onCountChange?.(notifications.length);
  }, [notifications.length, onCountChange]);

  const handleDismissOne = (id) => {
    const next = [...dismissedIds, id];
    setDismissedIds(next);
    localStorage.setItem('pt_dismissed_notifs', JSON.stringify(next));
  };

  const handleClearAll = () => {
    const allIds = rawNotifications.map(n => n.id);
    setDismissedIds(allIds);
    localStorage.setItem('pt_dismissed_notifs', JSON.stringify(allIds));
  };

  return (
    <div ref={panelRef} className="absolute right-0 mt-2 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
      <div className="p-3 sm:p-4 border-b border-border flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-heading font-bold text-foreground">Notifications & Alerts</h3>
        </div>

        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-[10px] text-muted-foreground hover:text-destructive font-mono hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear All</span>
            </button>
          )}
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-mono font-bold">
            {notifications.length}
          </span>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground rounded-lg ml-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-border/40 p-1 custom-scrollbar">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground space-y-1">
            <CheckCircle className="w-6 h-6 mx-auto text-emerald-500 mb-1" />
            <p className="font-semibold text-foreground">All caught up!</p>
            <p className="text-[11px]">All budgets healthy & no pending bill alerts.</p>
          </div>
        ) : (
          notifications.map(item => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="p-3 hover:bg-muted/30 transition-colors flex items-start justify-between gap-3 group">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`p-2 rounded-xl shrink-0 ${
                    item.severity === 'destructive' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                    item.severity === 'warning' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                    'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5 text-xs min-w-0">
                    <p className="font-semibold text-foreground truncate">{item.title}</p>
                    <p className="text-muted-foreground leading-relaxed">{item.message}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleDismissOne(item.id)}
                  className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Dismiss notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
