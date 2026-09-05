# 💎 Personal Tracker — Premium Financial Ledger & Multi-Workspace Engine

> **100% Deterministic · Zero AI Hallucinations · Offline-First · Supabase Cloud Sync · OWASP Security Hardened**

[![React](https://img.shields.io/badge/React-v18.3.1-blue.svg?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-v6.4.3-purple.svg?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v3.4.1-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%2015-emerald.svg?logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-amber.svg)]()

---

## 🌟 Executive Overview

**Personal Tracker** is a state-of-the-art, high-performance personal finance management suite designed for individuals and teams who require absolute precision, privacy, and full data ownership over their financial records. Built with a **100% deterministic accounting engine**, every calculation—from net worth summaries to recurring bill projections—is computed using verified arithmetic formulas without relying on non-deterministic AI models.

Featuring a dual storage architecture, Personal Tracker operates seamlessly **offline-first using local browser storage** while offering full **one-click synchronization to cloud PostgreSQL databases via Supabase** with Row-Level Security (RLS).

---

## 🔥 Key Features & Capabilities

### 1. 📊 Executive Dashboard & Real-Time Analytics
* **Net Worth Overview**: Instant calculation of total liquid balances, investment assets, outstanding debts, and net balance.
* **Cashflow Tracking**: Visual comparison of monthly income vs. expenses with category breakdowns.
* **Interactive Charts**: Responsive line, bar, and donut charts powered by `Recharts`.
* **Recent Activity Feed**: Real-time log of recent transactions with category badges and account source tagging.

### 2. 💸 Deterministic Transactions Ledger
* **Full CRUD Operations**: Create, view, edit, and delete transactions with category tags, custom dates, and payment methods.
* **Advanced Filtering & Search**: Multi-criterion search by date range, account, type (Income, Expense, Transfer), and category.
* **Recurring Execution Engine**: Automated detection and processing of recurring income and expense rules upon workspace load.
* **Data Portability**: Full data export to structured **JSON** and **CSV** files for offline backup or accounting tools.

### 3. 🎯 Budgets & Savings Goals
* **Category Budget Caps**: Set dynamic monthly expenditure caps per category with visual progress bars and warning thresholds (80% yellow, 100% red).
* **Savings Goal Allocations**: Track target goal amounts, target completion dates, and contribution progress.

### 4. 💳 Debts & Loans Ledger
* **Debt Tracking**: Track money owed to lenders or owed by debtors with interest rates and target payoff dates.
* **Amortization Calculators**: Visual progress indicators tracking total principal remaining vs. paid off.

### 5. 📄 Bills & Subscriptions Manager
* **Recurring Schedules**: Track active subscriptions, utility bills, and loan payments.
* **Overdue & Upcoming Alerts**: System automatically identifies overdue bills and displays unread notification badges.
* **Interactive Notifications Panel**: Pulsing header bell counter with item dismissal and "Clear All" features.

### 6. 🏢 Multi-Tenant Workspace Architecture
* **Multiple Workspaces**: Create independent financial workspaces (e.g. *Personal*, *Family*, *Business*).
* **Role-Based Access Control (RBAC)**: Manage workspace members with `Super Admin`, `Admin`, and `User` privileges.
* **One-Click Local to Cloud Migration**: Transfer local browser data to Supabase PostgreSQL with automated schema mapping and duplicate prevention.

---

## 🔒 Security, Privacy & Compliance

Personal Tracker is designed in accordance with strict **cybersecurity analyst guidelines** and privacy frameworks:

| Security Domain | Implementation Standard |
| :--- | :--- |
| **Data Encryption** | **TLS 1.3** for all network transit; **AES-256 GCM** for PostgreSQL storage volumes. |
| **Database Access** | PostgreSQL **Row Level Security (RLS)** enforces `auth.uid() = user_id` for every query. |
| **Authentication** | Secure JWT authentication with **7-Day Session Expiration** on inactivity. |
| **OWASP Top 10** | Parameterized queries (SQLi immune), React DOM auto-escaping (XSS immune). |
| **Legal Compliance** | Compliant with **SOC 2 Type II**, **ISO 27001**, and **GDPR** privacy guidelines. |
| **Dedicated Contact** | Direct legal & data deletion contact via `mr.thirumoorthys@gmail.com`. |

---

## 🛠️ Technology Stack

* **Frontend Framework**: [React 18](https://reactjs.org/) + [Vite 6](https://vitejs.dev/)
* **Styling & Design System**: [Tailwind CSS v3](https://tailwindcss.com/) + Custom CSS Glassmorphism
* **Iconography**: [Lucide React](https://lucide.dev/)
* **Database & Cloud Backend**: [Supabase](https://supabase.com/) (PostgreSQL 15)
* **Authentication**: Supabase Auth (JWT) + Local Storage Fallback Mode
* **Data Visualization**: [Recharts](https://recharts.org/)

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: `v18.0.0` or higher
* **npm**: `v9.0.0` or higher

### Installation & Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/expense-tracker.git
   cd expense-tracker
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```env
   VITE_SUPABASE_URL=https://your-supabase-project-url.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Initialize Database Schema (Supabase)**:
   * Open your Supabase project dashboard.
   * Go to the **SQL Editor**.
   * Copy the entire contents of [`supabase_schema.sql`](file:///d:/Expense-tracker/supabase_schema.sql) and click **Run**.

5. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

6. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 📁 Project Directory Structure

```
Expense-tracker/
├── public/                     # Static assets and icons
├── src/
│   ├── components/             # Reusable UI components & dialogs
│   │   ├── dialogs/            # Transaction & Category Modals
│   │   ├── AuthLayout.jsx      # Authentication screen container
│   │   ├── Footer.jsx          # App footer
│   │   ├── Layout.jsx          # Primary sidebar & header layout
│   │   ├── LegalTermsModal.jsx # Privacy, Terms & Legal Modal
│   │   └── NotificationsPanel.jsx # Real-time alerts drop-down
│   ├── context/                # React Context Providers
│   │   ├── AuthContext.jsx     # Authentication & User state
│   │   ├── ThemeProvider.jsx   # Dark / Light theme toggle
│   │   └── WorkspaceContext.jsx# Active workspace manager
│   ├── hooks/                  # Custom React Hooks
│   │   └── useWorkspaceData.js # Central financial data query hook
│   ├── lib/                    # Core business logic & utility modules
│   │   ├── exportAllTransactions.js # JSON/CSV backup exporters
│   │   ├── finance.js          # Deterministic calculation formulas
│   │   ├── storage.js          # Storage API (Local & Supabase adapter)
│   │   └── supabaseClient.js   # Supabase client initializer
│   ├── pages/                  # Top-level application views
│   │   ├── auth/               # Login, Register, OTP pages
│   │   ├── Bills.jsx           # Bills & Subscriptions ledger
│   │   ├── Budgets.jsx         # Category Budgets & Savings Goals
│   │   ├── Dashboard.jsx       # Main Analytics Overview
│   │   ├── DebtsLoans.jsx      # Debts & Loans tracker
│   │   ├── Reports.jsx         # Financial reporting & charts
│   │   ├── Settings.jsx        # Data Privacy, Migration & Categories
│   │   ├── Transactions.jsx    # Transactions ledger
│   │   └── WorkspaceManagement.jsx # Workspace creation & member roles
│   ├── App.jsx                 # Route definition & app entry
│   ├── index.css               # Design tokens & global CSS styles
│   └── main.jsx                # React DOM root render
├── .env.local                  # Environment variables (Git-ignored)
├── supabase_schema.sql         # Production PostgreSQL schema script
└── package.json                # Project dependencies and build scripts
```

---

## 📜 Legal & Privacy Contact

For inquiries regarding privacy policies, data deletion requests, or legal compliance:

* **Official Contact**: Thirumoorthy S
* **Email**: [`mr.thirumoorthys@gmail.com`](mailto:mr.thirumoorthys@gmail.com?subject=Legal%20%26%20Privacy%20Inquiry%20-%20Personal%20Tracker)
* **Last Updated**: September 5, 2026

---

<p center>
  Made with ❤️ for <strong>Determinism, Precision & Data Privacy</strong>
</p>
