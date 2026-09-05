# 📥 How to Import Your Existing Data into Personal Tracker

You can easily import all your existing expenses, income, savings, investments, and custom categories into **Personal Tracker** using either **CSV Upload** or **JSON Database Restore**.

---

## 📊 Method 1: CSV Import (Recommended for Excel / CSV Data)

If your previous expense tracker allows exporting to CSV or Excel (or if you have a spreadsheet):

### **Step 1: Export your previous data to CSV**
Make sure your CSV file has headers such as:
`Date`, `Amount`, `Payee` (or Description), `Category`, `Type` (Income/Expense/Savings/Investment).

---

### **Step 2: Open the CSV Importer in Personal Tracker**
1. In Personal Tracker, click **Ledger** (`/transactions`) in the left sidebar menu.
2. Click the **"Import CSV"** button at the top right of the page.

---

### **Step 3: Upload & Map Columns**
1. Click **"Browse CSV File"** and select your CSV file.
2. Map the columns:
   - **Date Column**: Select your CSV date field.
   - **Amount Column**: Select your CSV amount field.
   - **Payee Column**: Select payee/merchant field.
   - **Type Column**: Select income/expense type field.
3. Select your target **Account** and default **Category**.
4. Click **"Import Items"**.

> **Result:** All your transactions will be bulk imported into your ledger, and account balances will automatically reconcile!

---

## 🗄️ Method 2: Custom Category Creation

If you have custom categories from your old tracker:
1. Go to **Settings** (`/settings`) or click **"+ New Category"** in the transaction modal.
2. Enter the Category Name (e.g., *Vacation, Subscriptions, Fuel, Shopping*).
3. Choose the Category Type (*Expense, Income, Savings, or Investment*).
4. Pick a color badge and click **Save Category**.

---

## 💾 Method 3: JSON Database Backup & Restore

If you exported a full database JSON file:
1. Go to **Settings** (`/settings`).
2. Scroll to **Data Privacy & JSON Backup**.
3. You can backup your current database anytime or restore full JSON objects for accounts, categories, and transactions.
