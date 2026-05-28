import { NextRequest, NextResponse } from 'next/server';
import { getInvoice, updateInvoice } from '@/lib/sheets';
import { sendInvoiceEmail } from '@/lib/email';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const invoice = await getInvoice(params.id);
    if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!invoice.billEmail) {
      return NextResponse.json({ error: 'No client email on this invoice' }, { status: 400 });
    }
    await sendInvoiceEmail(invoice);
    await updateInvoice(params.id, { status: 'sent' });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    console.error('POST /api/invoices/[id]/send:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
