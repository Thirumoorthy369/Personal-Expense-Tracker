import React, { useState } from 'react';
import { LegalTermsModal } from './LegalTermsModal';

export function AuthLayout({ children, title, subtitle }) {
  const [showLegalModal, setShowLegalModal] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mb-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-heading tracking-tight text-foreground font-semibold">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          {children}
        </div>
        <div className="text-center text-xs text-muted-foreground font-mono space-y-1">
          <p>Personal Tracker — 100% Deterministic & Privacy Focused</p>
          <button
            onClick={() => setShowLegalModal(true)}
            className="text-primary hover:underline text-[11px] font-sans font-medium"
          >
            Privacy Policy & Legal Terms
          </button>
        </div>

        <LegalTermsModal
          isOpen={showLegalModal}
          onClose={() => setShowLegalModal(false)}
        />
      </div>
    </div>
  );
}
