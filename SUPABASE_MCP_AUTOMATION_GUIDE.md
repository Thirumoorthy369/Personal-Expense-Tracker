# 🤖 Automating Supabase with Antigravity & MCP

**YES! Absolutely!** Antigravity can connect to your Supabase project using **Supabase CLI** or **Supabase MCP / REST API** and execute all database creation, table migrations, and configuration **100% automatically** for you.

---

## ⚡ Option 1: Automatic Setup via Supabase Access Token (Fastest)

If you provide your **Supabase Personal Access Token** and **Project Reference ID**, Antigravity can execute `supabase_schema.sql` directly into your Supabase database in seconds!

### **Steps to get your Access Token:**
1. Open **[https://supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens)**.
2. Click **"Generate new token"**.
3. Name it `Antigravity` and copy the token string (starts with `sbp_...`).
4. Copy your **Project Ref** from your Supabase URL (e.g., if URL is `https://xyzabcdefg.supabase.co`, the ref is `xyzabcdefg`).

Once you share the token & project ref or add them to your `.env`:
```env
SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxxxxxxxxxx
SUPABASE_PROJECT_ID=xyzabcdefg
```
Antigravity will automatically run the migration command:
```bash
npx supabase db push --db-url "postgres://postgres:[YOUR-PASSWORD]@db.xyzabcdefg.supabase.co:5432/postgres"
```
or execute the SQL via Supabase Management API!

---

## 🛠️ Option 2: Connect Supabase MCP Server to Antigravity

Antigravity supports the **Model Context Protocol (MCP)**. You can add the official Supabase MCP server to your MCP configuration file:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--access-token",
        "YOUR_SUPABASE_PERSONAL_ACCESS_TOKEN"
      ]
    }
  }
}
```

Once connected, Antigravity gets direct tools to:
- 📊 Automatically apply `supabase_schema.sql` to your remote database.
- 🔒 Create and test Row Level Security (RLS) policies.
- 👥 Manage users and workspace roles directly.
- 🗄️ Inspect live database tables and execute queries.
