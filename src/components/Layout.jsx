import React, { useState, useEffect, useRef, useMemo } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { useWorkspaceData } from '../hooks/useWorkspaceData';
import { useTheme } from '../context/ThemeProvider';
import { NotificationsPanel } from './NotificationsPanel';
import { InviteMemberDialog } from './dialogs/InviteMemberDialog';
import { TransactionFormDialog } from './dialogs/TransactionFormDialog';
import { MonthlyDigestModal } from './MonthlyDigestModal';
import { todayISO, formatMoney } from '../lib/finance';
import { gsap } from 'gsap';
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  PieChart,
  BarChart3,
  Repeat,
  Calendar as CalendarIcon,
  TrendingUp,
  Calculator as CalcIcon,
  Sliders,
  ShieldAlert,
  Sun,
  Moon,
  Monitor,
  LogOut,
  Menu,
  X,
  Plus,
  UserPlus,
  Bell,
  ChevronDown,
  Sparkles,
  Landmark,
  FileSpreadsheet,
  Mail
} from 'lucide-react';

export function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const { workspaces, activeWorkspace, selectWorkspace, createWorkspace, isWorkspaceAdmin } = useWorkspace();
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showGlobalAddTxModal, setShowGlobalAddTxModal] = useState(false);
  const [showDigestModal, setShowDigestModal] = useState(false);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [showNewWsInput, setShowNewWsInput] = useState(false);

  const mainContentRef = useRef(null);

  // GSAP Smooth Route Entry Animation
  useEffect(() => {
    if (mainContentRef.current) {
      gsap.fromTo(
        mainContentRef.current,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
      );
    }
  }, [location.pathname]);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, badge: 'Overview' },
    { path: '/accounts', label: 'Accounts & Vaults', icon: Wallet },
    { path: '/transactions', label: 'Ledger', icon: Receipt },
    { path: '/budgets', label: 'Budgets & Goals', icon: PieChart },
    { path: '/reports', label: 'Reports & Analytics', icon: BarChart3 },
    { path: '/cashflow', label: 'Cashflow Trends', icon: TrendingUp },
    { path: '/recurring', label: 'Recurring Rules', icon: Repeat },
    { path: '/calendar', label: 'Heatmap Calendar', icon: CalendarIcon },
    { path: '/debts-loans', label: 'Debts & EMI', icon: Landmark },
    { path: '/bills', label: 'Bill Reminders', icon: Bell },
    { path: '/yearly', label: 'Yearly Overview', icon: FileSpreadsheet },
    { path: '/calculator', label: 'BODMAS Calculator', icon: CalcIcon },
    { path: '/automations', label: 'Automations', icon: Sparkles },
    { path: '/settings', label: 'Settings', icon: Sliders },
  ];

  if (isAdmin) {
    navItems.push({ path: '/admin', label: 'Admin Panel', icon: ShieldAlert, badge: 'Protected' });
  }

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    await createWorkspace(newWsName.trim());
    setNewWsName('');
    setShowNewWsInput(false);
    setShowWorkspaceMenu(false);
  };

  const { budgets, transactions, categories, bills, recurringRules } = useWorkspaceData();
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  const calculatedNotifCount = useMemo(() => {
    const today = todayISO();
    let count = 0;
    budgets.forEach(b => {
      const spent = transactions
        .filter(t => t.category_id === b.category_id && t.transaction_type === 'expense')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const percent = (spent / (Number(b.monthly_limit) || 1)) * 100;
      if (percent >= (Number(b.alert_threshold_percentage) || 80)) count++;
    });
    bills.forEach(bill => {
      if (bill.status !== 'paid') count++;
    });
    recurringRules.forEach(rule => {
      if (rule.is_active && rule.next_run_date <= today) count++;
    });
    return count;
  }, [budgets, transactions, categories, bills, recurringRules]);

  const displayCount = unreadNotifCount !== undefined ? unreadNotifCount : calculatedNotifCount;

  return (
    <div className="h-screen w-screen bg-background text-foreground flex overflow-hidden">
      {/* MOBILE BACKDROP OVERLAY */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* SIDEBAR CONTAINER (Fixed Height h-screen, Independent Scrollable Nav) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-sidebar text-sidebar-foreground border-r border-sidebar-border
        transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static flex flex-col h-screen shrink-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* 1. FIXED TOP HEADER (Logo + Workspace Switcher) */}
        <div className="p-4 border-b border-sidebar-border space-y-3 shrink-0 bg-sidebar/80 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 text-white flex items-center justify-center font-bold font-heading text-xl shadow-md shadow-emerald-500/20">
                ₹
              </div>
              <div>
                <h1 className="font-heading font-bold text-lg leading-none text-foreground tracking-tight">Personal Tracker</h1>
                <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold tracking-wider mt-0.5">100% Deterministic</p>
              </div>
            </div>
            <button onClick={() => setMobileOpen(false)} className="md:hidden p-1 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* WORKSPACE DROPDOWN */}
          <div className="relative">
            <button
              onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
              className="w-full flex items-center justify-between p-2.5 bg-sidebar-accent/60 hover:bg-sidebar-accent rounded-xl border border-sidebar-border text-xs transition-colors"
            >
              <div className="truncate text-left space-y-0.5">
                <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Active Workspace</p>
                <p className="font-semibold text-foreground truncate">{activeWorkspace?.name || 'Vault'}</p>
              </div>
              <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />
            </button>

            {showWorkspaceMenu && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-50 p-2 space-y-1">
                <p className="px-2 py-1 text-[10px] font-mono text-muted-foreground uppercase">Workspaces</p>
                {workspaces.map(ws => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      selectWorkspace(ws);
                      setShowWorkspaceMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeWorkspace?.id === ws.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    {ws.name}
                  </button>
                ))}

                {showNewWsInput ? (
                  <form onSubmit={handleCreateWorkspace} className="p-2 space-y-2 border-t border-border mt-1">
                    <input
                      type="text"
                      placeholder="Workspace Name"
                      value={newWsName}
                      onChange={(e) => setNewWsName(e.target.value)}
                      className="w-full px-2 py-1 text-xs bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      autoFocus
                    />
                    <div className="flex gap-1 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowNewWsInput(false)}
                        className="px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-2 font-medium py-0.5 text-[10px] bg-primary text-primary-foreground rounded-md"
                      >
                        Create
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setShowNewWsInput(true)}
                    className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-primary hover:bg-primary/10 rounded-lg transition-colors font-medium border-t border-border mt-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create New Workspace</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 2. ISOLATED SCROLLABLE NAVIGATION LINKS */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `
                  flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group
                  ${isActive
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white font-semibold shadow-md shadow-emerald-500/20 translate-x-1'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground hover:translate-x-1'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-black/20 text-white/90">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* 3. FIXED BOTTOM FOOTER (Theme + User Account Controls) */}
        <div className="p-4 border-t border-sidebar-border shrink-0 bg-sidebar/80 backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between text-xs">
            {isWorkspaceAdmin && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs font-medium transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invite</span>
              </button>
            )}

            {/* Theme Selector */}
            <div className="relative">
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-sidebar-accent/80 hover:bg-sidebar-accent rounded-lg text-xs text-sidebar-foreground font-medium transition-colors"
              >
                {theme === 'dark' ? <Moon className="w-3.5 h-3.5 text-amber-400" /> :
                 theme === 'light' ? <Sun className="w-3.5 h-3.5 text-amber-500" /> :
                 <Monitor className="w-3.5 h-3.5 text-blue-400" />}
                <span className="capitalize">{theme}</span>
              </button>

              {showThemeMenu && (
                <div className="absolute bottom-full right-0 mb-1 w-32 bg-card border border-border rounded-xl shadow-xl z-50 p-1 space-y-0.5 text-xs">
                  <button
                    onClick={() => { setTheme('light'); setShowThemeMenu(false); }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted text-foreground"
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>Light</span>
                  </button>
                  <button
                    onClick={() => { setTheme('dark'); setShowThemeMenu(false); }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted text-foreground"
                  >
                    <Moon className="w-3.5 h-3.5 text-amber-400" />
                    <span>Dark</span>
                  </button>
                  <button
                    onClick={() => { setTheme('system'); setShowThemeMenu(false); }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted text-foreground"
                  >
                    <Monitor className="w-3.5 h-3.5 text-blue-400" />
                    <span>System</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-sidebar-border/50">
            <div className="truncate space-y-0.5">
              <p className="text-xs font-semibold text-foreground truncate">{user?.display_name || user?.email}</p>
              <p className="text-[10px] font-mono text-muted-foreground truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT CONTAINER (Independent Scrollable Container) */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* TOP MOBILE & DESKTOP NAVBAR */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border px-4 md:px-8 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-xl hover:bg-muted text-foreground border border-border"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <span className="text-[10px] font-mono text-muted-foreground">Workspace /</span>
              <h2 className="text-sm font-semibold text-foreground">{activeWorkspace?.name || 'Vault'}</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDigestModal(true)}
              className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-primary/20"
              title="Open Automated Monthly Digest & Summary"
            >
              <Mail className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Monthly Digest</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-xl hover:bg-muted text-foreground relative transition-colors border border-border/50 cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {displayCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-rose-500 text-white font-mono font-bold text-[9px] leading-4 text-center rounded-full shadow-sm animate-pulse">
                    {displayCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <NotificationsPanel
                  onClose={() => setShowNotifications(false)}
                  onCountChange={(count) => setUnreadNotifCount(count)}
                />
              )}
            </div>
          </div>
        </header>

        {/* INDEPENDENT SCROLLABLE PAGE BODY */}
        <main ref={mainContentRef} className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl w-full mx-auto min-w-0 space-y-6">
          <Outlet />
        </main>
      </div>

      {/* GLOWING MOBILE ONLY FLOATING ACTION BUTTON (+ FAB) — HIDDEN ON DESKTOP WEBSITES */}
      <button
        onClick={() => setShowGlobalAddTxModal(true)}
        className="md:hidden fixed bottom-6 right-6 z-40 p-4 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white rounded-full shadow-2xl shadow-emerald-600/40 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center border-2 border-white/30"
        title="Add Mobile Transaction"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      {showInviteModal && <InviteMemberDialog onClose={() => setShowInviteModal(false)} />}
      {showGlobalAddTxModal && (
        <TransactionFormDialog
          onClose={() => setShowGlobalAddTxModal(false)}
          onSuccess={() => {
            setShowGlobalAddTxModal(false);
          }}
        />
      )}

      <MonthlyDigestModal
        isOpen={showDigestModal}
        onClose={() => setShowDigestModal(false)}
      />
    </div>
  );
}
