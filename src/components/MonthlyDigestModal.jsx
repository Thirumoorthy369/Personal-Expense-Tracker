import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useWorkspaceData } from '../hooks/useWorkspaceData';
import { formatMoney, monthKey, monthLabel } from '../lib/finance';
import { X, Mail, Download, Copy, Check, Calendar, TrendingUp, TrendingDown, AlertCircle, Sparkles } from 'lucide-react';

export function MonthlyDigestModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const { transactions, bills } = useWorkspaceData();

  const [copied, setCopied] = useState(false);
  const currentMonth = monthKey();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Monthly stats
  const monthTx = transactions.filter(t => t.date?.startsWith(currentMonth));
  const incomeSum = monthTx.filter(t => t.transaction_type === 'income').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const expenseSum = monthTx.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const netSavings = incomeSum - expenseSum;
  const savingsRate = incomeSum > 0 ? Math.max(0, Math.round((netSavings / incomeSum) * 100)) : 0;

  // Overdue / upcoming bills
  const activeBills = bills.filter(b => b.is_active);
  const overdueBills = activeBills.filter(b => b.due_date && b.due_date < new Date().toISOString().split('T')[0]);
  const upcomingBills = activeBills.filter(b => b.due_date && b.due_date >= new Date().toISOString().split('T')[0]);

  // Recipient email
  const recipientEmail = user?.email || 'mr.thirumoorthys@gmail.com';
  const recipientName = user?.display_name || user?.email?.split('@')[0] || 'Member';

  // Email Body Text
  const emailSubject = encodeURIComponent(`Monthly Financial Summary - ${monthLabel(currentMonth)} (${recipientName})`);
  const emailBodyText = `
Hi ${recipientName},

Here is your Automated Monthly Financial Summary for ${monthLabel(currentMonth)}:

📊 FINANCIAL OVERVIEW:
------------------------------------------
• Total Monthly Income:   ₹${incomeSum.toLocaleString('en-IN')}
• Total Monthly Expenses: ₹${expenseSum.toLocaleString('en-IN')}
• Net Monthly Savings:    ₹${netSavings.toLocaleString('en-IN')}
• Savings Rate:          ${savingsRate}%

⚠️ BILL REMINDERS & ALERTS:
------------------------------------------
• Overdue Bills:          ${overdueBills.length} item(s)
• Upcoming Bills:         ${upcomingBills.length} item(s)

Generate automated records directly from Personal Tracker.
Contact: mr.thirumoorthys@gmail.com
`.trim();

  const mailtoUrl = `mailto:${recipientEmail}?subject=${emailSubject}&body=${encodeURIComponent(emailBodyText)}`;

  const handleCopyText = () => {
    navigator.clipboard.writeText(emailBodyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReport = () => {
    const element = document.createElement('a');
    const file = new Blob([emailBodyText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Financial_Digest_${currentMonth}_${recipientName}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative z-[10000] flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-semibold text-foreground">Automated Monthly Financial Digest</h2>
              <p className="text-xs text-muted-foreground">Tailored summary & bill reminders for {recipientName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-primary flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="font-semibold">{monthLabel(currentMonth)} Monthly Digest</span>
            </div>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-card rounded-md border border-primary/20">
              {recipientEmail}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted/30 border border-border rounded-xl space-y-1">
              <span className="text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                Monthly Income
              </span>
              <p className="text-base font-bold font-mono text-emerald-500">{formatMoney(incomeSum)}</p>
            </div>

            <div className="p-3 bg-muted/30 border border-border rounded-xl space-y-1">
              <span className="text-muted-foreground flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                Monthly Expenses
              </span>
              <p className="text-base font-bold font-mono text-rose-500">{formatMoney(expenseSum)}</p>
            </div>
          </div>

          <div className="p-4 bg-muted/20 border border-border rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-medium">Net Savings:</span>
              <span className={`font-bold font-mono ${netSavings >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {formatMoney(netSavings)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-medium">Savings Rate:</span>
              <span className="font-bold font-mono text-primary">{savingsRate}%</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-medium">Bill Alerts:</span>
              <span className="font-bold font-mono text-amber-500">
                {overdueBills.length} Overdue / {upcomingBills.length} Upcoming
              </span>
            </div>
          </div>

          {/* Email Preview snippet */}
          <div className="space-y-1">
            <label className="text-muted-foreground font-medium text-[11px]">Formatted Digest Email Text:</label>
            <pre className="p-3 bg-card border border-border rounded-xl text-[11px] font-mono text-foreground whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
              {emailBodyText}
            </pre>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/30 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="px-3 py-2 bg-muted hover:bg-muted/80 border border-border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>

            <button
              onClick={handleDownloadReport}
              className="px-3 py-2 bg-muted hover:bg-muted/80 border border-border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>

          <a
            href={mailtoUrl}
            className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-xs flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Mail className="w-4 h-4" />
            <span>Send Email Summary</span>
          </a>
        </div>
      </div>
    </div>,
    document.body
  );
}
