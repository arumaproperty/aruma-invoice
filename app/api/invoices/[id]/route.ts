import { NextRequest, NextResponse } from 'next/server';
import { getInvoice, updateInvoice } from '@/lib/sheets';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const invoice = await getInvoice(params.id);
    if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(invoice);
  } catch (err) {
    console.error('GET /api/invoices/[id]:', err);
    return NextResponse.json({ error: 'Failed to load invoice' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    await updateInvoice(params.id, body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('PUT /api/invoices/[id]:', err);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}
