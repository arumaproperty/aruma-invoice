import { google } from 'googleapis';
import { Invoice, Client } from '@/types/invoice';

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

function getSheets() {
  return google.sheets({ version: 'v4', auth: getAuth() });
}

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

// ─── Invoice operations ───────────────────────────────────────────────────────

export async function listInvoices(): Promise<Invoice[]> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Invoices!A2:N',
  });
  const rows = res.data.values ?? [];
  return rows.map(rowToInvoice).filter(Boolean) as Invoice[];
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const all = await listInvoices();
  return all.find(inv => inv.id === id) ?? null;
}

export async function saveInvoice(invoice: Invoice): Promise<void> {
  const sheets = getSheets();
  const row = invoiceToRow(invoice);
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'Invoices!A:N',
    valueInputOption: 'RAW',
    requestBody: { values: [row] },
  });
}

export async function updateInvoice(id: string, updates: Partial<Invoice>): Promise<void> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Invoices!A2:N',
  });
  const rows = res.data.values ?? [];
  const rowIndex = rows.findIndex(r => r[0] === id);
  if (rowIndex === -1) throw new Error('Invoice not found');

  const existing = rowToInvoice(rows[rowIndex])!;
  const updated = { ...existing, ...updates };
  const newRow = invoiceToRow(updated);
  const sheetRow = rowIndex + 2;

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `Invoices!A${sheetRow}:N${sheetRow}`,
    valueInputOption: 'RAW',
    requestBody: { values: [newRow] },
  });
}

// ─── Invoice number counter ───────────────────────────────────────────────────

export async function nextInvoiceCounter(): Promise<number> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Settings!A:B',
  });
  const rows = res.data.values ?? [];
  const idx = rows.findIndex(r => r[0] === 'lastInvoiceNumber');
  const current = idx >= 0 ? parseInt(rows[idx][1] ?? '0', 10) : 0;
  const next = current + 1;
  const sheetRow = idx >= 0 ? idx + 1 : rows.length + 1;

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `Settings!A${sheetRow}:B${sheetRow}`,
    valueInputOption: 'RAW',
    requestBody: { values: [['lastInvoiceNumber', next]] },
  });
  return next;
}

// ─── Client operations ────────────────────────────────────────────────────────

export async function listClients(): Promise<Client[]> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Clients!A2:G',
  });
  const rows = res.data.values ?? [];
  return rows.map(rowToClient).filter(Boolean) as Client[];
}

export async function saveClient(client: Client): Promise<void> {
  const sheets = getSheets();
  const row = [
    client.id, client.name, client.company, client.npwp,
    client.email, client.phone, client.createdAt,
  ];
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'Clients!A:G',
    valueInputOption: 'RAW',
    requestBody: { values: [row] },
  });
}

// ─── Row converters ───────────────────────────────────────────────────────────

function invoiceToRow(inv: Invoice): string[] {
  return [
    inv.id,
    inv.invoiceNumber,
    inv.dateIssued,
    inv.dateDue,
    inv.billTo,
    inv.billCompany,
    inv.billNpwp,
    inv.billEmail,
    JSON.stringify(inv.items),
    JSON.stringify(inv.paidItems),
    JSON.stringify(inv.terms),
    String(inv.total),
    inv.status,
    inv.createdAt,
  ];
}

function rowToInvoice(row: string[]): Invoice | null {
  if (!row[0]) return null;
  try {
    return {
      id: row[0],
      invoiceNumber: row[1] ?? '',
      dateIssued: row[2] ?? '',
      dateDue: row[3] ?? '',
      billTo: row[4] ?? '',
      billCompany: row[5] ?? '',
      billNpwp: row[6] ?? '',
      billEmail: row[7] ?? '',
      items: JSON.parse(row[8] ?? '[]'),
      paidItems: JSON.parse(row[9] ?? '[]'),
      terms: JSON.parse(row[10] ?? '[]'),
      total: parseFloat(row[11] ?? '0'),
      status: (row[12] as Invoice['status']) ?? 'draft',
      createdAt: row[13] ?? '',
    };
  } catch {
    return null;
  }
}

function rowToClient(row: string[]): Client | null {
  if (!row[0]) return null;
  return {
    id: row[0],
    name: row[1] ?? '',
    company: row[2] ?? '',
    npwp: row[3] ?? '',
    email: row[4] ?? '',
    phone: row[5] ?? '',
    createdAt: row[6] ?? '',
  };
}
