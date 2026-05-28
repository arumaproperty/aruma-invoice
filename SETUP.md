# Aruma Invoice — Backend Setup

## What this is

Next.js app version of the invoice generator with:
- **Google Sheets** as the database (invoices + clients)
- **Auto invoice numbering** (ARU-2026-001, ARU-2026-002…)
- **Invoice history page** (`/invoices`)
- **Client database** — save and auto-fill client details
- **Email delivery** via Resend

---

## Step 1 — Google Sheets setup (10 min)

### 1a. Create the spreadsheet

Go to [sheets.google.com](https://sheets.google.com) and create a new sheet.
Name it `Aruma Invoices`. Copy the Sheet ID from the URL — it's the long string between `/d/` and `/edit`.

Example URL: `https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit`
→ Sheet ID: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms`

### 1b. Create the three sheets (tabs)

At the bottom of the spreadsheet, create three tabs named exactly:

**Invoices** — add these headers in row 1:
```
id | invoiceNumber | dateIssued | dateDue | billTo | billCompany | billNpwp | billEmail | items | paidItems | terms | total | status | createdAt
```

**Clients** — add these headers in row 1:
```
id | name | company | npwp | email | phone | createdAt
```

**Settings** — add this in row 1:
```
lastInvoiceNumber | 0
```

### 1c. Create a Google Cloud Service Account

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (e.g. "Aruma Invoice")
3. Go to **APIs & Services → Library** → search "Google Sheets API" → Enable it
4. Go to **APIs & Services → Credentials → Create Credentials → Service Account**
5. Name it anything (e.g. "aruma-invoice") → Create
6. Click the service account → **Keys** tab → **Add Key → JSON**
7. A `.json` file downloads — open it

You need two values from this file:
- `client_email` → this is your `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `private_key` → this is your `GOOGLE_PRIVATE_KEY` (the whole thing including the `-----BEGIN...-----END-----` lines)

### 1d. Share the spreadsheet with the service account

In your Google Sheet, click **Share** and add the `client_email` address (e.g. `aruma-invoice@your-project.iam.gserviceaccount.com`) with **Editor** access.

---

## Step 2 — Resend setup (5 min)

1. Sign up at [resend.com](https://resend.com) (free)
2. Get your API key from the dashboard
3. If you have a domain (e.g. `aruma-bali.com`), add and verify it in Resend so emails come from `invoices@aruma-bali.com`
4. If not, emails will come from Resend's shared domain for now — works fine for testing

---

## Step 3 — Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GOOGLE_SHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms

RESEND_API_KEY=re_xxxxxxxxxxxxxx
RESEND_FROM_EMAIL=invoices@aruma-bali.com
```

**Important for the private key**: copy it exactly as it appears in the JSON file. In `.env.local` wrap it in double quotes and replace actual newlines with `\n`.

---

## Step 4 — Run locally

```bash
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000)

---

## Step 5 — Deploy to Vercel

1. Push this project to a new GitHub repo
2. Connect it to Vercel (or update your existing Vercel project to point to this repo)
3. In Vercel project settings → **Environment Variables**, add all four variables from Step 3
4. For `GOOGLE_PRIVATE_KEY` in Vercel: paste the raw key with real newlines (Vercel handles multi-line values fine)

---

## Update bank details

The bank details are hardcoded in `app/page.tsx` near the bottom of the `InvoicePreview` component.
Find the `inv-bank` section and update the account name and number.

---

## Invoice numbering

Format: `ARU-YYYY-NNN` (e.g. `ARU-2026-001`)

The counter is stored in the **Settings** sheet. If you want to start from a specific number (e.g. 10), change the value in Settings row 1 from `0` to `9` — the next invoice will be `ARU-2026-010`.

You can also override the auto-assigned number by typing your own in the Invoice Number field before saving.
