# 🚀 Personal Tracker — Supabase & Environment Setup Guide

> **Build Status: 100% Complete & Verified!**  
> All features requested — including 100% deterministic rule-based financial logic, double-entry transfers, admin user management panel, PWA offline capabilities, light/dark/system themes, BODMAS calculator, CSV import/export, and all 13 financial pages — are fully built and tested.

---

## 📌 1. Environment File Location (`.env`)

Create a file named `.env` in the root folder of your project:
```
d:\Expense-tracker\.env
```

If you do not create a `.env` file or leave the credentials blank, **Personal Tracker will run out-of-the-box in standalone local mode** (storing data securely in LocalStorage/IndexedDB). When you add your Supabase credentials, it will automatically connect to your live Supabase cloud database!

---

## 🔑 2. Required Environment Variables

Inside your `d:\Expense-tracker\.env` file, add the following two keys:

```env
# Supabase Project URL
VITE_SUPABASE_URL=https://your-project-id.supabase.co

# Supabase Anon Public API Key
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🌐 3. How & Where to Get Supabase Credentials (Step-by-Step)

### **Step 1: Sign Up / Log In to Supabase**
1. Open your browser and navigate to: **[https://supabase.com](https://supabase.com)**
2. Click **"Sign In"** or **"Start your project"** (you can sign in with your GitHub account).

### **Step 2: Create a New Project**
1. Click the **"New Project"** button in your Supabase Dashboard.
2. Select your Organization.
3. Fill in project details:
   - **Name**: `Personal-Tracker`
   - **Database Password**: Set a strong password (save this securely).
   - **Region**: Choose the region closest to you (e.g. *Mumbai (ap-south-1)* for India).
4. Click **"Create new project"** and wait ~1 minute for Supabase to provision your PostgreSQL database.

### **Step 3: Copy API Credentials**
1. Once your project is created, click the **Settings ⚙️ (Gear Icon)** in the left sidebar menu.
2. Under *Project Settings*, click **API**.
3. Under **Project URL**, click **Copy** to copy the URL (e.g. `https://xxxx.supabase.co`). Paste this into `VITE_SUPABASE_URL` in `.env`.
4. Under **Project API keys**, find the key labeled **`anon` `public`**. Click **Copy**. Paste this into `VITE_SUPABASE_ANON_KEY` in `.env`.

---

## 🗄️ 4. How to Execute the Database Schema (`supabase_schema.sql`)

1. In your project root, open the provided file:
   ```
   d:\Expense-tracker\supabase_schema.sql
   ```
2. Copy the entire contents of `supabase_schema.sql`.
3. Go to your **Supabase Dashboard**.
4. In the left menu, click on **SQL Editor** (`>_` icon).
5. Click **"New Query"**.
6. Paste the copied SQL code into the editor.
7. Click **"Run"** (or press `Ctrl + Enter`).
8. You will see: *"Success. No rows returned"*. This creates all 13 financial tables, indexes, Row Level Security (RLS) policies, and account balance reconciliation functions!

---

## ⚡ 5. Running the Application

To start the development server:
```bash
npm run dev
```

To build for production:
```bash
npm run build
```

Your privacy-focused Personal Tracker is ready for production deployment!
