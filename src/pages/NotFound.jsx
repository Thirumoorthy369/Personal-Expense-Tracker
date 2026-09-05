import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Home, LayoutDashboard, Receipt, BarChart3 } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 sm:p-6">
      <div className="bg-card border border-border rounded-3xl p-8 max-w-lg w-full text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mx-auto shadow-inner">
          <HelpCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 bg-muted text-muted-foreground font-mono font-bold text-xs rounded-full border border-border">
            HTTP 404 NOT FOUND
          </span>
          <h1 className="text-3xl font-heading font-bold text-foreground">Page Not Found</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The requested page URL or financial record does not exist, has been removed, or was typed incorrectly.
          </p>
        </div>

        <div className="p-4 bg-muted/20 border border-border rounded-2xl space-y-3">
          <p className="text-xs font-semibold text-foreground">Quick Navigation Shortcuts</p>
          <div className="grid grid-cols-3 gap-2">
            <Link
              to="/"
              className="p-2.5 bg-card hover:bg-muted border border-border rounded-xl text-xs font-medium flex flex-col items-center gap-1.5 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-primary" />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/transactions"
              className="p-2.5 bg-card hover:bg-muted border border-border rounded-xl text-xs font-medium flex flex-col items-center gap-1.5 transition-colors"
            >
              <Receipt className="w-4 h-4 text-primary" />
              <span>Ledger</span>
            </Link>

            <Link
              to="/reports"
              className="p-2.5 bg-card hover:bg-muted border border-border rounded-xl text-xs font-medium flex flex-col items-center gap-1.5 transition-colors"
            >
              <BarChart3 className="w-4 h-4 text-primary" />
              <span>Reports</span>
            </Link>
          </div>
        </div>

        <div className="pt-2 flex justify-center">
          <Link
            to="/"
            className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-xs flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Home className="w-4 h-4" />
            <span>Return to Main Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
