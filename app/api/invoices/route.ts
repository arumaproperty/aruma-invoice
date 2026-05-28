import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { listInvoices, saveInvoice, nextInvoiceCounter } from '@/lib/sheets';
import { buildInvoiceNumber } from '@/lib/format';
import { Invoice } from '@/types/invoice';

export async function GET() {
  try {
    const invoices = await listInvoices();
    return NextResponse.json(invoices);
  } catch (err) {
    console.error('GET /api/invoices:', err);
    return NextResponse.json({ error: 'Failed to load invoices' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const counter = await nextInvoiceCounter();
    const invoice: Invoice = {
      id: uuidv4(),
      invoiceNumber: body.invoiceNumber || buildInvoiceNumber(counter),
      dateIssued: body.dateIssued ?? '',
      dateDue: body.dateDue ?? '',
      billTo: body.billTo ?? '',
      billCompany: body.billCompany ?? '',
      billNpwp: body.billNpwp ?? '',
      billEmail: body.billEmail ?? '',
      items: body.items ?? [],
      paidItems: body.paidItems ?? [],
      terms: body.terms ?? [],
      total: body.total ?? 0,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
    await saveInvoice(invoice);
    return NextResponse.json(invoice, { status: 201 });
  } catch (err) {
    console.error('POST /api/invoices:', err);
    return NextResponse.json({ error: 'Failed to save invoice' }, { status: 500 });
  }
}
