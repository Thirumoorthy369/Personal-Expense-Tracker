import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeProvider';
import { AuthProvider } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';

import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { ScrollToTop } from './components/ScrollToTop';
import { ErrorBoundary } from './components/ErrorBoundary';

import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';

import { Dashboard } from './pages/Dashboard';
import { Accounts } from './pages/Accounts';
import { Transactions } from './pages/Transactions';
import { Budgets } from './pages/Budgets';
import { Reports } from './pages/Reports';
import { Cashflow } from './pages/Cashflow';
import { Recurring } from './pages/Recurring';
import { CalendarPage } from './pages/CalendarPage';
import { DebtsLoans } from './pages/DebtsLoans';
import { Bills } from './pages/Bills';
import { Yearly } from './pages/Yearly';
import { Calculator } from './pages/Calculator';
import { Automations } from './pages/Automations';
import { Settings } from './pages/Settings';
import { Admin } from './pages/Admin';
import { Unauthorized } from './pages/Unauthorized';
import { NotFound } from './pages/NotFound';

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <WorkspaceProvider>
            <BrowserRouter>
              <ScrollToTop />
              <Routes>
                {/* PUBLIC AUTH ROUTES */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* PROTECTED APP GROUP */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<Layout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/accounts" element={<Accounts />} />
                    <Route path="/transactions" element={<Transactions />} />
                    <Route path="/budgets" element={<Budgets />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/cashflow" element={<Cashflow />} />
                    <Route path="/recurring" element={<Recurring />} />
                    <Route path="/calendar" element={<CalendarPage />} />
                    <Route path="/debts-loans" element={<DebtsLoans />} />
                    <Route path="/bills" element={<Bills />} />
                    <Route path="/yearly" element={<Yearly />} />
                    <Route path="/calculator" element={<Calculator />} />
                    <Route path="/automations" element={<Automations />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/unauthorized" element={<Unauthorized />} />
                  </Route>
                </Route>

                {/* 404 NOT FOUND WILDCARD ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </WorkspaceProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
