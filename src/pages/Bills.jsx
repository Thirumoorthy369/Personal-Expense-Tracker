import React, { useState } from 'react';
import { useWorkspaceData } from '../hooks/useWorkspaceData';
import { useWorkspace } from '../context/WorkspaceContext';
import { storageApi } from '../lib/storage';
import { formatMoney, todayISO } from '../lib/finance';
import { BillReminderFormDialog } from '../components/dialogs/BillReminderFormDialog';
import { Bell, Plus, CheckCircle, Clock, AlertTriangle, Edit2, Trash2 } from 'lucide-react';

export function Bills() {
  const { isWorkspaceAdmin } = useWorkspace();
  const { bills, categories, refetch } = useWorkspaceData();

  const [showModal, setShowModal] = useState(false);
  const [editingBill, setEditingBill] = useState(null);

  const catMap = new Map(categories.map(c => [c.id, c.name]));
  const today = todayISO();

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this bill reminder?')) return;
    await storageApi.deleteEntity('bill_reminders', id);
    await refetch();
  };

  const handleToggleStatus = async (bill) => {
    const nextStatus = bill.status === 'paid' ? 'pending' : 'paid';
    await storageApi.saveEntity('bill_reminders', {
      ...bill,
      status: nextStatus
    });
    await refetch();
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-heading font-bold text-foreground">Subscriptions & Bill Reminders</h1>
          <p className="text-xs text-muted-foreground">Keep track of upcoming utility bills, insurance premiums, and streaming subscriptions</p>
        </div>

        <button
          onClick={() => { setEditingBill(null); setShowModal(true); }}
          className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-xs flex items-center gap-2 hover:opacity-90 shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Bill</span>
        </button>
      </div>

      {/* BILLS LIST */}
      {bills.length === 0 ? (
        <div className="bg-card border border-border border-dashed rounded-2xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Bell className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading font-semibold text-base text-foreground">No Bills or Reminders Tracked</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Never miss a bill payment date! Track electricity bills, internet, insurance premiums, and subscriptions.
            </p>
          </div>
          <button
            onClick={() => { setEditingBill(null); setShowModal(true); }}
            className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-xs inline-flex items-center gap-2 hover:opacity-90 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Bill Reminder</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bills.map(bill => {
            const isOverdue = bill.status !== 'paid' && bill.due_date < today;
            const isPaid = bill.status === 'paid';

            return (
              <div key={bill.id} className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm relative group">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">{bill.title}</h3>
                    <p className="text-[10px] font-mono text-muted-foreground">{catMap.get(bill.category_id) || 'General Bill'} • {bill.frequency}</p>
                  </div>

                  <div className="flex items-center gap-1 opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditingBill(bill); setShowModal(true); }}
                      className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
                      title="Edit Bill"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(bill.id)}
                      className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors cursor-pointer"
                      title="Delete Bill"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-2xl font-bold font-mono text-foreground">{formatMoney(bill.amount)}</p>
                  <p className="text-xs font-mono text-muted-foreground">Due Date: {bill.due_date}</p>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold uppercase flex items-center gap-1 ${
                    isPaid ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                    isOverdue ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                    'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  }`}>
                    {isPaid ? <CheckCircle className="w-3 h-3" /> : isOverdue ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    <span>{isPaid ? 'PAID' : isOverdue ? 'OVERDUE' : 'PENDING'}</span>
                  </span>

                  <button
                    onClick={() => handleToggleStatus(bill)}
                    className="px-3 py-1 bg-muted hover:bg-primary/10 text-foreground hover:text-primary rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  >
                    Mark as {isPaid ? 'Pending' : 'Paid'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <BillReminderFormDialog
          initialData={editingBill}
          onClose={() => { setShowModal(false); setEditingBill(null); }}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}
