import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home, Mail } from 'lucide-react';

export function Unauthorized() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 sm:p-6">
      <div className="bg-card border border-rose-500/30 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 bg-rose-500/10 text-rose-500 font-mono font-bold text-xs rounded-full border border-rose-500/20">
            HTTP 403 FORBIDDEN
          </span>
          <h1 className="text-2xl font-heading font-bold text-foreground">Access Restricted</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            You do not have administrator privileges to view this section. This resource is restricted to system administrators (`mr.thirumoorthys@gmail.com`) and workspace owners.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Home className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>

          <a
            href="mailto:mr.thirumoorthys@gmail.com?subject=Access%20Request%20-%20Personal%20Tracker"
            className="px-5 py-2.5 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-xl text-xs flex items-center justify-center gap-2 border border-border transition-colors"
          >
            <Mail className="w-4 h-4" />
            <span>Request Access</span>
          </a>
        </div>
      </div>
    </div>
  );
}
