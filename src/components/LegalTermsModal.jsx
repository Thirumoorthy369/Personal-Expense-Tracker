import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck, FileText, Cookie, Info, Mail, Clock, Copy, Check } from 'lucide-react';

export function LegalTermsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('privacy');
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('mr.thirumoorthys@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

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

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative z-[10000]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-semibold text-foreground">Privacy & Legal Information</h2>
              <p className="text-xs text-muted-foreground">Compliance, Data Handling, Terms & Legal Contacts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-border bg-muted/20 px-6 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'privacy'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Privacy Policy</span>
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'terms'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Terms of Service</span>
          </button>

          <button
            onClick={() => setActiveTab('cookies')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'cookies'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Cookie className="w-4 h-4" />
            <span>Cookie Policy</span>
          </button>

          <button
            onClick={() => setActiveTab('contacts')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'contacts'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>Version & Legal Contact</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-foreground/90 leading-relaxed max-h-[60vh]">
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-primary font-medium">
                <strong>Plain Language Summary:</strong> We collect only minimal operational data necessary to track your financial transactions, accounts, and budgets. We never sell, rent, or share your data with third-party ad networks or data brokers.
              </div>

              <div>
                <h3 className="font-semibold text-sm text-foreground mb-1">1. Data Collected</h3>
                <p className="text-muted-foreground">
                  User email address, display name, workspace details, and financial entries (transactions, categories, budgets, recurring rules, debts, and bills).
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-foreground mb-1">2. Purpose & Usage</h3>
                <p className="text-muted-foreground">
                  Data is processed strictly to render your personal financial dashboard, compute ledger totals, send budget alerts, and generate analytics.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-foreground mb-1">3. Data Retention & Deletion</h3>
                <p className="text-muted-foreground">
                  Your data is stored for as long as your account remains active. You can export your data at any time via Settings or request complete account wiping by contacting our legal team.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-sm text-foreground mb-1">1. User Responsibilities</h3>
                <p className="text-muted-foreground">
                  You are responsible for keeping your login credentials confidential and for all financial records entered into your workspace.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-foreground mb-1">2. Acceptable Use</h3>
                <p className="text-muted-foreground">
                  Personal Tracker is designed for personal expense tracking and financial planning. Automated scraping, malicious payload submission, or attempts to breach user isolation are strictly prohibited.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-foreground mb-1">3. Limitation of Liability</h3>
                <p className="text-muted-foreground">
                  Calculations, budgets, and visual metrics are provided for self-management reference. Personal Tracker does not provide certified accounting, tax, or legal financial advice.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'cookies' && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/40 rounded-xl border border-border text-muted-foreground">
                We only use essential functional cookies and local browser storage. No tracking or ad analytics cookies are deployed.
              </div>

              <div>
                <h3 className="font-semibold text-sm text-foreground mb-1">Essential Cookies & Storage Keys</h3>
                <ul className="list-disc pl-4 space-y-1 text-muted-foreground mt-2">
                  <li><code className="text-primary bg-primary/10 px-1 py-0.5 rounded">sb-*-auth-token</code>: Secure authentication JWT session token.</li>
                  <li><code className="text-primary bg-primary/10 px-1 py-0.5 rounded">pt_current_user</code>: Stores user identity state in offline fallback mode.</li>
                  <li><code className="text-primary bg-primary/10 px-1 py-0.5 rounded">pt_theme</code>: Saves your preferred Dark/Light theme mode.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-foreground mb-1">User Control</h3>
                <p className="text-muted-foreground">
                  You can clear these cookies at any time through your browser's site settings. Doing so will log you out of active sessions.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-muted/30 border border-border rounded-xl">
                <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground">Dedicated Legal & Privacy Contact</h4>
                  <p className="text-muted-foreground text-xs mt-0.5">For privacy requests, GDPR data export, or legal notices, contact:</p>
                  <div className="flex items-center gap-2 mt-2">
                    <a
                      href="mailto:mr.thirumoorthys@gmail.com?subject=Legal%20%26%20Privacy%20Inquiry%20-%20Personal%20Tracker"
                      className="text-primary font-medium hover:underline text-xs bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20 flex items-center gap-1.5 transition-colors"
                      title="Click to compose email"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>mr.thirumoorthys@gmail.com</span>
                    </a>
                    <button
                      onClick={handleCopyEmail}
                      className="p-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-[11px]"
                      title="Copy email address"
                    >
                      {copiedEmail ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-500 font-semibold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-muted/30 border border-border rounded-xl">
                <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground">Session Expiration & Inactivity Timeout</h4>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    <strong>Cloud Authentication:</strong> Inactive sessions remain valid for up to <strong>7 Days</strong> before requiring re-authentication.
                  </p>
                  <p className="text-muted-foreground text-xs mt-1">
                    <strong>Local Offline Mode:</strong> Persists until manual logout or browser cache clearing.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-border flex justify-between text-[11px] text-muted-foreground">
                <span>Last Updated: September 5, 2026</span>
                <span>Version 1.0.0 (Baseline Release)</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border bg-muted/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:opacity-90 transition-opacity"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
